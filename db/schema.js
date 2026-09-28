import {
  pgTable,
  text,
  integer,
  real,
  timestamp,
  jsonb,
  index,
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

    // Image URL (reserved for future storage)
    imageUrl: text("image_url"),

    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("meals_user_created_idx").on(table.userId, table.createdAt),
  ]
);

export const userTargets = pgTable(
  "user_targets",
  {
    userId: text("user_id").primaryKey(),
    calorieTarget: integer("calorie_target").default(2400).notNull(),
    proteinTarget: integer("protein_target").default(160).notNull(),
    carbsTarget: integer("carbs_target").default(280).notNull(),
    fatsTarget: integer("fats_target").default(80).notNull(),
    fiberTarget: integer("fiber_target").default(30).notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

export const guestUsage = pgTable(
  "guest_usage",
  {
    id: text("id").primaryKey(),
    ipHash: text("ip_hash").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("guest_usage_hash_created_idx").on(table.ipHash, table.createdAt),
  ]
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
