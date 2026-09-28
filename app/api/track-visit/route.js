import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { db, isDatabaseConfigured } from "@/config/db";
import { visits } from "@/db/schema";

export const runtime = "nodejs";

const recentVisits = new Map();
const THROTTLE_MS = 10_000; // 10 seconds throttle per visitor hash + path

function getClientIp(request) {
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  const cfIp = request.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();

  const vercelIp = request.headers.get("x-vercel-forwarded-for");
  if (vercelIp) return vercelIp.split(",")[0].trim();

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const parts = forwardedFor.split(",").map((p) => p.trim()).filter(Boolean);
    return parts[parts.length - 1] || "unknown";
  }

  return "unknown";
}

function normalizePath(pathname) {
  if (typeof pathname !== "string" || !pathname) return "/";
  const cleaned = pathname.slice(0, 128).replace(/[^\w\-/]/g, "");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
}

export async function POST(request) {
  try {
    if (!isDatabaseConfigured || !db) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const body = await request.json().catch(() => ({}));
    const rawPath = typeof body?.path === "string" ? body.path : request.headers.get("x-pathname") || "/";
    const path = normalizePath(rawPath);
    const userAgent = String(request.headers.get("user-agent") || "unknown").slice(0, 256);
    const ip = getClientIp(request);
    const visitorHash = createHash("sha256").update(`${ip}:${userAgent}`).digest("hex");

    const cacheKey = `${visitorHash}:${path}`;
    const now = Date.now();
    const lastSeen = recentVisits.get(cacheKey) || 0;

    if (now - lastSeen < THROTTLE_MS) {
      return NextResponse.json({ ok: true, throttled: true });
    }

    if (recentVisits.size > 5000) {
      recentVisits.clear();
    }
    recentVisits.set(cacheKey, now);

    await db.insert(visits).values({
      id: crypto.randomUUID(),
      visitorHash,
      path,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.warn("[Luqmati] track-visit failed, continuing without storing the analytics event:", error);
    return NextResponse.json({ ok: true, skipped: true }, { status: 200 });
  }
}
