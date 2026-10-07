"use client";

import { memo } from "react";

export const MacroCard = memo(function MacroCard({
  emoji,
  label,
  value,
  unit,
  colorClass,
  delay = 1,
}) {
  return (
    <div
      className={`macro-card ${colorClass} fade-in fade-in-delay-${delay}`}
      style={{ padding: "14px 10px", textAlign: "center" }}
    >
      <div style={{ fontSize: "20px", marginBottom: "4px" }}>{emoji}</div>
      <div
        style={{
          fontSize: "11px",
          fontWeight: 500,
          opacity: 0.8,
          marginBottom: "2px",
        }}
      >
        {label}
      </div>
      <div
        className="english-font"
        style={{ fontSize: "21px", fontWeight: 700, lineHeight: 1.1 }}
      >
        {value ?? "—"}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 400,
            marginInlineStart: "2px",
          }}
        >
          {unit}
        </span>
      </div>
    </div>
  );
});

export function getConfidenceBadge(confidence, t) {
  if (confidence === "high") {
    return { label: t.confidenceHigh, cls: "confidence-high", pct: "95%" };
  }
  if (confidence === "medium") {
    return { label: t.confidenceMedium, cls: "confidence-medium", pct: "75%" };
  }
  return { label: t.confidenceLow, cls: "confidence-low", pct: "50%" };
}
