"use client";

import { memo } from "react";

function ProgressRing({ percent = 0, size = 52, stroke = 5, color = "var(--brand)" }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percent));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={stroke}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
      </svg>
      <span className="english-font" style={{ position: "absolute", fontSize: "11px", fontWeight: 700, color: "var(--text-primary)" }}>
        {clamped}%
      </span>
    </div>
  );
}

function DailyNutritionDashboard({ dailyData, lang = "ar" }) {
  if (!dailyData || !dailyData.consumed) return null;

  const isAr = lang === "ar";
  const { consumed, targets, remaining, percentages } = dailyData;

  const items = [
    {
      key: "protein",
      label: isAr ? "بروتين" : "Protein",
      consumed: consumed.protein,
      target: targets.proteinTarget,
      unit: isAr ? "جم" : "g",
      color: "var(--color-protein)",
      percent: percentages.protein,
      emoji: "💪",
    },
    {
      key: "carbs",
      label: isAr ? "كارب" : "Carbs",
      consumed: consumed.carbs,
      target: targets.carbsTarget,
      unit: isAr ? "جم" : "g",
      color: "var(--color-carbs)",
      percent: percentages.carbs,
      emoji: "🍚",
    },
    {
      key: "fats",
      label: isAr ? "دهون" : "Fats",
      consumed: consumed.fats,
      target: targets.fatsTarget,
      unit: isAr ? "جم" : "g",
      color: "var(--color-fats)",
      percent: percentages.fats,
      emoji: "🥑",
    },
    {
      key: "fiber",
      label: isAr ? "ألياف" : "Fiber",
      consumed: consumed.fiber,
      target: targets.fiberTarget,
      unit: isAr ? "جم" : "g",
      color: "#6ee7b7",
      percent: percentages.fiber,
      emoji: "🌿",
    },
  ];

  return (
    <div
      className="glass-card fade-in"
      style={{
        width: "100%",
        maxWidth: "600px",
        marginBottom: "20px",
        padding: "18px 20px",
        borderRadius: "20px",
      }}
    >
      {/* Header: Title & Calories Highlight */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>📊</span>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
              {isAr ? "تغذية اليوم" : "Today's Nutrition"}
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px", display: "block" }}>
            {consumed.mealsCount} {isAr ? "وجبات مسجلة اليوم" : "meals tracked today"}
          </span>
        </div>

        {/* Calories Progress Ring */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ textAlign: isAr ? "left" : "right" }}>
            <div className="english-font" style={{ fontSize: "17px", fontWeight: 800, color: "var(--color-calories)" }}>
              {consumed.calories}{" "}
              <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>
                / {targets.calorieTarget} {isAr ? "سعرة" : "kcal"}
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
              {isAr ? `متبقي ${remaining.calories}` : `${remaining.calories} kcal left`}
            </div>
          </div>
          <ProgressRing percent={percentages.calories} size={50} stroke={4.5} color="var(--color-calories)" />
        </div>
      </div>

      {/* Macros Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "8px",
        }}
      >
        {items.map((item) => (
          <div
            key={item.key}
            style={{
              padding: "10px 8px",
              borderRadius: "14px",
              background: "var(--bg-subtle)",
              border: "1px solid var(--glass-border)",
              textAlign: "center",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span style={{ fontSize: "14px" }}>{item.emoji}</span>
            <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>{item.label}</span>
            <div className="english-font" style={{ fontSize: "13px", fontWeight: 800, color: item.color }}>
              {item.consumed}
              <span style={{ fontSize: "10px", fontWeight: 500, color: "var(--text-muted)", marginInlineStart: "2px" }}>
                /{item.target}{item.unit}
              </span>
            </div>

            {/* Micro Progress Bar */}
            <div
              style={{
                width: "100%",
                height: "4px",
                borderRadius: "3px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden",
                marginTop: "4px",
              }}
            >
              <div
                style={{
                  width: `${Math.min(100, item.percent)}%`,
                  height: "100%",
                  background: item.color,
                  borderRadius: "3px",
                  transition: "width 0.5s ease",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(DailyNutritionDashboard);
