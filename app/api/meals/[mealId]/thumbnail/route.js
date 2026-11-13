import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/config/db";
import { meals } from "@/db/schema";
import { decodeDataUrl, getMealThumbnail } from "@/lib/storage/meal-images";

export const runtime = "nodejs";

/**
 * Serves a meal's 480px thumbnail. Images live in object storage (or as a
 * legacy data URL) so list and detail responses never carry image bytes.
 * Private, immutable caching means each device downloads it once.
 */
export async function GET(req, { params }) {
  try {
    if (!isDatabaseConfigured || !db) {
      return new NextResponse(null, { status: 404 });
    }

    const { userId } = await auth();
    if (!userId) {
      return new NextResponse(null, { status: 401 });
    }

    const { mealId } = await params;

    const [meal] = await db
      .select({ imageKey: meals.imageKey, imageUrl: meals.imageUrl })
      .from(meals)
      .where(and(eq(meals.id, mealId), eq(meals.userId, userId)))
      .limit(1);

    if (!meal) {
      return new NextResponse(null, { status: 404 });
    }

    let body = await getMealThumbnail(meal.imageKey);
    let contentType = "image/webp";

    if (!body) {
      const legacy = decodeDataUrl(meal.imageUrl);
      if (legacy) {
        body = legacy.buffer;
        contentType = legacy.contentType;
      }
    }

    if (!body) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.warn("[Luqmati] thumbnail route failed:", error?.message);
    return new NextResponse(null, { status: 500 });
  }
}
