/**
 * One source of truth for the public URL.
 *
 * The canonical URL, Open Graph tags, robots.txt and sitemap must all point at
 * the host the app is actually served from. When they point at a domain that
 * does not resolve, search engines drop the page entirely — which is what was
 * happening while everything hardcoded `https://luqmati.app`.
 */
const FALLBACK = "https://luqmati.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK).replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
