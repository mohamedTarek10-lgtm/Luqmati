"use client";

import { useState, useEffect } from "react";

const NUTRITION_TIPS = [
  {
    icon: "🌱",
    textAr: "الفول المدمس والبقوليات من أغنى مصادر الألياف والبروتين النباتي المشبع.",
    textEn: "Fava beans and legumes are rich in plant protein and dietary fiber.",
  },
  {
    icon: "🍋",
    textAr: "إضافة عصير الليمون أو فيتامين C للوجبة يضاعف امتصاص الحديد النباتي في الجسم.",
    textEn: "Adding lemon or Vitamin C helps boost plant-based iron absorption.",
  },
  {
    icon: "🥩",
    textAr: "البروتين يحتاج طاقة أكبر لهضمه مقارنة بالكربوهيدرات والدهون، مما يعزز الحرق.",
    textEn: "Protein has a higher thermic effect, helping boost satiety and metabolic rate.",
  },
  {
    icon: "🍚",
    textAr: "طبق الكشري المصري يشكل بروتيناً كاملاً عند دمج الأرز مع العدس والحمص.",
    textEn: "Koshari provides complete amino acids by combining rice, lentils, and chickpeas.",
  },
  {
    icon: "🥑",
    textAr: "الدهون الصحية مثل زيت الزيتون والمكسرات أساسية لامتصاص الفيتامينات الذائبة في الدهون.",
    textEn: "Healthy fats are essential for absorbing fat-soluble vitamins (A, D, E, K).",
  },
  {
    icon: "🥗",
    textAr: "بدء وجبتك بطبق السلطة الخضراء يقلل من سرعة ارتفاع سكر الدم بعد الأكل.",
    textEn: "Starting meals with a fresh salad helps regulate post-meal blood glucose spikes.",
  },
];

export default function AnalyzingLoader({ stepText, lang = "ar" }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % NUTRITION_TIPS.length);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  const currentTip = NUTRITION_TIPS[tipIndex];

  return (
    <div
      className="fade-in"
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "18px",
        padding: "20px 0 10px",
      }}
    >
      {/* Animated Spinner with Glow */}
      <div style={{ position: "relative", width: "54px", height: "54px" }}>
        <div
          className="spinner"
          style={{
            width: "54px",
            height: "54px",
            borderWidth: "3.5px",
          }}
        />
        <span
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "20px",
            animation: "pulse 1.8s infinite ease-in-out",
          }}
        >
          ✨
        </span>
      </div>

      {/* Main Step Text */}
      <div style={{ textAlign: "center" }}>
        <p
          style={{
            color: "var(--text-primary)",
            fontSize: "15px",
            fontWeight: 700,
            marginBottom: "4px",
          }}
        >
          {stepText || (lang === "ar" ? "جاري تحليل طبقك بالذكاء الاصطناعي..." : "Analyzing your dish...")}
        </p>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "12px",
          }}
        >
          {lang === "ar" ? "نحدد المكونات، السعرات، ونسب الماكروز بدقة" : "Estimating macros, calories, and ingredients"}
        </p>
      </div>

      {/* Interactive Rotating Fact Card */}
      <div
        className="fade-in"
        key={tipIndex}
        style={{
          width: "100%",
          maxWidth: "460px",
          padding: "14px 16px",
          borderRadius: "14px",
          background: "linear-gradient(135deg, rgba(116, 190, 48, 0.08), rgba(108, 63, 212, 0.06))",
          border: "1px solid var(--glass-border)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          textAlign: lang === "ar" ? "right" : "left",
        }}
      >
        <div
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "10px",
            background: "var(--bg-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "18px",
            flexShrink: 0,
          }}
        >
          {currentTip.icon}
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "var(--brand)",
              marginBottom: "2px",
            }}
          >
            {lang === "ar" ? "معلومة غذائية سريعة 💡" : "Quick Nutrition Fact 💡"}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "var(--text-secondary)",
              lineHeight: 1.45,
            }}
          >
            {lang === "ar" ? currentTip.textAr : currentTip.textEn}
          </div>
        </div>
      </div>
    </div>
  );
}
