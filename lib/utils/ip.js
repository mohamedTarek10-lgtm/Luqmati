/**
 * Unified client IP resolution utility across API routes.
 * Inspects standard reverse proxy headers (Cloudflare, Vercel, Nginx).
 */
export function getClientIp(req) {
  if (!req || !req.headers) return "unknown-ip";

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

