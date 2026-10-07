"use client";

import { useState, useRef, useCallback, useEffect, useSyncExternalStore } from "react";
import dynamic from "next/dynamic";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useLang } from "../hooks/i18n-context";
import { FoodUploadCard } from "../components/food-upload-card";
import { MealResultView } from "../components/meal-result-view";
import { convertToProviderImage, MAX_IMAGE_BYTES } from "@/lib/food-analysis/image-utils";

const InstallPrompt = dynamic(() => import("../components/install-prompt"), { ssr: false });
const DailyNutritionDashboard = dynamic(() => import("../components/daily-nutrition-dashboard"), { ssr: false });

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
  const [isGuestResult, setIsGuestResult] = useState(false);
  const [isGuestTrialUsed, setIsGuestTrialUsed] = useState(false);
  const [editableIngredients, setEditableIngredients] = useState([]);
  const [currentMealId, setCurrentMealId] = useState(null);
  const [dailyData, setDailyData] = useState(null);

  const fileInput = useRef(null);
  const cameraInput = useRef(null);
  const isOffline = !useSyncExternalStore(subscribeToOnlineStatus, getOnlineStatus, () => true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsGuestTrialUsed(localStorage.getItem("luqmati-guest-trial") === "1");
    }
  }, [saved, isGuestResult, isSignedIn]);

  // Sync Guest Result to sessionStorage for Page Reload / Auth Redirects
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

  // Restore Pending Guest Result on initial Load
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
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch Daily Nutrition
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
    return () => {
      cancelled = true;
    };
  }, [fetchDailyNutrition, saved]);

  // Auto-save Guest Meal on Sign-In
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
    return () => {
      isCancelled = true;
    };
  }, [isSignedIn, result, saved, currentMealId, fetchDailyNutrition]);

  // Fetch Usage
  useEffect(() => {
    if (!isSignedIn) return;
    fetch("/api/usage")
      .then((r) => r.json())
      .then((d) => setUsage(d))
      .catch(() => {});
  }, [isSignedIn, saved]);

  // Clean object URL on preview change
  useEffect(() => {
    return () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleFile = useCallback(
    async function handleFile(f) {
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
    },
    [t]
  );

  const onFileInput = (e) => void handleFile(e.target.files?.[0]);
  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      void handleFile(e.dataTransfer.files?.[0]);
    },
    [handleFile]
  );
  const onDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);

  async function analyzeFood() {
    if (isOffline) {
      setError(t.offlineAnalysisMsg);
      return;
    }
    if (!file) {
      setError(t.noImage);
      return;
    }

    // Guest trial flow
    if (!isSignedIn) {
      const guestUsed = localStorage.getItem("luqmati-guest-trial") === "1";
      if (guestUsed) {
        setError(t.guestTrialExpired || "استخدمت تجربتك المجانية. سجّل دخولك لتحليلات غير محدودة.");
        openSignIn?.();
        return;
      }

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
        if (!res.ok) throw new Error(data.error || t.analysisError);

        localStorage.setItem("luqmati-guest-trial", "1");
        setIsGuestTrialUsed(true);
        setResult(data.result);
        setEditableIngredients(data.result?.ingredients || []);
        setIsGuestResult(true);
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

    // Signed-in analysis flow
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
        setRateLimitInfo({ resetAt: data.resetAt, limit: data.limit });
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
      <InstallPrompt />

      {/* Offline Alert */}
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

      {/* Upload or Result Card */}
      {!result ? (
        <FoodUploadCard
          preview={preview}
          dragOver={dragOver}
          file={file}
          loading={loading}
          analyzingStep={analyzingStep}
          error={error}
          rateLimitInfo={rateLimitInfo}
          usage={usage}
          isGuestTrialUsed={isGuestTrialUsed}
          isSignedIn={isSignedIn}
          isLoaded={isLoaded}
          lang={lang}
          t={t}
          fileInput={fileInput}
          cameraInput={cameraInput}
          onFileInput={onFileInput}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          analyzeFood={analyzeFood}
          reset={reset}
        />
      ) : (
        <MealResultView
          result={result}
          preview={preview}
          lang={lang}
          t={t}
          saved={saved}
          isGuestResult={isGuestResult}
          isSignedIn={isSignedIn}
          openSignIn={openSignIn}
          editableIngredients={editableIngredients}
          updateResultIngredients={updateResultIngredients}
          reset={reset}
          onViewHistory={() => router.push("/history")}
        />
      )}
    </div>
  );
}
