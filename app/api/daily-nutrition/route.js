import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq, gte } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals, userTargets } from "@/db/schema";

export const runtime = "nodejs";

const DEFAULT_TARGETS = {
  calorieTarget: 2400,
  proteinTarget: 160,
  carbsTarget: 280,
  fatsTarget: 80,
  fiberTarget: 30,
};

// GET /api/daily-nutrition — returns today's consumed intake vs daily targets
export async function GET() {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json({
        consumed: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, mealsCount: 0 },
        targets: DEFAULT_TARGETS,
        remaining: DEFAULT_TARGETS,
        percentages: { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
      });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "لازم تسجل دخول الأول." }, { status: 401 });
    }

    // Determine today's local start (00:00:00)
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [todayMeals, [customTargets]] = await Promise.all([
      db
        .select()
        .from(meals)
        .where(and(eq(meals.userId, userId), gte(meals.createdAt, startOfToday))),
      db
        .select()
        .from(userTargets)
        .where(eq(userTargets.userId, userId))
        .limit(1),
    ]);

    const targets = {
      calorieTarget: customTargets?.calorieTarget || DEFAULT_TARGETS.calorieTarget,
      proteinTarget: customTargets?.proteinTarget || DEFAULT_TARGETS.proteinTarget,
      carbsTarget: customTargets?.carbsTarget || DEFAULT_TARGETS.carbsTarget,
      fatsTarget: customTargets?.fatsTarget || DEFAULT_TARGETS.fatsTarget,
      fiberTarget: customTargets?.fiberTarget || DEFAULT_TARGETS.fiberTarget,
    };

    const consumed = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      fiber: 0,
      mealsCount: todayMeals.length,
    };

    for (const meal of todayMeals) {
      consumed.calories += Number(meal.calories) || 0;
      consumed.protein += Number(meal.protein) || 0;
      consumed.carbs += Number(meal.carbs) || 0;
      consumed.fats += Number(meal.fats) || 0;
      consumed.fiber += Number(meal.fiber) || 0;
    }

    consumed.calories = Math.round(consumed.calories);
    consumed.protein = Number(consumed.protein.toFixed(1));
    consumed.carbs = Number(consumed.carbs.toFixed(1));
    consumed.fats = Number(consumed.fats.toFixed(1));
    consumed.fiber = Number(consumed.fiber.toFixed(1));

    const remaining = {
      calories: Math.max(0, targets.calorieTarget - consumed.calories),
      protein: Math.max(0, Number((targets.proteinTarget - consumed.protein).toFixed(1))),
      carbs: Math.max(0, Number((targets.carbsTarget - consumed.carbs).toFixed(1))),
      fats: Math.max(0, Number((targets.fatsTarget - consumed.fats).toFixed(1))),
      fiber: Math.max(0, Number((targets.fiberTarget - consumed.fiber).toFixed(1))),
    };

    const percentages = {
      calories: Math.min(100, Math.round((consumed.calories / targets.calorieTarget) * 100)),
      protein: Math.min(100, Math.round((consumed.protein / targets.proteinTarget) * 100)),
      carbs: Math.min(100, Math.round((consumed.carbs / targets.carbsTarget) * 100)),
      fats: Math.min(100, Math.round((consumed.fats / targets.fatsTarget) * 100)),
      fiber: Math.min(100, Math.round((consumed.fiber / targets.fiberTarget) * 100)),
    };

    return NextResponse.json({
      consumed,
      targets,
      remaining,
      percentages,
      todayMeals,
    });
  } catch (err) {
    console.error("[Luqmati] Daily nutrition GET error:", err);
    return NextResponse.json({ error: "حصل خطأ أثناء حساب التغذية اليومية." }, { status: 500 });
  }
}

// POST /api/daily-nutrition — update user's daily nutritional goals
export async function POST(req) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json({ error: "قاعدة البيانات غير متاحة." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "لازم تسجل دخول الأول." }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const calorieTarget = Math.max(800, Math.min(8000, Number(body.calorieTarget) || DEFAULT_TARGETS.calorieTarget));
    const proteinTarget = Math.max(20, Math.min(500, Number(body.proteinTarget) || DEFAULT_TARGETS.proteinTarget));
    const carbsTarget = Math.max(20, Math.min(800, Number(body.carbsTarget) || DEFAULT_TARGETS.carbsTarget));
    const fatsTarget = Math.max(10, Math.min(300, Number(body.fatsTarget) || DEFAULT_TARGETS.fatsTarget));
    const fiberTarget = Math.max(5, Math.min(100, Number(body.fiberTarget) || DEFAULT_TARGETS.fiberTarget));

    await db
      .insert(userTargets)
      .values({
        userId,
        calorieTarget,
        proteinTarget,
        carbsTarget,
        fatsTarget,
        fiberTarget,
      })
      .onConflictDoUpdate({
        target: userTargets.userId,
        set: {
          calorieTarget,
          proteinTarget,
          carbsTarget,
          fatsTarget,
          fiberTarget,
          updatedAt: new Date(),
        },
      });

    return NextResponse.json({
      success: true,
      targets: { calorieTarget, proteinTarget, carbsTarget, fatsTarget, fiberTarget },
    });
  } catch (err) {
    console.error("[Luqmati] Daily nutrition POST error:", err);
    return NextResponse.json({ error: "حصل خطأ أثناء حفظ الأهداف اليومية." }, { status: 500 });
  }
}
