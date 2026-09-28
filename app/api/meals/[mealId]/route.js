import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals } from "@/db/schema";
import { recalculateMealNutrition, generateNutritionalHighlights, generateWhyItsGood } from "@/lib/nutrition/foodDictionary";

export const runtime = "nodejs";

// GET /api/meals/[mealId] — retrieve a single meal for the authenticated user
export async function GET(req, { params }) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json({ error: "قاعدة البيانات غير متاحة." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "لازم تسجل دخول الأول." }, { status: 401 });
    }

    const { mealId } = await params;
    const [meal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .limit(1);

    if (!meal) {
      return NextResponse.json({ error: "الوجبة مش موجودة أو غير مصرح بعرضها." }, { status: 404 });
    }

    return NextResponse.json({ meal });
  } catch (err) {
    console.error("[Luqmati] GET /api/meals/[mealId] error:", err);
    return NextResponse.json({ error: "حصل خطأ أثناء جلب الوجبة." }, { status: 500 });
  }
}

// PATCH /api/meals/[mealId] — update ingredients, portions, and recalculate nutrition
export async function PATCH(req, { params }) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json({ error: "قاعدة البيانات غير متاحة." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "لازم تسجل دخول الأول." }, { status: 401 });
    }

    const { mealId } = await params;

    // Check ownership first
    const [existing] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "الوجبة مش موجودة أو غير مصرح بتعديلها." }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    const rawIngredients = Array.isArray(body.ingredients) ? body.ingredients : (existing.ingredients || []);

    // Recalculate whole-meal nutrition deterministically from updated ingredients
    const { totals, ingredients: recalculatedIngredients } = recalculateMealNutrition(rawIngredients);

    const updatedPortionSize = body.portionSize !== undefined ? String(body.portionSize).slice(0, 80) : existing.portionSize;
    const updatedEstimatedGrams = body.estimatedGrams !== undefined && Number(body.estimatedGrams) > 0
      ? Math.round(Number(body.estimatedGrams))
      : (totals.estimatedGrams || existing.estimatedGrams);

    // Deterministically enforce calculated macros from ingredients
    const updatedCalories = totals.calories;
    const updatedProtein = totals.protein;
    const updatedCarbs = totals.carbs;
    const updatedFats = totals.fats;
    const updatedFiber = totals.fiber;
    const updatedSugar = totals.sugar;
    const updatedSodium = totals.sodium;

    const updatedMicronutrients = totals.micronutrients || existing.micronutrients;
    const updatedHighlights = generateNutritionalHighlights({
      protein: updatedProtein,
      fiber: updatedFiber,
      micronutrients: updatedMicronutrients,
    });
    const updatedBenefits = generateWhyItsGood(existing.foodNameArabic || existing.foodName, recalculatedIngredients, {
      protein: updatedProtein,
      fiber: updatedFiber,
      micronutrients: updatedMicronutrients,
    });

    await db
      .update(meals)
      .set({
        portionSize: updatedPortionSize,
        estimatedGrams: updatedEstimatedGrams,
        calories: updatedCalories,
        protein: updatedProtein,
        carbs: updatedCarbs,
        fats: updatedFats,
        fiber: updatedFiber,
        sugar: updatedSugar,
        sodium: updatedSodium,
        micronutrients: updatedMicronutrients,
        nutritionHighlights: updatedHighlights,
        benefitsArabic: updatedBenefits,
        ingredients: recalculatedIngredients,
        updatedAt: new Date(),
      })
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)));

    const [updatedMeal] = await db
      .select()
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .limit(1);

    return NextResponse.json({ success: true, meal: updatedMeal });
  } catch (err) {
    console.error("[Luqmati] PATCH /api/meals/[mealId] error:", err);
    return NextResponse.json({ error: "حصل خطأ أثناء تحديث الوجبة." }, { status: 500 });
  }
}

// DELETE /api/meals/[mealId] — remove meal from user's history
export async function DELETE(req, { params }) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json({ error: "قاعدة البيانات غير متاحة." }, { status: 503 });
    }

    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "لازم تسجل دخول الأول." }, { status: 401 });
    }

    const { mealId } = await params;

    const deleted = await db
      .delete(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .returning({ id: meals.id });

    if (!deleted || deleted.length === 0) {
      return NextResponse.json({ error: "الوجبة مش موجودة أو غير مصرح بحذفها." }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedId: mealId });
  } catch (err) {
    console.error("[Luqmati] DELETE /api/meals/[mealId] error:", err);
    return NextResponse.json({ error: "حصل خطأ أثناء حذف الوجبة." }, { status: 500 });
  }
}
