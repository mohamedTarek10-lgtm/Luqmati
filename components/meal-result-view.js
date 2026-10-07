"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { useState, memo } from "react";
import { MacroCard, getConfidenceBadge } from "./macro-card";

const ProteinRing = dynamic(() => import("./protein-ring"), { ssr: false });
const PortionScaler = dynamic(() => import("./portion-scaler"), { ssr: false });
const EditableIngredients = dynamic(() => import("./editable-ingredients"), { ssr: false });
const NutritionBenefitsCard = dynamic(() => import("./nutrition-benefits-card"), { ssr: false });
const MealShareModal = dynamic(() => import("./meal-share-modal"), { ssr: false });

export const MealResultView = memo(function MealResultView({
  result,
  preview,
  lang,
  t,
  saved,
  isGuestResult,
  isSignedIn,
  openSignIn,
  editableIngredients,
  updateResultIngredients,
  reset,
  onViewHistory,
}) {
  const [showShareModal, setShowShareModal] = useState(false);
  const conf = result ? getConfidenceBadge(result.confidence, t) : null;

  return (
    <div
      className="glass-card fade-in"
      style={{
        width: "100%",
        maxWidth: "520px",
        padding: "0 0 28px",
        overflow: "hidden",
      }}
    >
      {/* Header image & badges */}
      {preview && (
        <div style={{ position: "relative" }}>
          <Image
            src={preview}
            alt={result.foodNameArabic || result.foodName || "Food preview"}
            width={520}
            height={230}
            unoptimized
            decoding="async"
            style={{
              width: "100%",
              height: "230px",
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <span
              className="english-font"
              style={{
                background: "rgba(108,63,212,0.85)",
                color: "white",
                fontSize: "11px",
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: "20px",
                backdropFilter: "blur(8px)",
              }}
            >
              Luqmati AI
            </span>

            {conf && (
              <span
                className={`confidence-badge ${conf.cls}`}
                style={{ backdropFilter: "blur(8px)" }}
              >
                ✓ {conf.pct}
              </span>
            )}
          </div>
        </div>
      )}

      <div style={{ padding: "24px 24px 0" }}>
        {/* Dish title */}
        <h2
          className="font-arabic fade-in"
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "6px",
          }}
        >
          {lang === "ar"
            ? result.foodNameArabic || result.foodName
            : result.foodName || result.foodNameArabic}
        </h2>

        {/* Description */}
        {result.descriptionArabic && (
          <p
            className="fade-in fade-in-delay-1"
            style={{
              fontSize: "13px",
              color: "var(--text-secondary)",
              marginBottom: "20px",
              lineHeight: 1.6,
            }}
          >
            {result.descriptionArabic}
          </p>
        )}

        {/* Low confidence disclaimer */}
        {result.confidence === "low" && (
          <div
            className="fade-in"
            style={{
              padding: "10px 14px",
              borderRadius: "12px",
              background: "var(--status-warning-bg)",
              border: "1px solid var(--status-warning-border)",
              color: "var(--status-warning)",
              fontSize: "12px",
              marginBottom: "18px",
            }}
          >
            {t.lowConfidenceNote}
          </div>
        )}

        {/* Featured Ring Visualization for Protein */}
        <div
          className="glass-card fade-in"
          style={{
            padding: "24px 16px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            background:
              "linear-gradient(135deg, rgba(116, 190, 48, 0.08), rgba(108, 63, 212, 0.05))",
            border: "1px solid var(--glass-border)",
          }}
        >
          <ProteinRing
            proteinGrams={result.protein || 0}
            targetGrams={50}
          />

          {result.proteinNote && (
            <div
              style={{
                marginTop: "14px",
                padding: "8px 12px",
                borderRadius: "10px",
                background: "rgba(124,58,237,0.08)",
                border: "1px solid rgba(124,58,237,0.18)",
                color: "var(--brand)",
                fontSize: "12px",
                textAlign: "center",
              }}
            >
              💡 {result.proteinNote}
            </div>
          )}
        </div>

        {/* Calories & Macro Breakdown */}
        <div
          className="macro-card macro-card-calories fade-in"
          style={{
            marginBottom: "12px",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: 500,
                opacity: 0.8,
                marginBottom: "2px",
              }}
            >
              {t.calories}
            </div>
            <div
              className="english-font"
              style={{
                fontSize: "36px",
                fontWeight: 800,
                color: "var(--color-calories)",
              }}
            >
              {result.calories ?? "—"}
              <span
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  marginInlineStart: "4px",
                }}
              >
                {t.kcal}
              </span>
            </div>
          </div>
          <div style={{ fontSize: "34px" }}>🔥</div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "8px",
            marginBottom: "20px",
          }}
        >
          <MacroCard
            emoji="💪"
            label={t.protein}
            value={result.protein}
            unit={t.grams}
            colorClass="macro-card-protein"
            delay={1}
          />
          <MacroCard
            emoji="🍚"
            label={t.carbs}
            value={result.carbs}
            unit={t.grams}
            colorClass="macro-card-carbs"
            delay={2}
          />
          <MacroCard
            emoji="🥑"
            label={t.fats}
            value={result.fats}
            unit={t.grams}
            colorClass="macro-card-fats"
            delay={3}
          />
          <MacroCard
            emoji="🌿"
            label={lang === "ar" ? "ألياف" : "Fiber"}
            value={result.fiber ?? 0}
            unit={t.grams}
            colorClass="macro-card-carbs"
            delay={4}
          />
        </div>

        {/* Portion info */}
        {result.portion?.size && (
          <div
            className="fade-in fade-in-delay-4"
            style={{
              display: "flex",
              gap: "16px",
              padding: "12px 16px",
              borderRadius: "12px",
              background: "var(--bg-subtle)",
              marginBottom: "20px",
              fontSize: "13px",
              color: "var(--text-secondary)",
            }}
          >
            <span>
              📏 {t.portionSize}: {result.portion.size}
            </span>
            {result.portion.estimatedGrams && (
              <span>
                ⚖️ {t.weight}: {result.portion.estimatedGrams}g
              </span>
            )}
          </div>
        )}

        {/* Quick Portion Scaler */}
        <PortionScaler
          initialIngredients={editableIngredients}
          baseGrams={result.portion?.estimatedGrams || 250}
          lang={lang}
          onApplyScale={updateResultIngredients}
        />

        {/* Ingredients & Manual Correction UI */}
        <EditableIngredients
          initialIngredients={editableIngredients}
          currentGrams={result.portion?.estimatedGrams}
          lang={lang}
          t={t}
          onUpdateIngredients={updateResultIngredients}
        />

        {/* Nutrition Benefits & Micronutrients */}
        <NutritionBenefitsCard result={result} lang={lang} />

        {/* Saved Confirmation Banner */}
        {saved && (
          <div
            className="fade-in"
            style={{
              textAlign: "center",
              padding: "10px",
              borderRadius: "12px",
              background: "var(--status-success-bg)",
              border: "1px solid var(--status-success-border)",
              color: "var(--status-success)",
              fontSize: "13px",
              marginBottom: "18px",
            }}
          >
            {t.savedConfirmation}
          </div>
        )}

        {/* Guest Sign-In CTA */}
        {isGuestResult && !isSignedIn && (
          <div
            className="fade-in"
            style={{
              padding: "16px",
              borderRadius: "14px",
              background:
                "linear-gradient(135deg, rgba(116, 190, 48, 0.12), rgba(108, 63, 212, 0.08))",
              border: "1px solid var(--brand-soft)",
              marginBottom: "18px",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {t.guestTrialResult ||
                "✅ تم التحليل! سجّل دخولك لحفظ النتيجة والاستمرار"}
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: "100%", height: "44px", fontSize: "14px" }}
              onClick={() => openSignIn?.()}
            >
              {t.btnSignInToSave || "سجّل دخولك وحفظ النتيجة"}
            </button>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
          <button
            className="btn-primary"
            style={{ flex: 1, height: "48px", fontSize: "14px", minWidth: "140px" }}
            onClick={onViewHistory}
          >
            <svg
              width="17"
              height="17"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            {t.btnViewHistory}
          </button>
          <button
            className="btn-outline"
            style={{ flex: 1, height: "48px", fontSize: "14px", minWidth: "140px" }}
            onClick={reset}
          >
            {t.btnAnalyzeAnother}
          </button>

          <button
            type="button"
            className="btn-outline"
            style={{
              flex: "1 1 100%",
              height: "46px",
              fontSize: "14px",
              marginTop: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onClick={() => setShowShareModal(true)}
          >
            <span>📤</span>
            <span>
              {lang === "ar" ? "مشاركة بطاقة الوجبة" : "Share Meal Card"}
            </span>
          </button>
        </div>
      </div>

      {showShareModal && (
        <MealShareModal
          meal={{ ...result, imageUrl: preview }}
          lang={lang}
          t={t}
          onClose={() => setShowShareModal(false)}
        />
      )}
    </div>
  );
});
