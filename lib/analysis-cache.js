import { eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/config/db";
import { analysisCache } from "@/db/schema";

/**
 * Cache of AI results keyed by the sha256 of the uploaded bytes. Identical
 * uploads (a user retrying, a shared photo, a guest retrying after sign-in)
 * return instantly and cost nothing.
 *
 * Returns null when unavailable so the pipeline simply analyses normally.
 */
export async function getCachedAnalysis(imageHash) {
  if (!isDatabaseConfigured || !db || !imageHash) return null;

  try {
    const [row] = await db
      .select({ payload: analysisCache.payload })
      .from(analysisCache)
      .where(eq(analysisCache.hash, imageHash))
      .limit(1);

    return row?.payload ?? null;
  } catch (error) {
    console.warn("[Luqmati] analysis cache unavailable:", error?.message);
    return null;
  }
}

export async function setCachedAnalysis(imageHash, payload) {
  if (!isDatabaseConfigured || !db || !imageHash || !payload) return;

  try {
    await db.insert(analysisCache).values({ hash: imageHash, payload }).onConflictDoNothing();
  } catch (error) {
    console.warn("[Luqmati] could not store analysis cache entry:", error?.message);
  }
}
