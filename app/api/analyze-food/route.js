import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals } from "@/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { analyzePreparedFoodImage, buildFoodImage } from "@/lib/food-analysis/engine";
import { FoodAnalysisError } from "@/lib/food-analysis/openrouter";
import { getCachedAnalysis, setCachedAnalysis } from "@/lib/analysis-cache";
import { consumeQuota, releaseQuota } from "@/lib/quotas";
import { storeMealImage } from "@/lib/storage/meal-images";

export const runtime = "nodejs";
// Netlify does not honour 120s here; keep the declared budget honest.
export const maxDuration = 26;

// Netlify buffers requests up to 6MB, and the client already downscales to
// 1400px JPEG, so anything larger is rejected before it reaches sharp.
const MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const FREE_DAILY_LIMIT = 10;

const QUOTA_MESSAGE =
  "وصلت للحد اليومي (" + FREE_DAILY_LIMIT + " تحليلات). هيتجدد الرصيد غداً.";

function rateLimited() {
  return NextResponse.json(
    {
      error: QUOTA_MESSAGE,
      code: "daily_limit_reached",
      rateLimited: true,
      limit: FREE_DAILY_LIMIT,
      remaining: 0,
    },
    { status: 429 }
  );
}

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
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "لازم تسجل دخول الأول." }, { status: 401 });
  }

  // Reserve the unit atomically so concurrent requests cannot overspend.
  const scope = "user:" + userId;
  const quota = await consumeQuota(scope, FREE_DAILY_LIMIT);

  let dailyUsed = 0;
  if (quota) {
    if (!quota.allowed) return rateLimited();
    dailyUsed = quota.used - 1;
  } else {
    dailyUsed = await getDailyUsage(userId);
    if (dailyUsed >= FREE_DAILY_LIMIT) return rateLimited();
  }

  try {
    const formData = await req.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      await releaseQuota(scope);
      return NextResponse.json({ error: "اختار صورة أكل الأول." }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      await releaseQuota(scope);
      return NextResponse.json(
        { error: "حجم الصورة كبير جداً (أقصى حد 6MB)." },
        { status: 413 }
      );
    }

    // Decode once: the AI image and the stored thumbnail come from one buffer.
    const prepared = await buildFoodImage(bytes);

    const cached = await getCachedAnalysis(prepared.imageHash);
    const result =
      cached || (await analyzePreparedFoodImage(prepared.visionDataUrl));

    if (!cached) {
      await setCachedAnalysis(prepared.imageHash, result);
    }

    const savedMealId = crypto.randomUUID();
    const storedImage = await storeMealImage(savedMealId, {
      thumbnailBuffer: prepared.thumbnailBuffer,
      thumbnailDataUrl: prepared.thumbnailDataUrl,
    });

    if (isDatabaseConfigured && db) {
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
          imageKey: storedImage.imageKey,
          imageUrl: storedImage.imageUrl,
        })
        .catch((err) => {
          console.warn("[Luqmati] Could not save meal:", err);
        });
    }

    return NextResponse.json({
      success: true,
      result: { ...result, imageUrl: prepared.thumbnailDataUrl },
      mealId: savedMealId,
      saved: true,
      usage: {
        remaining: quota ? quota.remaining : Math.max(0, FREE_DAILY_LIMIT - dailyUsed - 1),
        limit: FREE_DAILY_LIMIT,
        unlimited: false,
      },
    });
  } catch (err) {
    // A failed or rejected analysis must not consume the user's quota.
    await releaseQuota(scope);

    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: "التحليل أخد وقت أطول من اللازم. حاول تاني." },
        { status: 504 }
      );
    }

    const status = err instanceof FoodAnalysisError ? err.status : 500;
    console.error("[Luqmati Auth] Food analysis failed:", err);

    return NextResponse.json(
      {
        error: err.message || "حصلت مشكلة أثناء تحليل الطبق. حاول تاني.",
        code: err?.code || "analysis_failed",
        isFood: err?.code === "not_food" ? false : undefined,
      },
      { status }
    );
  }
}
