import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals } from "@/db/schema";
import MealDetailActions from "@/components/meal-detail-actions";

function MacroStat({ label, value, unit, emoji, color = "var(--text-primary)" }) {
  return (
    <div className="glass-card" style={{ padding: "16px 12px", textAlign: "center", borderRadius: "16px" }}>
      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{emoji}</div>
      <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginBottom: "2px", fontWeight: 600 }}>{label}</div>
      <div className="english-font" style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.1, color }}>
        {value ?? "—"}
        <span style={{ fontSize: "12px", fontWeight: 400, marginInlineStart: "2px", color: "var(--text-muted)" }}>{unit}</span>
      </div>
    </div>
  );
}

export default async function MealDetailPage({ params }) {
  const currentAuth = await auth();
  if (!currentAuth.userId) {
    redirect("/history");
  }

  if (!isDatabaseConfigured || !db) {
    notFound();
  }

  const { mealId } = await params;

  const result = await db
    .select()
    .from(meals)
    .where(and(eq(meals.id, mealId), eq(meals.userId, currentAuth.userId)))
    .limit(1);

  const meal = result[0];
  if (!meal) {
    notFound();
  }

  const ingredientList = Array.isArray(meal.ingredients) ? meal.ingredients : [];
  const micronutrients = meal.micronutrients || {};
  const highlights = Array.isArray(meal.nutritionHighlights) ? meal.nutritionHighlights : [];

  const formattedDate = new Date(meal.createdAt).toLocaleDateString("ar-EG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const confLabel = {
    high: { text: "دقة عالية", color: "#22c55e" },
    medium: { text: "دقة متوسطة", color: "#f59e0b" },
    low: { text: "دقة منخفضة (تقديرية)", color: "#ef4444" },
  }[meal.confidence] || { text: "تقديرية", color: "#f59e0b" };

  return (
    <main style={{ minHeight: "80dvh", padding: "24px 16px 48px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>
        {/* Navigation & Actions Top Bar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
          <Link
            href="/history"
            style={{
              color: "var(--brand)",
              textDecoration: "none",
              fontWeight: 700,
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontSize: "14px",
            }}
          >
            <span>→</span>
            <span>العودة لسجل الوجبات</span>
          </Link>
          <MealDetailActions mealId={meal.id} />
        </div>

        {/* Meal Title Header */}
        <div style={{ marginBottom: "20px" }}>
          <h1 className="font-arabic" style={{ fontSize: "28px", fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>
            {meal.foodNameArabic || meal.foodName}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px", color: "var(--text-secondary)" }}>
            <span>📅 {formattedDate}</span>
            <span>·</span>
            <span style={{ color: confLabel.color, fontWeight: 600 }}>● {confLabel.text}</span>
          </div>
          {meal.descriptionArabic && (
            <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "10px", lineHeight: 1.6 }}>
              {meal.descriptionArabic}
            </p>
          )}
        </div>

        {/* Optional Meal Photo */}
        {meal.imageUrl && (
          <div className="glass-card" style={{ padding: "12px", marginBottom: "20px", borderRadius: "18px" }}>
            <Image
              src={meal.imageUrl}
              alt={meal.foodNameArabic || meal.foodName}
              width={680}
              height={300}
              unoptimized
              style={{ width: "100%", maxHeight: "300px", objectFit: "cover", borderRadius: "12px" }}
            />
          </div>
        )}

        {/* Macros Breakdown Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "10px", marginBottom: "20px" }}>
          <MacroStat emoji="🔥" label="السعرات" value={meal.calories} unit="سعرة" color="var(--color-calories)" />
          <MacroStat emoji="💪" label="البروتين" value={meal.protein} unit="جم" color="var(--color-protein)" />
          <MacroStat emoji="🍚" label="الكارب" value={meal.carbs} unit="جم" color="var(--color-carbs)" />
          <MacroStat emoji="🥑" label="الدهون" value={meal.fats} unit="جم" color="var(--color-fats)" />
          {meal.fiber != null && meal.fiber > 0 && (
            <MacroStat emoji="🌿" label="الألياف" value={meal.fiber} unit="جم" color="#6ee7b7" />
          )}
          {meal.sugar != null && meal.sugar > 0 && (
            <MacroStat emoji="🍬" label="السكر" value={meal.sugar} unit="جم" color="#f472b6" />
          )}
          {meal.sodium != null && meal.sodium > 0 && (
            <MacroStat emoji="🧂" label="الصوديوم" value={meal.sodium} unit="ملجم" color="#94a3b8" />
          )}
        </div>

        {/* Meal Overview Card */}
        <div className="glass-card" style={{ padding: "18px 20px", marginBottom: "18px", borderRadius: "18px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
            تفاصيل الكمية والوزن
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", fontSize: "13px", color: "var(--text-primary)" }}>
            <div>
              <span style={{ color: "var(--text-muted)" }}>الاسم بالإنجليزي: </span>
              <strong>{meal.foodName}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>حجم الحصة: </span>
              <strong>{meal.portionSize || "طبق متوسط"}</strong>
            </div>
            <div>
              <span style={{ color: "var(--text-muted)" }}>الوزن التقريبي: </span>
              <strong className="english-font">{meal.estimatedGrams ? `${meal.estimatedGrams}g` : "—"}</strong>
            </div>
          </div>
        </div>

        {/* Why It's Good / Health Benefits */}
        {(meal.benefitsArabic || meal.proteinQualityNote || highlights.length > 0) && (
          <div className="glass-card" style={{ padding: "18px 20px", marginBottom: "18px", borderRadius: "18px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
              💡 القيمة الغذائية ومميزات الطبق
            </h3>
            {meal.benefitsArabic && (
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "12px" }}>
                {meal.benefitsArabic}
              </p>
            )}
            {meal.proteinQualityNote && (
              <div style={{ padding: "8px 12px", borderRadius: "10px", background: "var(--bg-subtle)", fontSize: "12px", color: "var(--text-primary)", marginBottom: "12px" }}>
                <strong style={{ color: "var(--brand)" }}>جودة البروتين: </strong>
                {meal.proteinQualityNote}
              </div>
            )}
            {highlights.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {highlights.map((h, i) => (
                  <span key={i} style={{ padding: "4px 10px", borderRadius: "16px", background: "var(--surface)", border: "1px solid var(--glass-border)", fontSize: "12px", fontWeight: 600 }}>
                    {h.emoji} {h.labelAr}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Ingredients Breakdown */}
        {ingredientList.length > 0 && (
          <div className="glass-card" style={{ padding: "18px 20px", marginBottom: "18px", borderRadius: "18px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              المكونات المرصودة ({ingredientList.length})
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {ingredientList.map((ingredient, index) => (
                <div
                  key={`${ingredient?.name || "ing"}-${index}`}
                  style={{
                    padding: "10px 12px",
                    borderRadius: "12px",
                    background: "var(--bg-subtle)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    fontSize: "13px",
                  }}
                >
                  <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>
                    {ingredient.nameArabic || ingredient.name}
                  </span>
                  <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "flex-end", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
                    {ingredient.estimatedGrams && <span className="english-font">{ingredient.estimatedGrams}g</span>}
                    {ingredient.calories > 0 && <span className="english-font">🔥 {ingredient.calories}kcal</span>}
                    {ingredient.protein > 0 && <span className="english-font">💪 {ingredient.protein}g</span>}
                    {ingredient.carbs > 0 && <span className="english-font">🍚 {ingredient.carbs}g</span>}
                    {ingredient.fats > 0 && <span className="english-font">🥑 {ingredient.fats}g</span>}
                    {ingredient.fiber > 0 && <span className="english-font">🌿 {ingredient.fiber}g</span>}
                    {ingredient.sugar > 0 && <span className="english-font">🍬 {ingredient.sugar}g</span>}
                    {ingredient.sodium > 0 && <span className="english-font">🧂 {ingredient.sodium}mg</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Micronutrients Grid */}
        {Object.keys(micronutrients).length > 0 && (
          <div className="glass-card" style={{ padding: "18px 20px", borderRadius: "18px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "12px" }}>
              الفيتامينات والمعادن الدقيقة
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
              {micronutrients.calcium > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--surface)", fontSize: "12px" }}>
                  🦴 كالسيوم: <strong className="english-font">{micronutrients.calcium}mg</strong>
                </div>
              )}
              {micronutrients.iron > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--surface)", fontSize: "12px" }}>
                  🩸 حديد: <strong className="english-font">{micronutrients.iron}mg</strong>
                </div>
              )}
              {micronutrients.potassium > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--surface)", fontSize: "12px" }}>
                  ⚡ بوتاسيوم: <strong className="english-font">{micronutrients.potassium}mg</strong>
                </div>
              )}
              {micronutrients.vitaminC > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--surface)", fontSize: "12px" }}>
                  🍊 فيتامين C: <strong className="english-font">{micronutrients.vitaminC}mg</strong>
                </div>
              )}
              {micronutrients.zinc > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--surface)", fontSize: "12px" }}>
                  🛡️ زنك: <strong className="english-font">{micronutrients.zinc}mg</strong>
                </div>
              )}
              {micronutrients.magnesium > 0 && (
                <div style={{ padding: "8px 10px", borderRadius: "10px", background: "var(--surface)", fontSize: "12px" }}>
                  ✨ ماغنسيوم: <strong className="english-font">{micronutrients.magnesium}mg</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
