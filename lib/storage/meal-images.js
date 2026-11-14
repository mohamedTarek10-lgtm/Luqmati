import { put, del, get } from "@vercel/blob";

const PREFIX = "meal-thumbnails";

/**
 * Vercel Blob on Hobby (1 GB free) once a store exists. The store used here is
 * private: thumbnails are served only through /api/meals/[mealId]/thumbnail,
 * which authenticates the user and checks meal ownership first — a public URL
 * would let anyone with the link see someone's food photos.
 *
 * Without a token (local dev, or before the store is provisioned) every helper
 * degrades to "unavailable" and meals keep their inline data URL instead.
 */
const token = process.env.BLOB_READ_WRITE_TOKEN;
const storeId = process.env.BLOB_STORE_ID;
const isBlobStorageConfigured = Boolean(token);

function blobOptions(extra = {}) {
  return {
    access: "private",
    token,
    ...(storeId ? { storeId } : {}),
    ...extra,
  };
}

export function thumbnailKey(mealId) {
  return `${PREFIX}/${mealId}.webp`;
}

export async function putMealThumbnail(mealId, thumbnailBuffer) {
  if (!isBlobStorageConfigured || !thumbnailBuffer) return null;

  try {
    const pathname = thumbnailKey(mealId);
    await put(pathname, thumbnailBuffer, {
      ...blobOptions({
        contentType: "image/webp",
        addRandomSuffix: false,
        allowOverwrite: true,
      }),
    });
    // The stored key is the pathname: no public URL ever leaves the server.
    return pathname;
  } catch (error) {
    console.warn("[Luqmati] could not upload meal thumbnail:", error?.message);
    return null;
  }
}

export async function deleteMealThumbnail(imageKey) {
  if (!isBlobStorageConfigured || !imageKey) return;

  try {
    await del(imageKey, blobOptions());
  } catch (error) {
    console.warn("[Luqmati] could not delete meal thumbnail:", error?.message);
  }
}

export async function getMealThumbnail(imageKey) {
  if (!isBlobStorageConfigured || !imageKey) return null;

  try {
    const result = await get(imageKey, blobOptions());
    if (!result || (result.statusCode && result.statusCode !== 200)) return null;

    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());
    return buffer.length ? buffer : null;
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

  return {
    buffer: Buffer.from(dataUrl.slice(comma + 1), "base64"),
    contentType,
  };
}

/**
 * Persist a meal image: object storage when configured, otherwise the inline
 * data URL so local development still shows thumbnails.
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
