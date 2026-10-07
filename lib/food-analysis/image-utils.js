export const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export const PROVIDER_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

export async function convertToProviderImage(source) {
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
    const scale = Math.min(
      1,
      maxDimension / Math.max(image.naturalWidth || 1000, image.naturalHeight || 1000)
    );
    canvas.width = Math.max(1, Math.round((image.naturalWidth || 1000) * scale));
    canvas.height = Math.max(1, Math.round((image.naturalHeight || 1000) * scale));

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    const compressedBlob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.85)
    );
    if (!compressedBlob) throw new Error("conversion_failed");

    return new File([compressedBlob], filename.replace(/\.[^.]+$/, "") + ".jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
