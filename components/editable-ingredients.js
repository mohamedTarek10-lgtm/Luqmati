"use client";

import { useState, memo } from "react";
import {
  calculateNutritionForIngredient,
  recalculateMealNutrition,
} from "@/lib/nutrition/foodDictionary";

function EditableIngredients({
  initialIngredients = [],
  currentGrams = 250,
  lang = "ar",
  t,
  onUpdateIngredients,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [prevInitialIngredients, setPrevInitialIngredients] = useState(initialIngredients);
  const [ingredients, setIngredients] = useState(initialIngredients);
  const [newIngName, setNewIngName] = useState("");
  const [newIngGrams, setNewIngGrams] = useState("50");
  const isAr = lang === "ar";

  // Sync state when new food is analyzed without cascading effect renders
  if (prevInitialIngredients !== initialIngredients) {
    setPrevInitialIngredients(initialIngredients);
    setIngredients(initialIngredients);
  }

  // Scale all ingredients when whole meal portion is adjusted
  function handleScalePortion(deltaGrams) {
    const totalCurrentGrams = ingredients.reduce((sum, i) => sum + (Number(i.estimatedGrams) || 0), 0) || currentGrams || 250;
    const targetGrams = Math.max(30, totalCurrentGrams + deltaGrams);
    const scaleFactor = targetGrams / totalCurrentGrams;

    const scaled = ingredients.map((ing) => {
      const g = Math.max(10, Math.round((Number(ing.estimatedGrams) || 50) * scaleFactor));
      const calc = calculateNutritionForIngredient(ing.nameArabic || ing.name, g);
      return {
        ...ing,
        estimatedGrams: g,
        calories: calc.calories,
        protein: calc.protein,
        carbs: calc.carbs,
        fats: calc.fats,
        fiber: calc.fiber,
        sugar: calc.sugar,
        sodium: calc.sodium,
      };
    });

    setIngredients(scaled);
    const { totals } = recalculateMealNutrition(scaled);
    if (onUpdateIngredients) {
      onUpdateIngredients(scaled, totals, targetGrams);
    }
  }

  // Adjust grams for a single ingredient
  function handleIngredientGramsChange(index, newGrams) {
    const g = Math.max(5, Number(newGrams) || 0);
    const updated = ingredients.map((ing, i) => {
      if (i !== index) return ing;
      const calc = calculateNutritionForIngredient(ing.nameArabic || ing.name, g);
      return {
        ...ing,
        estimatedGrams: g,
        calories: calc.calories,
        protein: calc.protein,
        carbs: calc.carbs,
        fats: calc.fats,
        fiber: calc.fiber,
        sugar: calc.sugar,
        sodium: calc.sodium,
      };
    });

    setIngredients(updated);
    const { totals } = recalculateMealNutrition(updated);
    if (onUpdateIngredients) {
      onUpdateIngredients(updated, totals, totals.estimatedGrams);
    }
  }

  // Remove an ingredient
  function handleRemoveIngredient(index) {
    const updated = ingredients.filter((_, i) => i !== index);
    setIngredients(updated);
    const { totals } = recalculateMealNutrition(updated);
    if (onUpdateIngredients) {
      onUpdateIngredients(updated, totals, totals.estimatedGrams);
    }
  }

  // Add a new ingredient (e.g. "فيه بسلة كمان") with automatic nutrition calculation
  function handleAddIngredient(e) {
    e.preventDefault();
    if (!newIngName.trim()) return;

    const g = Math.max(10, Number(newIngGrams) || 50);
    const computed = calculateNutritionForIngredient(newIngName.trim(), g);

    const newIng = {
      name: newIngName.trim(),
      nameArabic: newIngName.trim(),
      estimatedGrams: g,
      calories: computed.calories,
      protein: computed.protein,
      carbs: computed.carbs,
      fats: computed.fats,
      fiber: computed.fiber,
      sugar: computed.sugar,
      sodium: computed.sodium,
    };

    const updated = [...ingredients, newIng];
    setIngredients(updated);
    const { totals } = recalculateMealNutrition(updated);

    if (onUpdateIngredients) {
      onUpdateIngredients(updated, totals, totals.estimatedGrams);
    }

    setNewIngName("");
    setNewIngGrams("50");
  }

  const totalGrams = ingredients.reduce((sum, i) => sum + (Number(i.estimatedGrams) || 0), 0);

  return (
    <div className="fade-in fade-in-delay-4" style={{ marginBottom: "24px" }}>
      {/* Whole Plate Portion Quick Stepper */}
      <div
        style={{
          padding: "12px 16px",
          borderRadius: "14px",
          background: "var(--surface)",
          border: "1px solid var(--glass-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "14px",
        }}
      >
        <div>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", display: "block" }}>
            {isAr ? "وزن الطبق الإجمالي" : "Total Plate Weight"}
          </span>
          <span className="english-font" style={{ fontSize: "17px", fontWeight: 800, color: "var(--text-primary)" }}>
            ≈ {totalGrams || currentGrams} {isAr ? "جم" : "g"}
          </span>
        </div>

        {/* Stepper Buttons: [- 50g] [- 25g] [+ 25g] [+ 50g] */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <button
            type="button"
            onClick={() => handleScalePortion(-50)}
            className="btn-outline"
            style={{ padding: "4px 8px", fontSize: "12px", height: "32px", minWidth: "36px" }}
            title="-50g"
          >
            -50
          </button>
          <button
            type="button"
            onClick={() => handleScalePortion(-25)}
            className="btn-outline"
            style={{ padding: "4px 8px", fontSize: "12px", height: "32px", minWidth: "36px" }}
            title="-25g"
          >
            -25
          </button>
          <button
            type="button"
            onClick={() => handleScalePortion(+25)}
            className="btn-outline"
            style={{ padding: "4px 8px", fontSize: "12px", height: "32px", minWidth: "36px" }}
            title="+25g"
          >
            +25
          </button>
          <button
            type="button"
            onClick={() => handleScalePortion(+50)}
            className="btn-outline"
            style={{ padding: "4px 8px", fontSize: "12px", height: "32px", minWidth: "36px" }}
            title="+50g"
          >
            +50
          </button>
        </div>
      </div>

      {/* Section Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "12px",
        }}
      >
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: 0,
          }}
        >
          {t?.ingredients || "المكونات"} ({ingredients.length})
        </h3>
        <button
          type="button"
          className="btn-outline"
          onClick={() => setIsEditing(!isEditing)}
          style={{
            padding: "4px 12px",
            fontSize: "12px",
            height: "auto",
          }}
        >
          {isEditing ? (isAr ? "إغلاق التعديل ✓" : "Done Editing") : (isAr ? "تعديل المكونات والكمية ✏️" : "Edit Ingredients ✏️")}
        </button>
      </div>

      {/* Ingredients List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {ingredients.map((ing, i) => (
          <div
            key={i}
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--glass-border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: "13px",
              color: "var(--text-primary)",
            }}
          >
            <div style={{ flex: 1, minWidth: 0, marginInlineEnd: "10px" }}>
              <span style={{ fontWeight: 600 }}>
                {isAr ? ing.nameArabic || ing.name : ing.name || ing.nameArabic}
              </span>
              <div
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  marginTop: "2px",
                  display: "flex",
                  gap: "6px",
                  flexWrap: "wrap",
                }}
              >
                <span>🔥 {ing.calories || 0} kcal</span>
                <span>·</span>
                <span>💪 {ing.protein || 0}g</span>
                {ing.carbs > 0 && (
                  <>
                    <span>·</span>
                    <span>🍚 {ing.carbs}g</span>
                  </>
                )}
                {ing.fats > 0 && (
                  <>
                    <span>·</span>
                    <span>🥑 {ing.fats}g</span>
                  </>
                )}
              </div>
            </div>

            {/* Grams & Delete Controls */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {isEditing ? (
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <input
                    type="number"
                    min="5"
                    max="1500"
                    step="5"
                    value={ing.estimatedGrams || 50}
                    onChange={(e) => handleIngredientGramsChange(i, e.target.value)}
                    style={{
                      width: "60px",
                      padding: "4px 6px",
                      borderRadius: "6px",
                      border: "1px solid var(--brand)",
                      background: "var(--surface)",
                      color: "var(--text-primary)",
                      fontSize: "12px",
                      textAlign: "center",
                    }}
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{isAr ? "جم" : "g"}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveIngredient(i)}
                    style={{
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#ef4444",
                      border: "none",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "11px",
                      marginInlineStart: "4px",
                    }}
                    title={isAr ? "حذف المكون" : "Delete ingredient"}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <span className="english-font" style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 600 }}>
                  {ing.estimatedGrams}g
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add New Ingredient Form with Automatic Nutrition Estimation */}
      {isEditing && (
        <form
          onSubmit={handleAddIngredient}
          style={{
            marginTop: "12px",
            padding: "14px",
            borderRadius: "14px",
            border: "1px dashed var(--brand-soft)",
            background: "rgba(116, 190, 48, 0.05)",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          <span style={{ fontSize: "12px", fontWeight: 700, color: "var(--brand)" }}>
            {isAr ? "إضافة مكوّن جديد (مثال: بسلة، زيت، سمنة، أرز)" : "Add New Ingredient (auto-calculated)"}
          </span>
          <div style={{ display: "grid", gridTemplateColumns: "3fr 1fr auto", gap: "8px" }}>
            <input
              type="text"
              placeholder={isAr ? "اسم المكون (مثل: بسلة أو أرز)" : "Ingredient name"}
              value={newIngName}
              onChange={(e) => setNewIngName(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--glass-border)",
                background: "var(--glass)",
                color: "var(--text-primary)",
                fontSize: "13px",
              }}
            />
            <input
              type="number"
              min="5"
              max="1500"
              placeholder={isAr ? "الوزن جم" : "Grams"}
              value={newIngGrams}
              onChange={(e) => setNewIngGrams(e.target.value)}
              style={{
                padding: "8px 8px",
                borderRadius: "8px",
                border: "1px solid var(--glass-border)",
                background: "var(--glass)",
                color: "var(--text-primary)",
                fontSize: "13px",
                textAlign: "center",
              }}
            />
            <button
              type="submit"
              className="btn-primary"
              style={{
                padding: "8px 14px",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              + {isAr ? "إضافة" : "Add"}
            </button>
          </div>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            {isAr
              ? "✨ يتم حساب السعرات والبروتين والكارب تلقائياً بناءً على جدول الأكلات المصرية."
              : "✨ Calories and macros are calculated automatically from Egyptian food reference tables."}
          </span>
        </form>
      )}
    </div>
  );
}

export default memo(EditableIngredients);
