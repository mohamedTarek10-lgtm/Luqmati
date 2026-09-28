import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db, isDatabaseConfigured } from "@/config/db";
import { guestUsage } from "@/db/schema";
import { eq } from "drizzle-orm";
import { processAndAnalyzeFoodImage } from "@/lib/food-analysis/engine";
import { FoodAnalysisError } from "@/lib/food-analysis/openrouter";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const GUEST_INITIAL_ANALYSES = 1;
const GUEST_REFILL_INTERVAL_MS = 60 * 60 * 1000;

function getClientIp(req) {
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const vercelIp = req.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown-ip";
  }

  return "unknown-ip";
}

async function getGuestUsage(ipHash) {
  if (!isDatabaseConfigured || !db) {
    return { used: 0, available: 1, nextRefillAt: null };
  }

  const usageRows = await db
    .select({ createdAt: guestUsage.createdAt })
    .from(guestUsage)
    .where(eq(guestUsage.ipHash, ipHash))
    .orderBy(guestUsage.createdAt);

  const used = usageRows.length;

  if (used < GUEST_INITIAL_ANALYSES) {
    return {
      used,
      available: GUEST_INITIAL_ANALYSES - used,
      nextRefillAt: null,
    };
  }

  const firstUsage = usageRows[GUEST_INITIAL_ANALYSES - 1];
  const firstUsageTime = new Date(firstUsage.createdAt).getTime();

  if (!Number.isFinite(firstUsageTime)) {
    return { used, available: 0, nextRefillAt: null };
  }

  const now = Date.now();
  const elapsedMs = Math.max(0, now - firstUsageTime);
  const refillCredits = Math.floor(elapsedMs / GUEST_REFILL_INTERVAL_MS);
  const totalAvailableCredits = GUEST_INITIAL_ANALYSES + refillCredits;
  const available = Math.max(0, totalAvailableCredits - used);

  const nextRefillAt =
    available > 0
      ? null
      : new Date(firstUsageTime + (refillCredits + 1) * GUEST_REFILL_INTERVAL_MS).toISOString();

  return { used, available, nextRefillAt };
}

export async function POST(req) {
  try {
    const ip = getClientIp(req);
    const userAgent = req.headers.get("user-agent") || "generic";
    const ipHash = createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");

    const guestUsageInfo = await getGuestUsage(ipHash);

    if (guestUsageInfo.available <= 0) {
      return NextResponse.json(
        {
          error: "استهلكت التجربة المجانية للزوار. سجّل دخولك لتحليلات غير محدودة.",
          requiresAuth: true,
          rateLimited: true,
          remaining: 0,
          nextRefillAt: guestUsageInfo.nextRefillAt,
        },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const image = formData.get("image");

    if (!image || typeof image === "string") {
      return NextResponse.json({ error: "اختار صورة أكل الأول." }, { status: 400 });
    }

    const bytes = await image.arrayBuffer();
    if (bytes.byteLength > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "حجم الصورة كبير جداً (أقصى حد 15MB)." }, { status: 413 });
    }

    // Call unified analysis engine
    const result = await processAndAnalyzeFoodImage(bytes);

    // Record guest usage ONLY after successful AI output
    if (isDatabaseConfigured && db) {
      await db
        .insert(guestUsage)
        .values({
          id: crypto.randomUUID(),
          ipHash,
        })
        .catch((err) => {
          console.warn("[Luqmati Guest] Could not record usage:", err);
        });
    }

    return NextResponse.json({
      success: true,
      result,
      guestTrial: true,
      remaining: Math.max(0, guestUsageInfo.available - 1),
    });
  } catch (err) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "التحليل أخد وقت أطول من اللازم. حاول تاني." }, { status: 504 });
    }

    const status = err instanceof FoodAnalysisError ? err.status : 500;
    console.error("[Luqmati Guest] Analysis failed:", err);

    return NextResponse.json(
      { error: err.message || "حصلت مشكلة أثناء تحليل الطبق. حاول تاني." },
      { status }
    );
  }
}
