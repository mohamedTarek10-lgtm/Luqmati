import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals } from "@/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { processAndAnalyzeFoodImage } from "@/lib/food-analysis/engine";
import { FoodAnalysisError } from "@/lib/food-analysis/openrouter";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const FREE_DAILY_LIMIT = 10;

async function getDailyUsage(userId) {
  if (!isDatabaseConfigured || !db) return 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const [row] = await db
    .select({ value: count() })
    .from(meals)
    .where(and(eq(meals.userId, userId), gte(meals.createdAt, startOfDay)));
  return Number(row?.value ?? 0);
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "لازم تسجل دخول الأول." }, { status: 401 });
    }

    const dailyUsed = await getDailyUsage(userId);
    if (dailyUsed >= FREE_DAILY_LIMIT) {
      return NextResponse.json(
        {
          error: `وصلت للحد اليومي (${FREE_DAILY_LIMIT} تحليلات). هيتجدد الرصيد غداً.`,
          code: "daily_limit_reached",
          rateLimited: true,
          limit: FREE_DAILY_LIMIT,
          remaining: 0,
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return NextResponse.json({ error: "اختار صورة أكل الأول." }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "حجم الصورة كبير جداً (أقصى حد 15MB)." }, { status: 413 });
    }

    // Call unified analysis engine
    const result = await processAndAnalyzeFoodImage(bytes);

    // Save to database
    let savedMealId = null;
    if (isDatabaseConfigured && db) {
      savedMealId = crypto.randomUUID();
      await db
        .insert(meals)
        .values({
          id: savedMealId,
          userId,
          foodName: result.foodName,
          foodNameArabic: result.foodNameArabic,
          descriptionArabic: result.descriptionArabic,
          portionSize: result.portion.size,
          estimatedGrams: result.portion.estimatedGrams,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fats: result.fats,
          fiber: result.fiber,
          sugar: result.sugar,
          sodium: result.sodium,
          micronutrients: result.micronutrients,
          nutritionHighlights: result.nutritionHighlights,
          benefitsArabic: result.benefitsArabic,
          proteinQualityNote: result.proteinQualityNote,
          confidence: result.confidence,
          ingredients: result.ingredients,
        })
        .catch((err) => {
          console.warn("[Luqmati] Could not save meal:", err);
        });
    }

    return NextResponse.json({
      success: true,
      result,
      mealId: savedMealId,
      saved: Boolean(savedMealId),
      usage: {
        remaining: Math.max(0, FREE_DAILY_LIMIT - dailyUsed - 1),
        limit: FREE_DAILY_LIMIT,
        unlimited: false,
      },
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "التحليل أخد وقت أطول من اللازم. حاول تاني." }, { status: 504 });
    }

    const status = err instanceof FoodAnalysisError ? err.status : 500;
    console.error("[Luqmati Auth] Food analysis failed:", err);

    return NextResponse.json(
      { error: err.message || "حصلت مشكلة أثناء تحليل الطبق. حاول تاني." },
      { status }
    );
  }
}