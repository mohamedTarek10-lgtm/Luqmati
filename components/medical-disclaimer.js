"use client";

import { memo } from "react";

export const MedicalDisclaimer = memo(function MedicalDisclaimer({
  lang = "ar",
  compact = false,
}) {
  const isAr = lang === "ar";

  if (compact) {
    return (
      <div
        style={{
          marginTop: "16px",
          padding: "10px 14px",
          borderRadius: "12px",
          background: "rgba(245, 158, 11, 0.08)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          color: "var(--status-warning, #f59e0b)",
          fontSize: "12px",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        <span>⚠️ </span>
        <span>
          {isAr
            ? "تنبيه صحي: الأرقام والحسابات استرشادية مبنية على الذكاء الاصطناعي ولا تغني عن الاستشارة الطبية أو أخصائي التغذية."
            : "Health Note: Values are AI-assisted estimates and do not substitute professional medical or dietary consultation."}
        </span>
      </div>
    );
  }

  return (
    <div
      className="glass-card fade-in"
      style={{
        marginTop: "24px",
        padding: "16px 20px",
        borderRadius: "16px",
        background: "rgba(245, 158, 11, 0.07)",
        border: "1px solid rgba(245, 158, 11, 0.25)",
        textAlign: isAr ? "right" : "left",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "var(--status-warning, #f59e0b)",
          fontWeight: 700,
          fontSize: "13px",
          marginBottom: "6px",
        }}
      >
        <span>🩺</span>
        <span>
          {isAr ? "إخلاء مسؤولية طبي وصحي" : "Medical & Health Disclaimer"}
        </span>
      </div>
      <p
        style={{
          fontSize: "12px",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {isAr
          ? "تطبيق لقمتي يقدم تحليلات وحسابات سعرات وماكروز تقريبية باستخدام الذكاء الاصطناعي لمساعدتك في تتبع نظامك الغذائي. هذه المعلومات ليست نصيحة طبية أو تشخيصاً، ولا تغني عن استشارة الطبيب المختص أو أخصائي التغذية العلاجية، لا سيما للأفراد الذين يعانون من حالات صحية خاصة مثل السكري وأمراض الكلى والضغط."
          : "Luqmati provides AI-generated nutritional estimates to assist your dietary tracking. This is not medical advice, a diagnosis, or a treatment plan. Always consult a certified physician or registered dietitian before making significant dietary changes, especially if managing medical conditions like diabetes or hypertension."}
      </p>
    </div>
  );
});
