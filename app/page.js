"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect, useSyncExternalStore, memo } from "react";
import dynamic from "next/dynamic";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLang } from "../hooks/i18n-context";
import EditableIngredients from "../components/editable-ingredients";
import DailyNutritionDashboard from "../components/daily-nutrition-dashboard";
import NutritionBenefitsCard from "../components/nutrition-benefits-card";
import AnalyzingLoader from "../components/analyzing-loader";
import PortionScaler from "../components/portion-scaler";
import MealShareModal from "../components/meal-share-modal";

const InstallPrompt = dynamic(() => import("../components/install-prompt"), { ssr: false });
const ProteinRing = dynamic(() => import("../components/protein-ring"));

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const PROVIDER_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);
const IMAGE_EXTENSIONS = /\.(jpe?g|png|webp|gif|heic|heif|avif|bmp)$/i;

function subscribeToOnlineStatus(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineStatus() {
  return typeof navigator === "undefined" ? true : navigator.onLine;
}

async function convertToProviderImage(source) {
  let blob;
  let filename = "food.jpg";

  if (typeof source === "string") {
    try {
      const res = await fetch(source, { mode: "cors" });
      if (!res.ok) throw new Error("fetch_failed");
      blob = await res.blob();
    } catch {
      throw new Error("url_fetch_failed");
    }
  } else if (source instanceof File || source instanceof Blob) {
    blob = source;
    if (source.name) filename = source.name;
  } else {
    throw new Error("invalid_source");
  }

  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = document.createElement("img");
    image.crossOrigin = "anonymous";
    image.decoding = "async";
    image.src = objectUrl;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("conversion_failed"));
    });

    const canvas = document.createElement("canvas");
    const maxDimension = 1400;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth || 1000, image.naturalHeight || 1000));
    canvas.width = Math.max(1, Math.round((image.naturalWidth || 1000) * scale));
    canvas.height = Math.max(1, Math.round((image.naturalHeight || 1000) * scale));

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    const compressedBlob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
    if (!compressedBlob) throw new Error("conversion_failed");

    return new File([compressedBlob], filename.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function AnalysisSkeleton() {
  return (
    <div
      className="glass-card fade-in"
      style={{
        width: "100%",
        maxWidth: "520px",
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
      }}
    >
      <div style={{ width: "50%", height: "24px", background: "var(--bg-subtle)", borderRadius: "8px", animation: "pulse 1.5s infinite" }} />
      <div style={{ width: "100%", height: "210px", background: "var(--bg-subtle)", borderRadius: "18px", animation: "pulse 1.5s infinite" }} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
        <div style={{ height: "72px", background: "var(--bg-subtle)", borderRadius: "14px", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: "72px", background: "var(--bg-subtle)", borderRadius: "14px", animation: "pulse 1.5s infinite" }} />
        <div style={{ height: "72px", background: "var(--bg-subtle)", borderRadius: "14px", animation: "pulse 1.5s infinite" }} />
      </div>
    </div>
  );
}

function confidenceLabel(c, t) {
  if (c === "high")
    return { label: t.confidenceHigh, cls: "confidence-high", pct: "95%" };
  if (c === "medium")
    return { label: t.confidenceMedium, cls: "confidence-medium", pct: "75%" };
  return { label: t.confidenceLow, cls: "confidence-low", pct: "50%" };
}

const MacroCard = memo(function MacroCard({ emoji, label, value, unit, colorClass, delay }) {
  return (
    <div
      className={`macro-card ${colorClass} fade-in fade-in-delay-${delay}`}
      style={{ padding: "14px 12px", textAlign: "center" }}
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
        style={{ fontSize: "22px", fontWeight: 700, lineHeight: 1.1 }}
      >
        {value ?? "—"}
        <span
          style={{
            fontSize: "12px",
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

export default function Home() {
  const { isSignedIn, isLoaded } = useAuth();
  const { openSignIn } = useClerk();
  const { t, lang } = useLang();
  const router = useRouter();

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzingStep, setAnalyzingStep] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState(null);
  const [usage, setUsage] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [saved, setSaved] = useState(false);
  // Guest trial: true = guest result shown (not saved yet)
  const [isGuestResult, setIsGuestResult] = useState(false);
  const [isGuestTrialUsed, setIsGuestTrialUsed] = useState(false);
  const [editableIngredients, setEditableIngredients] = useState([]);
  const isOffline = !useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatus, () => true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsGuestTrialUsed(localStorage.getItem("luqmati-guest-trial") === "1");
    }
  }, [saved, isGuestResult, isSignedIn]);

  // ── Sync Guest Result to sessionStorage for Page Reload / Auth Redirects ─
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (result && isGuestResult && !saved) {
      try {
        sessionStorage.setItem("luqmati_pending_guest_meal", JSON.stringify({ result, preview }));
      } catch {}
    } else if (saved || !result) {
      sessionStorage.removeItem("luqmati_pending_guest_meal");
    }
  }, [result, isGuestResult, saved, preview]);

  // ── Restore Pending Guest Result on Load ──────────────────────────────────
  useEffect(() => {
    if (typeof window === "undefined" || result) return;
    try {
      const pending = sessionStorage.getItem("luqmati_pending_guest_meal");
      if (pending) {
        const { result: pendingResult, preview: pendingPreview } = JSON.parse(pending);
        if (pendingResult) {
          setResult(pendingResult);
          setEditableIngredients(pendingResult.ingredients || []);
          if (pendingPreview) setPreview(pendingPreview);
          setIsGuestResult(!isSignedIn);
        }
      }
    } catch {}
  }, []);

  const [currentMealId, setCurrentMealId] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);


  const [dailyData, setDailyData] = useState(null);

  const fileInput = useRef(null);
  const cameraInput = useRef(null);

  // ── Fetch Daily Nutrition ────────────────────────────────────────────────
  const fetchDailyNutrition = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      const res = await fetch("/api/daily-nutrition");
      const d = await res.json();
      if (res.ok) setDailyData(d);
    } catch {}
  }, [isSignedIn]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!cancelled) await fetchDailyNutrition();
    }
    void run();
    return () => { cancelled = true; };
  }, [fetchDailyNutrition, saved]);

  // ── Auto-save Guest Meal on Sign-In ──────────────────────────────────────
  useEffect(() => {
    if (!isSignedIn || !result || saved || currentMealId) return;

    let isCancelled = false;
    async function saveGuestMeal() {
      try {
        const res = await fetch("/api/meals", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ result }),
        });
        const data = await res.json();
        if (!isCancelled && res.ok && data.mealId) {
          setCurrentMealId(data.mealId);
          setSaved(true);
          setIsGuestResult(false);
          fetchDailyNutrition();
        }
      } catch (err) {
        console.warn("[Luqmati] Failed to auto-save guest meal on login:", err);
      }
    }

    void saveGuestMeal();
    return () => { isCancelled = true; };
  }, [isSignedIn, result, saved, currentMealId, fetchDailyNutrition]);

  // ── Usage counter fetch ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => setUsage(d))
      .catch(() => {});
  }, [isSignedIn, saved]);

  // ── Sync editable ingredients when result arrives ───────────────────────
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  // ── File validation & handle ─────────────────────────────────────────────
  const handleFile = useCallback(async function handleFile(f) {
    if (!f) {
      setError(t.notAnImage);
      return;
    }
    if (f.size > MAX_IMAGE_BYTES) {
      setError(t.imageTooLarge);
      return;
    }

    try {
      const preparedFile = await convertToProviderImage(f);
      if (preparedFile.size > MAX_IMAGE_BYTES) {
        setError(t.imageTooLarge);
        return;
      }
      setFile(preparedFile);
      setPreview(URL.createObjectURL(preparedFile));
      setResult(null);
      setError("");
      setSaved(false);
      setRateLimitInfo(null);
    } catch {
      setError(t.imageConversionFailed);
    }
  }, [t]);


  const onFileInput = (e) => {
    void handleFile(e.target.files?.[0]);
  };
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    void handleFile(e.dataTransfer.files?.[0]);
  }, [handleFile]);
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  // ── Analyze food ─────────────────────────────────────────────────────────
  async function analyzeFood() {
    if (isOffline) {
      setError(t.offlineAnalysisMsg);
      return;
    }
    if (!file) {
      setError(t.noImage);
      return;
    }

    // ── Guest trial flow ────────────────────────────────────────────────────
    if (!isSignedIn) {
      const guestUsed = localStorage.getItem("luqmati-guest-trial") === "1";
      if (guestUsed) {
        // Guest has already used their free trial — force sign-in
        setError(t.guestTrialExpired || "استخدمت تجربتك المجانية. سجّل دخولك لتحليلات غير محدودة.");
        openSignIn?.();
        return;
      }

      // Run free guest analysis
      try {
        setLoading(true);
        setError("");
        setResult(null);
        setIsGuestResult(false);
        setSaved(false);
        setRateLimitInfo(null);

        setAnalyzingStep(t.preparingImage);
        await new Promise((r) => setTimeout(r, 300));
        setAnalyzingStep(t.aiAnalyzing);

        const form = new FormData();
        form.append("image", file);

        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), 125_000);

        let res;
        try {
          res = await fetch("/api/analyze-food-guest", {
            method: "POST",
            body: form,
            signal: controller.signal,
          });
        } finally {
          window.clearTimeout(timeoutId);
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.error || t.analysisError);
        }

        // Mark guest trial as used
        localStorage.setItem("luqmati-guest-trial", "1");
        setIsGuestTrialUsed(true);

        setResult(data.result);
        setEditableIngredients(data.result?.ingredients || []);
        setIsGuestResult(true); // show sign-in CTA instead of "saved"
      } catch (err) {
        if (err?.name === "AbortError") {
          setError(t.analysisTimeout);
        } else if (!navigator.onLine || err?.name === "TypeError") {
          setError(t.offlineAnalysisMsg);
        } else {
          setError(err.message || t.analysisError);
        }
      } finally {
        setLoading(false);
        setAnalyzingStep("");
      }
      return;
    }

    // ── Signed-in analysis flow ─────────────────────────────────────────────
    try {
      setLoading(true);
      setError("");
      setResult(null);
      setIsGuestResult(false);
      setSaved(false);
      setRateLimitInfo(null);

      setAnalyzingStep(t.preparingImage);
      await new Promise((r) => setTimeout(r, 300));
      setAnalyzingStep(t.aiAnalyzing);

      const form = new FormData();
      form.append("image", file);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 125_000);

      let res;
      try {
        res = await fetch("/api/analyze-food", {
          method: "POST",
          body: form,
          signal: controller.signal,
        });
      } finally {
        window.clearTimeout(timeoutId);
      }

      const data = await res.json().catch(() => ({}));

      if (res.status === 429 && data.rateLimited) {
        setRateLimitInfo({
          resetAt: data.resetAt,
          limit: data.limit,
        });
        throw new Error(data.error || "وصلت للحد المسموح من التحليلات.");
      }

      if (!res.ok) {
        throw new Error(data.offline ? t.offlineAnalysisMsg : data.error || t.analysisError);
      }

      setResult(data.result);
      setEditableIngredients(data.result?.ingredients || []);
      if (data.mealId) setCurrentMealId(data.mealId);
      if (data.usage) setUsage(data.usage);
      setSaved(Boolean(data.saved ?? data.mealId));
      fetchDailyNutrition();
    } catch (err) {
      if (err?.name === "AbortError") {
        setError(t.analysisTimeout);
      } else if (!navigator.onLine || err?.name === "TypeError") {
        setError(t.offlineAnalysisMsg);
      } else {
        setError(err.message || t.analysisError);
      }
    } finally {
      setLoading(false);
      setAnalyzingStep("");
    }
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setResult(null);
    setEditableIngredients([]);
    setCurrentMealId(null);
    setError("");
    setSaved(false);
    setRateLimitInfo(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("luqmati_pending_guest_meal");
    }
    if (fileInput.current) fileInput.current.value = "";
    if (cameraInput.current) cameraInput.current.value = "";
  }

  const updateResultIngredients = useCallback(
    async (updatedIngredients, totals, newGrams) => {
      setEditableIngredients(updatedIngredients);
      setResult((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          ingredients: updatedIngredients,
          calories: totals?.calories ?? prev.calories,
          protein: totals?.protein ?? prev.protein,
          carbs: totals?.carbs ?? prev.carbs,
          fats: totals?.fats ?? prev.fats,
          fiber: totals?.fiber ?? prev.fiber,
          sugar: totals?.sugar ?? prev.sugar,
          sodium: totals?.sodium ?? prev.sodium,
          micronutrients: totals?.micronutrients ?? prev.micronutrients,
          portion: {
            ...prev.portion,
            estimatedGrams: newGrams || totals?.estimatedGrams || prev.portion?.estimatedGrams,
          },
        };
      });

      if (currentMealId && isSignedIn) {
        try {
          await fetch(`/api/meals/${currentMealId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ingredients: updatedIngredients,
              estimatedGrams: newGrams || totals?.estimatedGrams,
              calories: totals?.calories,
              protein: totals?.protein,
              carbs: totals?.carbs,
              fats: totals?.fats,
              fiber: totals?.fiber,
              sugar: totals?.sugar,
              sodium: totals?.sodium,
            }),
          });
          fetchDailyNutrition();
        } catch (err) {
          console.warn("[Luqmati] Failed to update meal in database:", err);
        }
      }
    },
    [currentMealId, isSignedIn, fetchDailyNutrition]
  );

  const conf = result ? confidenceLabel(result.confidence, t) : null;

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 16px 32px",
      }}
    >
      {/* PWA Install Banner */}
      <InstallPrompt />

      {/* Offline banner alert */}
      {isOffline && (
        <div
          className="fade-in"
          style={{
            width: "100%",
            maxWidth: "600px",
            padding: "12px 16px",
            borderRadius: "14px",
            background: "var(--status-error-bg)",
            border: "1px solid var(--status-error-border)",
            color: "var(--status-error)",
            fontSize: "13px",
            marginBottom: "16px",
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
          }}
        >
          <span>📶</span>
          <span>{t.offlineAnalysisMsg}</span>
        </div>
      )}

      {/* Daily Nutrition Dashboard */}
      {isSignedIn && dailyData && (
        <DailyNutritionDashboard dailyData={dailyData} lang={lang} />
      )}

      {/* ── Upload Card ─────────────────────────────────────────────────── */}
      {!result && (
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
              justifyContent: "space-between",
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


          {/* Upload Zone / URL Form / Image Preview */}
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
                alt="food preview"
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

          {/* Hidden File & Camera Inputs */}
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
                  style={{ marginTop: "10px", padding: "7px 14px", fontSize: "12px" }}
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
                    { hour: "2-digit", minute: "2-digit" },
                  )}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
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
                  <p
                    style={{

                      fontSize: "14px",
                      fontWeight: 600,
                    }}
                  >

                  </p>

                </div>
              )}

              {!loading && (
                <>
                  {!isLoaded ? null : !isSignedIn ? (
                    <>
                      <button
                        className="btn-primary"
                        style={{
                          width: "100%",
                          height: "52px",
                          fontSize: "16px",
                        }}
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
                        {isGuestTrialUsed ? (t.btnSignInContinue || "سجّل دخول للاستمرار") : t.btnAnalyze}
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
                          ? (t.guestTrialExpired || "استخدمت تجربتك المجانية. سجّل دخولك للمتابعة.")
                          : (t.guestTrialBanner || "🎁 تحليل مجاني واحد للزوار")}
                      </p>
                    </>
                  ) : (
                    <button
                      className="btn-primary"
                      style={{
                        width: "100%",
                        height: "52px",
                        fontSize: "16px",
                      }}
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
      )}

      {/* ── Nutrition Results Dashboard ────────────────────────────────────── */}
      {result && (
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
                alt={result.foodNameArabic || result.foodName}
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
                  background: "linear-gradient(135deg, rgba(116, 190, 48, 0.12), rgba(108, 63, 212, 0.08))",
                  border: "1px solid var(--brand-soft)",
                  marginBottom: "18px",
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                  {t.guestTrialResult || "✅ تم التحليل! سجّل دخولك لحفظ النتيجة والاستمرار"}
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
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                className="btn-primary"
                style={{ flex: 1, height: "48px", fontSize: "14px" }}
                onClick={() => router.push("/history")}
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
                style={{ flex: 1, height: "48px", fontSize: "14px" }}
                onClick={reset}
              >
                {t.btnAnalyzeAnother}
              </button>

              <button
                type="button"
                className="btn-outline"
                style={{ flex: "1 1 100%", height: "46px", fontSize: "14px", marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={() => setShowShareModal(true)}
              >
                <span>📤</span>
                <span>{lang === "ar" ? "مشاركة بطاقة الوجبة" : "Share Meal Card"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
