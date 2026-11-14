import { SITE_URL } from "@/lib/site-url";

// A stable date instead of `new Date()`: a timestamp that changes on every
// request tells crawlers the content changed every time, which is not true.
const LAST_UPDATED = new Date("2026-11-14T00:00:00.000Z");

export default function sitemap() {
  return [
    {
      url: SITE_URL,
      lastModified: LAST_UPDATED,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified: LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: LAST_UPDATED,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
