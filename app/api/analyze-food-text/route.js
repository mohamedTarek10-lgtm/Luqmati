import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals, guestUsage } from "@/db/schema";
import { eq, and, gte, count } from "drizzle-orm";
import { processAndAnalyzeFoodText } from "@/lib/food-analysis/engine";
import { FoodAnalysisError } from "@/lib/food-analysis/openrouter";

export const runtime = "nodejs";
export const maxDuration = 120;

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

function getClientIp(req) {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown-ip";
  }
  return "unknown-ip";
}

export async function POST(req) {
  try {
    const { userId } = await auth();
    const body = await req.json().catch(() => ({}));
    const text = body?.text?.trim();

    if (!text) {
      return NextResponse.json(
        { error: "يرجى كتابة أو تسجيل وصف الوجبة أولاً." },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: "وصف الوجبة طويل جداً (أقصى حد 500 حرف)." },
        { status: 400 }
      );
    }

    // ── Signed In Flow ───────────────────────────────────────────────────────
    if (userId) {
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

      // Analyze text description
      const result = await processAndAnalyzeFoodText(text);

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
            imageUrl: null, // text meal has no photo
          })
          .catch((err) => {
            console.warn("[Luqmati Text] Could not save meal:", err);
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
    }

    // ── Guest Flow ───────────────────────────────────────────────────────────
    const ip = getClientIp(req);
    // Analyze text description
    const result = await processAndAnalyzeFoodText(text);

    return NextResponse.json({
      success: true,
      result,
      guestTrial: true,
      remaining: 0,
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      return NextResponse.json(
        { error: "التحليل أخد وقت أطول من اللازم. حاول تاني." },
        { status: 504 }
      );
    }

    const status = err instanceof FoodAnalysisError ? err.status : 500;
    console.error("[Luqmati Text] Food analysis failed:", err);

    return NextResponse.json(
      {
        error: err.message || "حصلت مشكلة أثناء تحليل الوجبة. حاول تاني.",
        code: err?.code || "analysis_failed",
        isFood: err?.code === "not_food" ? false : undefined,
      },
      { status }
    );
  }
}
