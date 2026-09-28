"use client";

import { useState, useRef } from "react";

export default function MealShareModal({
  isOpen,
  onClose,
  result,
  previewImage,
  lang = "ar",
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const cardRef = useRef(null);

  if (!isOpen || !result) return null;

  const dishTitle =
    lang === "ar"
      ? result.foodNameArabic || result.foodName
      : result.foodName || result.foodNameArabic;

  const shareText = `🍽️ ${dishTitle}\n🔥 ${result.calories || 0} سعرة حرارية\n💪 بروتين: ${result.protein || 0} جم\n🍚 كربوهيدرات: ${result.carbs || 0} جم\n🥑 دهون: ${result.fats || 0} جم\n\nتم التحليل عبر تطبيق لقمتي الذكي 🥗`;

  const handleCopyText = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopyStatus(lang === "ar" ? "تم نسخ الملخص! ✅" : "Copied! ✅");
      setTimeout(() => setCopyStatus(""), 2500);
    } catch {
      setCopyStatus(lang === "ar" ? "تعذر النسخ" : "Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `وجبة ${dishTitle} - لقمتي`,
          text: shareText,
          url: typeof window !== "undefined" ? window.location.origin : "",
        });
      } catch {}
    } else {
      handleCopyText();
    }
  };

  const handleDownloadImage = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Draw Background
      const bgGrad = ctx.createLinearGradient(0, 0, 1080, 1080);
      bgGrad.addColorStop(0, "#0e131f");
      bgGrad.addColorStop(1, "#1a2238");
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 1080, 1080);

      // Load and Draw Image if present
      if (previewImage) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.src = previewImage;
          await new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
          // Draw rounded dish image
          ctx.save();
          ctx.beginPath();
          ctx.roundRect(80, 80, 920, 500, [32]);
          ctx.clip();
          ctx.drawImage(img, 80, 80, 920, 500);
          ctx.restore();
        } catch {}
      }

      // Title & Luqmati Badge
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 44px 'Segoe UI', Tahoma, Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(dishTitle, 540, 640);

      // Calories Pill
      ctx.fillStyle = "#74be30";
      ctx.font = "bold 64px 'Segoe UI', Tahoma, Arial, sans-serif";
      ctx.fillText(`${result.calories || 0} Kcal 🔥`, 540, 730);

      // Macros Grid (Protein, Carbs, Fats)
      const macros = [
        { label: "💪 بروتين", val: `${result.protein || 0}g`, x: 230 },
        { label: "🍚 كربوهيدرات", val: `${result.carbs || 0}g`, x: 540 },
        { label: "🥑 دهون", val: `${result.fats || 0}g`, x: 850 },
      ];

      macros.forEach(({ label, val, x }) => {
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.roundRect(x - 130, 780, 260, 130, [20]);
        ctx.fill();

        ctx.fillStyle = "#a0aec0";
        ctx.font = "30px 'Segoe UI', Tahoma, Arial, sans-serif";
        ctx.fillText(label, x, 830);

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 40px 'Segoe UI', Tahoma, Arial, sans-serif";
        ctx.fillText(val, x, 885);
      });

      // Footer Branding
      ctx.fillStyle = "#718096";
      ctx.font = "26px 'Segoe UI', Tahoma, Arial, sans-serif";
      ctx.fillText("لقمتي | Luqmati AI Food Intelligence", 540, 990);

      // Download trigger
      const link = document.createElement("a");
      link.download = `luqmati-${dishTitle.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Canvas export failed:", err);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px",
      }}
      onClick={onClose}
    >
      <div
        className="glass-card fade-in"
        style={{
          width: "100%",
          maxWidth: "440px",
          padding: "24px",
          borderRadius: "24px",
          position: "relative",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        ref={cardRef}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          style={{
            position: "absolute",
            top: "16px",
            left: lang === "ar" ? "16px" : "auto",
            right: lang === "ar" ? "auto" : "16px",
            background: "var(--bg-subtle)",
            border: "1px solid var(--glass-border)",
            color: "var(--text-primary)",
            borderRadius: "50%",
            width: "32px",
            height: "32px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: "center", marginBottom: "18px" }}>
          <span style={{ fontSize: "28px" }}>📤</span>
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginTop: "6px",
            }}
          >
            {lang === "ar" ? "مشاركة بطاقة الوجبة" : "Share Meal Card"}
          </h3>
          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            {lang === "ar" ? "شارك تفاصيل وجبتك وسعراتها مع أصدقائك" : "Share your meal macros & stats"}
          </p>
        </div>

        {/* Mini Preview Card */}
        <div
          style={{
            borderRadius: "16px",
            background: "var(--bg-subtle)",
            border: "1px solid var(--glass-border)",
            padding: "14px",
            marginBottom: "20px",
            textAlign: "center",
          }}
        >
          {previewImage && (
            <img
              src={previewImage}
              alt={dishTitle}
              style={{
                width: "100%",
                height: "160px",
                objectFit: "cover",
                borderRadius: "12px",
                marginBottom: "12px",
              }}
            />
          )}
          <h4 style={{ fontSize: "16px", fontWeight: 700, color: "var(--text-primary)" }}>
            {dishTitle}
          </h4>
          <div
            style={{
              fontSize: "24px",
              fontWeight: 800,
              color: "var(--brand)",
              margin: "6px 0",
            }}
          >
            {result.calories || 0} <span style={{ fontSize: "14px" }}>سعرة</span>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: "14px",
              fontSize: "12px",
              color: "var(--text-secondary)",
            }}
          >
            <span>💪 {result.protein || 0}g بروتين</span>
            <span>🍚 {result.carbs || 0}g كارب</span>
            <span>🥑 {result.fats || 0}g دهون</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <button
            type="button"
            className="btn-primary"
            style={{ width: "100%", height: "46px", fontSize: "14px" }}
            onClick={handleNativeShare}
          >
            <span>📱</span>
            <span>{lang === "ar" ? "مشاركة عبر التطبيقات (واتساب / ستوري)" : "Share via Apps"}</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            style={{ width: "100%", height: "44px", fontSize: "13px" }}
            onClick={handleDownloadImage}
          >
            <span>📥</span>
            <span>{lang === "ar" ? "تحميل صورة البطاقة (PNG)" : "Download Card Image"}</span>
          </button>

          <button
            type="button"
            className="btn-outline"
            style={{ width: "100%", height: "44px", fontSize: "13px" }}
            onClick={handleCopyText}
          >
            <span>📋</span>
            <span>{copyStatus || (lang === "ar" ? "نسخ نص ملخص الوجبة" : "Copy Text Summary")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
