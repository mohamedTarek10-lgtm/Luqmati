import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

// GET /api/meals — returns authenticated user's meals
export async function GET() {
  try {
    if (!isDatabaseConfigured) {
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

    const userMeals = await db
      .select()
      .from(meals)
      .where(eq(meals.userId, userId))
      .orderBy(desc(meals.createdAt));

    return NextResponse.json({ meals: userMeals });
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

    await db.delete(meals).where(eq(meals.userId, userId));

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
