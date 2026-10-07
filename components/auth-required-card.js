"use client";

import { SignInButton } from "@clerk/nextjs";

export default function AuthRequiredCard({
  icon = "🔒",
  title,
  subtitle,
  btnText,
}) {
  return (
    <div
      style={{
        minHeight: "75dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        textAlign: "center",
      }}
    >
      <div
        className="glass-card fade-in"
        style={{ padding: "40px 28px", maxWidth: "380px", width: "100%" }}
      >
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>{icon}</div>
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "10px",
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginBottom: "24px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        )}
        <SignInButton mode="modal">
          <button
            className="btn-primary"
            style={{ width: "100%", height: "48px", fontSize: "15px" }}
          >
            {btnText}
          </button>
        </SignInButton>
      </div>
    </div>
  );
}
