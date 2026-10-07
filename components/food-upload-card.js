"use client";

import Image from "next/image";
import { memo } from "react";
import AnalyzingLoader from "./analyzing-loader";

export const FoodUploadCard = memo(function FoodUploadCard({
  preview,
  dragOver,
  file,
  loading,
  analyzingStep,
  error,
  rateLimitInfo,
  usage,
  isGuestTrialUsed,
  isSignedIn,
  isLoaded,
  lang,
  t,
  fileInput,
  cameraInput,
  onFileInput,
  onDrop,
  onDragOver,
  onDragLeave,
  analyzeFood,
  reset,
}) {
  return (
    <div
      className="glass-card fade-in"
      style={{
        width: "100%",
        maxWidth: "600px",
        padding: "36px 28px 32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Header & Usage Counter */}
      <div
        style={{
          display: "flex",
          width: "100%",
          justifyContent: "flex-end",
          alignItems: "center",
          marginBottom: "16px",
        }}
      >
        {usage && !usage.unlimited && (
          <div className="usage-counter">
            <span
              className="usage-dot"
              style={{
                background: usage.remaining > 0 ? "#22c55e" : "#ef4444",
              }}
            />
            <span>
              {usage.remaining} / {usage.limit} {t.analysesLeft}
            </span>
          </div>
        )}
      </div>

      <h1
        className="font-arabic"
        style={{
          fontSize: "clamp(26px, 6vw, 38px)",
          fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: "8px",
          lineHeight: 1.25,
        }}
      >
        {t.heroTitle}
      </h1>

      <p
        style={{
          fontSize: "14px",
          color: "var(--text-secondary)",
          marginBottom: "28px",
        }}
      >
        {t.heroSubtitle}
      </p>

      {/* Upload Zone / Image Preview */}
      {!preview ? (
        <div
          className={`upload-zone ${dragOver ? "drag-active" : ""}`}
          style={{
            width: "100%",
            minHeight: "210px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "36px 20px",
            marginBottom: "24px",
            gap: "14px",
          }}
          onClick={() => fileInput.current?.click()}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background:
                "linear-gradient(135deg, var(--brand), var(--brand-strong))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 8px 24px rgba(116, 190, 48, 0.35)",
            }}
          >
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="white"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
          </div>
          <p
            style={{
              fontSize: "13px",
              color: "var(--text-muted)",
              fontWeight: 500,
            }}
          >
            {t.uploadHint}
          </p>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            marginBottom: "20px",
            position: "relative",
          }}
        >
          <Image
            src={preview}
            alt="Food preview"
            width={600}
            height={260}
            unoptimized
            decoding="async"
            style={{
              width: "100%",
              maxHeight: "260px",
              objectFit: "cover",
              borderRadius: "18px",
              border: "1px solid var(--glass-border)",
            }}
          />
          <button
            onClick={reset}
            title={t.btnChangeImage}
            style={{
              position: "absolute",
              top: "10px",
              left: lang === "ar" ? "auto" : "10px",
              right: lang === "ar" ? "10px" : "auto",
              background: "rgba(0,0,0,0.6)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              width: "36px",
              height: "36px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(6px)",
            }}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        onChange={onFileInput}
        style={{ display: "none" }}
      />
      <input
        ref={cameraInput}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onFileInput}
        style={{ display: "none" }}
      />

      {/* Error & Rate Limit Alerts */}
      {error && (
        <div
          style={{
            width: "100%",
            padding: "12px 16px",
            borderRadius: "12px",
            background: "var(--status-error-bg)",
            border: "1px solid var(--status-error-border)",
            color: "var(--status-error)",
            fontSize: "13px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <p>{error}</p>
          {file && !loading && !rateLimitInfo && (
            <button
              type="button"
              className="btn-outline"
              onClick={analyzeFood}
              style={{
                marginTop: "10px",
                padding: "7px 14px",
                fontSize: "12px",
              }}
            >
              {t.btnRetry}
            </button>
          )}
          {rateLimitInfo?.resetAt && (
            <p
              style={{
                marginTop: "6px",
                fontSize: "12px",
                fontWeight: 600,
                opacity: 0.9,
              }}
            >
              ⏳ {t.resetIn}{" "}
              {new Date(rateLimitInfo.resetAt).toLocaleTimeString(
                lang === "ar" ? "ar-EG" : "en-US",
                { hour: "2-digit", minute: "2-digit" }
              )}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      {!preview ? (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <button
            className="btn-primary"
            style={{ width: "100%", height: "52px", fontSize: "16px" }}
            onClick={() => cameraInput.current?.click()}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z"
              />
            </svg>
            {t.btnCamera}
          </button>

          <button
            className="btn-outline"
            style={{ width: "100%", height: "52px", fontSize: "15px" }}
            onClick={() => fileInput.current?.click()}
          >
            <svg
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
              />
            </svg>
            {t.btnGallery}
          </button>
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
          }}
        >
          {loading && (
            <div
              style={{
                textAlign: "center",
                padding: "20px 0",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <AnalyzingLoader stepText={analyzingStep} lang={lang} />
            </div>
          )}

          {!loading && (
            <>
              {!isLoaded ? null : !isSignedIn ? (
                <>
                  <button
                    className="btn-primary"
                    style={{ width: "100%", height: "52px", fontSize: "16px" }}
                    onClick={analyzeFood}
                    disabled={loading}
                  >
                    <svg
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                      />
                    </svg>
                    {isGuestTrialUsed
                      ? t.btnSignInContinue || "سجّل دخول للاستمرار"
                      : t.btnAnalyze}
                  </button>
                  <p
                    style={{
                      textAlign: "center",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {isGuestTrialUsed
                      ? t.guestTrialExpired ||
                        "استخدمت تجربتك المجانية. سجّل دخولك للمتابعة."
                      : t.guestTrialBanner || "🎁 تحليل مجاني واحد للزوار"}
                  </p>
                </>
              ) : (
                <button
                  className="btn-primary"
                  style={{ width: "100%", height: "52px", fontSize: "16px" }}
                  onClick={analyzeFood}
                  disabled={loading}
                >
                  <svg
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                    />
                  </svg>
                  {t.btnAnalyze}
                </button>
              )}

              <button
                className="btn-outline"
                style={{ width: "100%", height: "44px", fontSize: "14px" }}
                onClick={reset}
              >
                {t.btnChangeImage}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
});
