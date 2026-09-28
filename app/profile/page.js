"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useLang } from "../../hooks/i18n-context";
import { ProfileAvatarBadge } from "../../components/profile-avatar";

export default function ProfilePage() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { t, lang } = useLang();
  const [mealCount, setMealCount] = useState(null);
  const [targets, setTargets] = useState({
    calorieTarget: 2400,
    proteinTarget: 160,
    carbsTarget: 280,
    fatsTarget: 80,
    fiberTarget: 30,
  });
  const [savingTargets, setSavingTargets] = useState(false);
  const [targetSavedMsg, setTargetSavedMsg] = useState("");

  useEffect(() => {
    if (!isSignedIn) return;

    let isMounted = true;
    fetch("/api/meals")
      .then((r) => r.json())
      .then((d) => {
        if (isMounted) {
          setMealCount(d.meals?.length ?? 0);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch meals:", err);
      });

    fetch("/api/daily-nutrition")
      .then((r) => r.json())
      .then((d) => {
        if (isMounted && d.targets) {
          setTargets(d.targets);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isSignedIn]);

  const handleSaveTargets = async (e) => {
    e.preventDefault();
    if (!isSignedIn) return;
    setSavingTargets(true);
    setTargetSavedMsg("");
    try {
      const res = await fetch("/api/daily-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(targets),
      });
      if (res.ok) {
        setTargetSavedMsg(
          lang === "ar"
            ? "تم حفظ الأهداف اليومية بنجاح!"
            : "Goals saved successfully!",
        );
        setTimeout(() => setTargetSavedMsg(""), 3000);
      }
    } catch {
      console.warn("Failed to save goals");
    } finally {
      setSavingTargets(false);
    }
  };

  if (!isLoaded) {
    return (
      <div
        style={{
          minHeight: "80dvh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div
        style={{
          minHeight: "80dvh",
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
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>👤</div>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "10px",
            }}
          >
            {t.loginRequired}
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              marginBottom: "24px",
            }}
          >
            {t.loginToSeeHistory}
          </p>
          <SignInButton mode="modal">
            <button
              className="btn-primary"
              style={{ width: "100%", height: "48px", fontSize: "15px" }}
            >
              {t.btnLoginNow}
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "80dvh", padding: "24px 16px 40px" }}>
      <div style={{ maxWidth: "480px", margin: "0 auto" }}>
        <h1
          className="font-arabic"
          style={{
            fontSize: "28px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "24px",
          }}
        >
          {t.profileTitle}
        </h1>

        <div
          className="glass-card fade-in"
          style={{
            padding: "24px 20px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "16px",
          }}
        >
          <ProfileAvatarBadge size={56} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontWeight: 700,
                fontSize: "16px",
                color: "var(--text-primary)",
                marginBottom: "2px",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.fullName || user?.username || t.defaultUserName}
            </p>
            <p
              style={{
                fontSize: "13px",
                color: "var(--text-secondary)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.primaryEmailAddress?.emailAddress}
            </p>
          </div>
        </div>

        {/* Daily Nutritional Goals Form */}
        <div
          className="glass-card fade-in fade-in-delay-1"
          style={{ padding: "18px 20px", marginBottom: "16px" }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <span
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              {lang === "ar"
                ? "🎯 أهدافك الغذائية اليومية"
                : "🎯 Daily Nutrition Goals"}
            </span>
            {targetSavedMsg ? (
              <span
                style={{ fontSize: "12px", color: "var(--status-success)" }}
              >
                {targetSavedMsg}
              </span>
            ) : null}
          </div>

          <form
            onSubmit={handleSaveTargets}
            style={{ display: "flex", flexDirection: "column", gap: "10px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "8px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "3px",
                  }}
                >
                  {lang === "ar" ? "🔥 السعرات اليومية" : "Calories (kcal)"}
                </label>
                <input
                  type="number"
                  value={targets.calorieTarget}
                  onChange={(e) =>
                    setTargets({
                      ...targets,
                      calorieTarget: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "3px",
                  }}
                >
                  {lang === "ar" ? "💪 البروتين (جم)" : "Protein (g)"}
                </label>
                <input
                  type="number"
                  value={targets.proteinTarget}
                  onChange={(e) =>
                    setTargets({
                      ...targets,
                      proteinTarget: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "8px",
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "3px",
                  }}
                >
                  {lang === "ar" ? "🍚 الكارب" : "Carbs"}
                </label>
                <input
                  type="number"
                  value={targets.carbsTarget}
                  onChange={(e) =>
                    setTargets({
                      ...targets,
                      carbsTarget: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "3px",
                  }}
                >
                  {lang === "ar" ? "🥑 الدهون" : "Fats"}
                </label>
                <input
                  type="number"
                  value={targets.fatsTarget}
                  onChange={(e) =>
                    setTargets({
                      ...targets,
                      fatsTarget: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    display: "block",
                    marginBottom: "3px",
                  }}
                >
                  {lang === "ar" ? "🌿 الألياف" : "Fiber"}
                </label>
                <input
                  type="number"
                  value={targets.fiberTarget}
                  onChange={(e) =>
                    setTargets({
                      ...targets,
                      fiberTarget: Number(e.target.value),
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "7px 10px",
                    borderRadius: "8px",
                    border: "1px solid var(--glass-border)",
                    background: "var(--surface)",
                    color: "var(--text-primary)",
                    fontSize: "13px",
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={savingTargets}
              className="btn-primary"
              style={{
                marginTop: "4px",
                padding: "8px 16px",
                fontSize: "13px",
                height: "auto",
              }}
            >
              {savingTargets
                ? lang === "ar"
                  ? "جارٍ الحفظ..."
                  : "Saving..."
                : lang === "ar"
                  ? "حفظ الأهداف"
                  : "Save Goals"}
            </button>
          </form>
        </div>

        <div
          className="glass-card fade-in fade-in-delay-2"
          style={{ padding: "20px 24px", marginBottom: "16px" }}
        >
          <p
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color: "var(--text-muted)",
              marginBottom: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {t.stats}
          </p>
          <div style={{ display: "flex", gap: "32px" }}>
            <div>
              <div
                className="english-font"
                style={{
                  fontSize: "34px",
                  fontWeight: 800,
                  color: "var(--brand)",
                  lineHeight: 1,
                }}
              >
                {mealCount ?? "…"}
              </div>
              <div
                style={{
                  fontSize: "12px",
                  color: "var(--text-secondary)",
                  marginTop: "4px",
                }}
              >
                {t.mealsCount}
              </div>
            </div>
          </div>
        </div>

        <div
          className="glass-card fade-in fade-in-delay-3"
          style={{ padding: "8px" }}
        >
          <Link
            href="/history"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 16px",
              borderRadius: "14px",
              textDecoration: "none",
              color: "var(--text-primary)",
              transition: "background 0.2s",
            }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="var(--brand)"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {t.mealLog}
            </span>
          </Link>

          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "14px 16px",
              borderRadius: "14px",
              textDecoration: "none",
              color: "var(--text-primary)",
              transition: "background 0.2s",
            }}
          >
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="var(--brand)"
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
            <span style={{ fontSize: "14px", fontWeight: 600 }}>
              {t.analyzeNew}
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
