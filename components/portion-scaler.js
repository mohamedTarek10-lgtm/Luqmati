"use client";

import { useState } from "react";
import { recalculateMealNutrition } from "@/lib/nutrition/foodDictionary";

const SCALES = [
  { factor: 0.5, labelAr: "نصف طبق (50%)", labelEn: "Half (50%)" },
  { factor: 0.75, labelAr: "طبق إلا ربع", labelEn: "0.75x" },
  { factor: 1, labelAr: "طبق كامل (100%)", labelEn: "1x (Normal)" },
  { factor: 1.25, labelAr: "طبق وربع", labelEn: "1.25x" },
  { factor: 1.5, labelAr: "طبق ونصف", labelEn: "1.5x" },
  { factor: 2, labelAr: "طبقين (200%)", labelEn: "Double (2x)" },
];

export default function PortionScaler({
  initialIngredients = [],
  baseGrams = 250,
  lang = "ar",
  onApplyScale,
}) {
  const [activeScale, setActiveScale] = useState(1);

  const handleScaleChange = (factor) => {
    setActiveScale(factor);
    if (!initialIngredients || initialIngredients.length === 0) return;

    // Scale each ingredient proportionally
    const scaled = initialIngredients.map((item) => {
      const g = Math.round((item.estimatedGrams || item.grams || 50) * (factor / activeScale));
      return {
        ...item,
        estimatedGrams: g,
        grams: g,
      };
    });

    const newEstimatedGrams = Math.round(baseGrams * factor);
    const { totals, ingredients } = recalculateMealNutrition(scaled);

    if (onApplyScale) {
      onApplyScale(ingredients, totals, newEstimatedGrams);
    }
  };

  return (
    <div
      className="fade-in"
      style={{
        width: "100%",
        padding: "14px 16px",
        borderRadius: "14px",
        background: "var(--bg-subtle)",
        border: "1px solid var(--glass-border)",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          <span>⚖️</span>
          <span>{lang === "ar" ? "تعديل كمية الوجبة بسرعة" : "Quick Portion Scale"}</span>
        </span>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "var(--brand)",
            background: "rgba(116, 190, 48, 0.12)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          {activeScale}x
        </span>
      </div>

      {/* Scale Buttons Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "6px",
        }}
      >
        {SCALES.map(({ factor, labelAr, labelEn }) => {
          const isActive = activeScale === factor;
          return (
            <button
              key={factor}
              type="button"
              onClick={() => handleScaleChange(factor)}
              style={{
                padding: "8px 4px",
                borderRadius: "10px",
                fontSize: "12px",
                fontWeight: isActive ? 700 : 500,
                border: isActive
                  ? "1px solid var(--brand)"
                  : "1px solid var(--glass-border)",
                background: isActive
                  ? "linear-gradient(135deg, var(--brand), var(--brand-strong))"
                  : "var(--surface)",
                color: isActive ? "#ffffff" : "var(--text-secondary)",
                cursor: "pointer",
                transition: "all 0.2s ease",
                boxShadow: isActive ? "0 2px 8px rgba(116, 190, 48, 0.3)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
            >
              {lang === "ar" ? labelAr : labelEn}
            </button>
          );
        })}
      </div>
    </div>
  );
}
