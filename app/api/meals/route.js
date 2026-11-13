import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals } from "@/db/schema";
import { eq, and, desc, lt, count, sql } from "drizzle-orm";
import { deleteMealThumbnail, storeMealImage } from "@/lib/storage/meal-images";

export const runtime = "nodejs";

const DEFAULT_PAGE_SIZE = 20;

// Slim list shape: no ingredients, micronutrients or image bytes.
const listColumns = {
  id: meals.id,
  foodName: meals.foodName,
  foodNameArabic: meals.foodNameArabic,
  calories: meals.calories,
  protein: meals.protein,
  carbs: meals.carbs,
  fats: meals.fats,
  confidence: meals.confidence,
  portionSize: meals.portionSize,
  estimatedGrams: meals.estimatedGrams,
  createdAt: meals.createdAt,
  hasImage: sql`(${meals.imageKey} is not null or ${meals.imageUrl} like 'data:image/%')`,
};

// GET /api/meals?cursor=ISO&limit=20 — one page of the user's meals
export async function GET(request) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json(
        { error: "قاعدة البيانات غير مُعدة بعد. أضف رابط Neon الصحيح في DATABASE_URL." },
        { status: 503 }
      );
    }

    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "لازم تسجل دخول الأول." },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const requested = Number(url.searchParams.get("limit"));
    const limit = Number.isFinite(requested)
      ? Math.min(Math.max(Math.trunc(requested), 1), 50)
      : DEFAULT_PAGE_SIZE;

    const cursorRaw = url.searchParams.get("cursor");
    const conditions = [eq(meals.userId, userId)];

    if (cursorRaw) {
      const cursorDate = new Date(cursorRaw);
      if (!Number.isNaN(cursorDate.getTime())) {
        conditions.push(lt(meals.createdAt, cursorDate));
      }
    }

    const rows = await db
      .select(listColumns)
      .from(meals)
      .where(and(...conditions))
      .orderBy(desc(meals.createdAt))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    // Total is only needed for the header count on the first page.
    let total = null;
    if (!cursorRaw) {
      const [row] = await db
        .select({ value: count() })
        .from(meals)
        .where(eq(meals.userId, userId));
      total = Number(row?.value ?? 0);
    }

    return NextResponse.json({
      meals: page,
      hasMore,
      total,
      nextCursor: hasMore && page.length ? page[page.length - 1].createdAt : null,
    });
  } catch (error) {
    console.error("GET /api/meals error:", error);
    return NextResponse.json(
      { error: "حصل خطأ أثناء جلب الوجبات." },
      { status: 500 }
    );
  }
}

// POST /api/meals — saves a guest meal or new meal into user's account
export async function POST(req) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json(
        { error: "قاعدة البيانات غير مُعدة بعد." },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "لازم تسجل دخول لحفظ الوجبة." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { result } = body;

    if (!result || !result.foodNameArabic) {
      return NextResponse.json(
        { error: "بيانات الوجبة غير مكتملة." },
        { status: 400 }
      );
    }

    const newMealId = crypto.randomUUID();
    const image = await storeMealImage(newMealId, {
      thumbnailDataUrl: result.thumbnailDataUrl || result.imageUrl || body.imageUrl || null,
    });

    await db.insert(meals).values({
      id: newMealId,
      userId,
      foodName: result.foodName || "Meal",
      foodNameArabic: result.foodNameArabic,
      descriptionArabic: result.descriptionArabic || "",
      portionSize: result.portion?.size || "طبق متوسط",
      estimatedGrams: result.portion?.estimatedGrams || 250,
      calories: result.calories || 0,
      protein: result.protein || 0,
      carbs: result.carbs || 0,
      fats: result.fats || 0,
      fiber: result.fiber || 0,
      sugar: result.sugar || 0,
      sodium: result.sodium || 0,
      micronutrients: result.micronutrients || {},
      nutritionHighlights: result.nutritionHighlights || [],
      benefitsArabic: result.benefitsArabic || "",
      proteinQualityNote: result.proteinQualityNote || "",
      confidence: result.confidence || "high",
      ingredients: result.ingredients || [],
      imageKey: image.imageKey,
      imageUrl: image.imageUrl,
    });

    return NextResponse.json({
      success: true,
      mealId: newMealId,
      message: "تم حفظ الوجبة بنجاح في حسابك!",
    });
  } catch (error) {
    console.error("POST /api/meals error:", error);
    return NextResponse.json(
      { error: "حدث خطأ أثناء حفظ الوجبة." },
      { status: 500 }
    );
  }
}

// DELETE /api/meals — clears ALL meals for the authenticated user
export async function DELETE() {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json(
        { error: "قاعدة البيانات غير متاحة." },
        { status: 503 }
      );
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "لازم تسجل دخول الأول." },
        { status: 401 }
      );
    }

    const stored = await db
      .select({ imageKey: meals.imageKey })
      .from(meals)
      .where(eq(meals.userId, userId));

    await db.delete(meals).where(eq(meals.userId, userId));

    // Images live outside Postgres; clean them up without blocking the response.
    await Promise.allSettled(
      stored.filter((row) => row.imageKey).map((row) => deleteMealThumbnail(row.imageKey))
    );

    return NextResponse.json({
      success: true,
      message: "تم مسح سجل الوجبات بالكامل بنجاح.",
    });
  } catch (error) {
    console.error("DELETE /api/meals error:", error);
    return NextResponse.json(
      { error: "حصل خطأ أثناء مسح السجل." },
      { status: 500 }
    );
  }
}
