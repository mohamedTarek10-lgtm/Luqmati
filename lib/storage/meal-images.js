import { getStore } from "@netlify/blobs";

const STORE_NAME = "meal-thumbnails";

/**
 * Netlify Blobs is injected automatically on Netlify. Outside that runtime
 * (local dev, preview builds) nothing is configured and every helper degrades
 * to "unavailable", so meals keep their inline fallback image instead of
 * failing the request.
 */
const isBlobStorageConfigured = Boolean(
  process.env.NETLIFY_BLOBS_CONTEXT ||
    (process.env.NETLIFY_SITE_ID && process.env.NETLIFY_AUTH_TOKEN)
);

function blobStore() {
  return getStore({ name: STORE_NAME, consistency: "strong" });
}

export function thumbnailKey(mealId) {
  return `${mealId}.webp`;
}

export async function putMealThumbnail(mealId, thumbnailBuffer) {
  if (!isBlobStorageConfigured || !thumbnailBuffer) return null;

  try {
    const key = thumbnailKey(mealId);
    await blobStore().set(key, thumbnailBuffer, {
      metadata: { contentType: "image/webp" },
    });
    return key;
  } catch (error) {
    console.warn("[Luqmati] could not upload meal thumbnail:", error?.message);
    return null;
  }
}

export async function deleteMealThumbnail(imageKey) {
  if (!isBlobStorageConfigured || !imageKey) return;

  try {
    await blobStore().delete(imageKey);
  } catch (error) {
    console.warn("[Luqmati] could not delete meal thumbnail:", error?.message);
  }
}

export async function getMealThumbnail(imageKey) {
  if (!isBlobStorageConfigured || !imageKey) return null;

  try {
    const data = await blobStore().get(imageKey, { type: "arrayBuffer" });
    return data || null;
  } catch (error) {
    console.warn("[Luqmati] could not read meal thumbnail:", error?.message);
    return null;
  }
}

/** Decode a legacy `data:image/...;base64,...` value into raw bytes. */
export function decodeDataUrl(dataUrl) {
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:image/")) return null;

  const comma = dataUrl.indexOf(",");
  if (comma === -1) return null;

  const header = dataUrl.slice(5, comma);
  if (!header.includes("base64")) return null;

  const contentType = header.split(";")[0] || "image/webp";

  try {
    return {
      buffer: Buffer.from(dataUrl.slice(comma + 1), "base64"),
      contentType,
    };
  } catch {
    return null;
  }
}

/**
 * Persist a meal image: object storage when configured, otherwise the inline
 * data URL (current behaviour) so local development still shows thumbnails.
 */
export async function storeMealImage(mealId, { thumbnailBuffer, thumbnailDataUrl }) {
  // Guest results arrive as a data URL (the browser held no file handle), so
  // decode it before uploading rather than storing base64 in Postgres.
  let buffer = thumbnailBuffer;
  if (!buffer && thumbnailDataUrl) {
    const decoded = decodeDataUrl(thumbnailDataUrl);
    if (decoded) buffer = decoded.buffer;
  }

  const imageKey = await putMealThumbnail(mealId, buffer);
  if (imageKey) return { imageKey, imageUrl: null };
  return { imageKey: null, imageUrl: thumbnailDataUrl || null };
}
