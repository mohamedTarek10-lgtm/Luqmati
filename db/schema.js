import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const meals = pgTable(
  "meals",
  {
    id: text("id").primaryKey(),

    // Clerk User ID
    userId: text("user_id").notNull(),

    // Food information
    foodName: text("food_name").notNull(),
    foodNameArabic: text("food_name_arabic"),
    descriptionArabic: text("description_arabic"),

    // Portion
    portionSize: text("portion_size"),
    estimatedGrams: integer("estimated_grams"),

    // Macros
    calories: integer("calories"),
    protein: real("protein"),
    carbs: real("carbs"),
    fats: real("fats"),
    fiber: real("fiber"),
    sugar: real("sugar"),
    sodium: real("sodium"),

    // Detailed micronutrients (JSONB: calcium, iron, potassium, vitamins, etc.)
    micronutrients: jsonb("micronutrients"),

    // Highlights & benefits for educational insights
    nutritionHighlights: jsonb("nutrition_highlights"),
    benefitsArabic: text("benefits_arabic"),
    proteinQualityNote: text("protein_quality_note"),

    // AI confidence: "high" | "medium" | "low"
    confidence: text("confidence"),

    // Ingredients returned by AI (JSONB array)
    ingredients: jsonb("ingredients"),

    // Legacy inline image (base64 data URL). Kept so old rows still render.
    imageUrl: text("image_url"),
    // Object-storage key for the 480px thumbnail written by new meals.
    imageKey: text("image_key"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("meals_user_created_idx").on(table.userId, table.createdAt)]
);

export const userTargets = pgTable("user_targets", {
  userId: text("user_id").primaryKey(),
  calorieTarget: integer("calorie_target").default(2400).notNull(),
  proteinTarget: integer("protein_target").default(160).notNull(),
  carbsTarget: integer("carbs_target").default(280).notNull(),
  fatsTarget: integer("fats_target").default(80).notNull(),
  fiberTarget: integer("fiber_target").default(30).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const guestUsage = pgTable(
  "guest_usage",
  {
    id: text("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("guest_usage_hash_created_idx").on(table.ipHash, table.createdAt)]
);

export const visits = pgTable(
  "visits",
  {
    id: text("id").primaryKey(),
    visitorHash: text("visitor_hash").notNull(),
    path: text("path").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("visits_hash_created_idx").on(table.visitorHash, table.createdAt),
    index("visits_path_created_idx").on(table.path, table.createdAt),
  ]
);

// Atomic per-day quota counters: one row per user or guest scope.
export const usageDaily = pgTable(
  "usage_daily",
  {
    scope: text("scope").notNull(),
    day: text("day").notNull(),
    used: integer("used").default(0).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [primaryKey({ columns: [table.scope, table.day] })]
);

// AI results keyed by sha256 of the uploaded bytes, so identical photos are free.
export const analysisCache = pgTable("analysis_cache", {
  hash: text("hash").primaryKey(),
  payload: jsonb("payload").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
