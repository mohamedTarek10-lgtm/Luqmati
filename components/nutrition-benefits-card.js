"use client";

import { useState, memo } from "react";

function NutritionBenefitsCard({ result, lang = "ar" }) {
  const [showMicronutrients, setShowMicronutrients] = useState(false);
  const isAr = lang === "ar";

  if (!result) return null;

  const highlights = Array.isArray(result.nutritionHighlights) ? result.nutritionHighlights : [];
  const micronutrients = result.micronutrients || {};
  const hasMicros = Object.keys(micronutrients).some((k) => Number(micronutrients[k]) > 0);

  const microLabels = {
    calcium: { labelAr: "كالسيوم", labelEn: "Calcium", unit: "mg", emoji: "🦴" },
    iron: { labelAr: "حديد", labelEn: "Iron", unit: "mg", emoji: "🩸" },
    potassium: { labelAr: "بوتاسيوم", labelEn: "Potassium", unit: "mg", emoji: "⚡" },
    magnesium: { labelAr: "ماغنسيوم", labelEn: "Magnesium", unit: "mg", emoji: "✨" },
    zinc: { labelAr: "زنك", labelEn: "Zinc", unit: "mg", emoji: "🛡️" },
    vitaminC: { labelAr: "فيتامين C", labelEn: "Vitamin C", unit: "mg", emoji: "🍊" },
    vitaminA: { labelAr: "فيتامين A", labelEn: "Vitamin A", unit: "mcg", emoji: "👁️" },
    vitaminD: { labelAr: "فيتامين D", labelEn: "Vitamin D", unit: "mcg", emoji: "☀️" },
    vitaminB12: { labelAr: "فيتامين B12", labelEn: "Vitamin B12", unit: "mcg", emoji: "🧠" },
    vitaminB6: { labelAr: "فيتامين B6", labelEn: "Vitamin B6", unit: "mg", emoji: "🔋" },
    folate: { labelAr: "حمض الفوليك", labelEn: "Folate", unit: "mcg", emoji: "🌱" },
    sodium: { labelAr: "صوديوم", labelEn: "Sodium", unit: "mg", emoji: "🧂" },
  };

  return (
    <div
      className="glass-card fade-in"
      style={{
        padding: "20px 18px",
        marginBottom: "20px",
        borderRadius: "18px",
      }}
    >
      {/* "Why is this food good?" Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <span style={{ fontSize: "18px" }}>💡</span>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
          {isAr ? "ليه الوجبة دي مفيدة؟" : "Why is this food good?"}
        </h3>
      </div>

      {/* Natural text explanation */}
      {result.benefitsArabic && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--text-secondary)",
            lineHeight: 1.6,
            marginBottom: "14px",
          }}
        >
          {result.benefitsArabic}
        </p>
      )}

      {/* Protein Quality Context */}
      {result.proteinQualityNote && (
        <div
          style={{
            padding: "10px 14px",
            borderRadius: "12px",
            background: "rgba(116, 190, 48, 0.1)",
            border: "1px solid var(--brand-soft)",
            color: "var(--text-primary)",
            fontSize: "12px",
            lineHeight: 1.5,
            marginBottom: "14px",
          }}
        >
          <strong style={{ color: "var(--brand)", display: "block", marginBottom: "2px" }}>
            {isAr ? "جودة البروتين وتكامل الأحماض الأمينية:" : "Protein Quality & Amino Acids:"}
          </strong>
          {result.proteinQualityNote}
        </div>
      )}

      {/* Nutrition Highlights Badges */}
      {highlights.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "14px" }}>
          {highlights.map((h, i) => (
            <div
              key={i}
              title={h.descAr || ""}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "5px 10px",
                borderRadius: "20px",
                background: "var(--bg-subtle)",
                border: "1px solid var(--glass-border)",
                fontSize: "12px",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <span>{h.emoji}</span>
              <span>{isAr ? h.labelAr : (h.labelEn || h.labelAr)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Micronutrients Toggle & Drawer */}
      {hasMicros && (
        <div style={{ borderTop: "1px solid var(--glass-border)", paddingTop: "12px" }}>
          <button
            type="button"
            onClick={() => setShowMicronutrients(!showMicronutrients)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--brand)",
              fontSize: "13px",
              fontWeight: 600,
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>{showMicronutrients ? "▲" : "▼"}</span>
            <span>
              {showMicronutrients
                ? (isAr ? "إخفاء الفيتامينات والمعادن" : "Hide Vitamins & Minerals")
                : (isAr ? "عرض تفاصيل الفيتامينات والمعادن الدقيقة" : "View Micronutrients & Minerals")}
            </span>
          </button>

          {showMicronutrients && (
            <div
              className="fade-in"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              {Object.entries(micronutrients).map(([key, value]) => {
                const info = microLabels[key];
                if (!info || Number(value) <= 0) return null;

                return (
                  <div
                    key={key}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "10px",
                      background: "var(--surface)",
                      border: "1px solid var(--glass-border)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "14px" }}>{info.emoji}</span>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        {isAr ? info.labelAr : info.labelEn}
                      </span>
                    </div>
                    <span className="english-font" style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                      {value} <span style={{ fontSize: "10px", fontWeight: 400, color: "var(--text-muted)" }}>{info.unit}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Accuracy & Educational Notice */}
      <div
        style={{
          marginTop: "12px",
          paddingTop: "10px",
          borderTop: "1px solid var(--glass-border)",
          fontSize: "11px",
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        ℹ️ {isAr
          ? "القيم الغذائية تقديرية بناءً على الصورة والمكونات الظاهرة؛ لا تعد نصيحة طبية."
          : "Nutritional values are estimates based on the visible dish and portion; not medical advice."}
      </div>
    </div>
  );
}

export default memo(NutritionBenefitsCard);
