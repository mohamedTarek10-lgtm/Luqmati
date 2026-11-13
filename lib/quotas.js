import { sql } from "drizzle-orm";
import { db, isDatabaseConfigured } from "@/config/db";

/**
 * Atomic daily quota. A single statement reserves a unit, so two concurrent
 * requests can never both pass the check the way "SELECT count(*) then insert"
 * allowed.
 *
 * Returns null when the quota table has not been migrated yet; callers then fall
 * back to the previous counting behaviour instead of failing the request.
 */
export function utcDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export async function consumeQuota(scope, limit, day = utcDayKey()) {
  if (!isDatabaseConfigured || !db) return null;

  try {
    const result = await db.execute(sql`
      INSERT INTO usage_daily (scope, day, used, updated_at)
      VALUES (${scope}, ${day}, 1, now())
      ON CONFLICT (scope, day) DO UPDATE
        SET used = usage_daily.used + 1, updated_at = now()
        WHERE usage_daily.used < ${limit}
      RETURNING used
    `);

    const rows = result?.rows ?? result ?? [];
    const used = Number(rows[0]?.used ?? 0);

    if (!used) {
      return { allowed: false, used: limit, remaining: 0 };
    }

    return { allowed: true, used, remaining: Math.max(0, limit - used) };
  } catch (error) {
    console.warn("[Luqmati] quota table unavailable, using fallback counting:", error?.message);
    return null;
  }
}

/** Give the unit back when the analysis failed, so failures do not burn quota. */
export async function releaseQuota(scope, day = utcDayKey()) {
  if (!isDatabaseConfigured || !db) return;

  try {
    await db.execute(sql`
      UPDATE usage_daily
      SET used = GREATEST(usage_daily.used - 1, 0), updated_at = now()
      WHERE scope = ${scope} AND day = ${day}
    `);
  } catch (error) {
    console.warn("[Luqmati] could not release quota:", error?.message);
  }
}

export async function peekQuota(scope, limit, day = utcDayKey()) {
  if (!isDatabaseConfigured || !db) return null;

  try {
    const result = await db.execute(sql`
      SELECT used FROM usage_daily WHERE scope = ${scope} AND day = ${day} LIMIT 1
    `);
    const rows = result?.rows ?? result ?? [];
    const used = Number(rows[0]?.used ?? 0);
    return { used, remaining: Math.max(0, limit - used) };
  } catch (error) {
    console.warn("[Luqmati] quota peek unavailable:", error?.message);
    return null;
  }
}
