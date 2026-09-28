/**
 * Egyptian Culinary & Nutrition Reference Engine
 * Provides deterministic nutritional data per 100g and calculation helpers
 * for Egyptian dishes, home cooking, street food, fruits, and vegetables.
 */

export const FOOD_DATABASE = {
  // ── Grains & Starches (حبوب ونشويات) ───────────────────────────────────────
  "white_rice": {
    names: ["رز أبيض", "ارز ابيض", "رز مصري", "white rice"],
    per100g: { calories: 130, protein: 2.7, carbs: 28.2, fats: 0.3, fiber: 0.4, sugar: 0.1, sodium: 1 },
    micronutrients: { calcium: 10, iron: 0.2, magnesium: 12, potassium: 35, zinc: 0.5, vitaminA: 0, vitaminC: 0, folate: 8, vitaminB6: 0.1 },
    category: "grains",
  },
  "vermicelli_rice": {
    names: ["رز بالشعرية", "ارز بالشعرية", "رز مصري بالشعرية", "rice with vermicelli"],
    per100g: { calories: 155, protein: 3.1, carbs: 29.5, fats: 2.8, fiber: 0.8, sugar: 0.2, sodium: 120 },
    micronutrients: { calcium: 14, iron: 0.6, magnesium: 15, potassium: 45, zinc: 0.6, vitaminA: 0, vitaminC: 0, folate: 12, vitaminB6: 0.1 },
    category: "grains",
  },
  "rice_moammar": {
    names: ["رز معمر", "ارز معمر", "رز معمر حادق", "rice moammar"],
    per100g: { calories: 195, protein: 5.2, carbs: 26.0, fats: 7.8, fiber: 0.6, sugar: 2.5, sodium: 220 },
    micronutrients: { calcium: 95, iron: 0.4, magnesium: 20, potassium: 110, zinc: 0.8, vitaminA: 45, vitaminC: 0, vitaminD: 0.3, vitaminB12: 0.3, folate: 10, vitaminB6: 0.1 },
    category: "grains",
  },
  "baladi_bread": {
    names: ["عيش بلدي", "خبز بلدي", "رغيف بلدي", "egyptian baladi bread"],
    per100g: { calories: 235, protein: 8.5, carbs: 48.0, fats: 1.2, fiber: 5.8, sugar: 1.0, sodium: 380 },
    micronutrients: { calcium: 35, iron: 2.5, magnesium: 45, potassium: 160, zinc: 1.2, vitaminA: 0, vitaminC: 0, folate: 25, vitaminB6: 0.2 },
    category: "grains",
  },
  "pasta": {
    names: ["مكرونة", "مكرونة مسلوقة", "pasta"],
    per100g: { calories: 158, protein: 5.8, carbs: 31.0, fats: 0.9, fiber: 1.8, sugar: 0.6, sodium: 5 },
    micronutrients: { calcium: 12, iron: 1.3, magnesium: 21, potassium: 58, zinc: 0.7, vitaminA: 0, vitaminC: 0, folate: 18, vitaminB6: 0.1 },
    category: "grains",
  },
  "macarona_bechamel": {
    names: ["مكرونة بالبشاميل", "مكرونة بشاميل", "طاجن بشاميل", "macaroni bechamel"],
    per100g: { calories: 215, protein: 9.8, carbs: 22.5, fats: 9.6, fiber: 1.2, sugar: 2.2, sodium: 340 },
    micronutrients: { calcium: 110, iron: 1.8, magnesium: 28, potassium: 185, zinc: 1.5, vitaminA: 60, vitaminC: 1, vitaminD: 0.4, vitaminB12: 0.7, folate: 22, vitaminB6: 0.15 },
    category: "composite",
  },
  "koshary": {
    names: ["كشري", "كشري مصري", "طبق كشري", "koshary", "egyptian koshary"],
    per100g: { calories: 165, protein: 5.8, carbs: 28.5, fats: 3.6, fiber: 4.2, sugar: 1.8, sodium: 290 },
    micronutrients: { calcium: 38, iron: 2.4, magnesium: 36, potassium: 220, zinc: 1.1, vitaminA: 15, vitaminC: 4, folate: 45, vitaminB6: 0.2 },
    category: "composite",
  },
  "yellow_lentils": {
    names: ["عدس أصفر", "عدس", "شوربة عدس", "lentils", "yellow lentils"],
    per100g: { calories: 116, protein: 9.0, carbs: 20.1, fats: 0.4, fiber: 7.9, sugar: 1.8, sodium: 15 },
    micronutrients: { calcium: 19, iron: 3.3, magnesium: 36, potassium: 369, zinc: 1.3, vitaminA: 8, vitaminC: 1.5, folate: 181, vitaminB6: 0.2 },
    category: "legumes",
  },
  "ful_medames": {
    names: ["فول", "فول مدمس", "طبق فول", "fava beans", "ful medames"],
    per100g: { calories: 110, protein: 7.6, carbs: 17.5, fats: 1.8, fiber: 5.4, sugar: 1.2, sodium: 240 },
    micronutrients: { calcium: 42, iron: 2.1, magnesium: 44, potassium: 280, zinc: 1.0, vitaminA: 5, vitaminC: 2, folate: 110, vitaminB6: 0.18 },
    category: "legumes",
  },
  "falafel": {
    names: ["طعمية", "فلافل", "طعمية مصرية", "فلافل مصرية", "taameya", "falafel"],
    per100g: { calories: 290, protein: 11.2, carbs: 28.5, fats: 15.0, fiber: 6.8, sugar: 1.5, sodium: 460 },
    micronutrients: { calcium: 65, iron: 3.1, magnesium: 58, potassium: 340, zinc: 1.6, vitaminA: 12, vitaminC: 3, folate: 85, vitaminB6: 0.25 },
    category: "legumes",
  },

  // ── Egyptian Cooked Vegetables & Stews (طواجن وخضار مطبوخ) ──────────────────
  "molokhia": {
    names: ["ملوخية", "ملوخية خضرا", "شوربة ملوخية", "طبق ملوخية", "molokhia", "mulukhiyah"],
    per100g: { calories: 48, protein: 2.8, carbs: 5.2, fats: 2.1, fiber: 2.6, sugar: 0.8, sodium: 190 },
    micronutrients: { calcium: 160, iron: 2.8, magnesium: 48, potassium: 380, zinc: 0.8, vitaminA: 280, vitaminC: 18, folate: 65, vitaminB6: 0.3 },
    category: "vegetables",
  },
  "bamya": {
    names: ["بامية", "طاجن بامية", "بامية بالصلصة", "okra", "bamya"],
    per100g: { calories: 55, protein: 2.2, carbs: 7.4, fats: 2.2, fiber: 3.2, sugar: 2.1, sodium: 210 },
    micronutrients: { calcium: 82, iron: 1.2, magnesium: 57, potassium: 299, zinc: 0.6, vitaminA: 36, vitaminC: 23, folate: 60, vitaminB6: 0.2 },
    category: "vegetables",
  },
  "moussaka": {
    names: ["مسقعة", "مسقعة مصرية", "مسقعة باللحمة", "moussaka", "mesaa'aa"],
    per100g: { calories: 135, protein: 4.8, carbs: 10.5, fats: 8.5, fiber: 3.4, sugar: 3.8, sodium: 310 },
    micronutrients: { calcium: 35, iron: 1.4, magnesium: 26, potassium: 285, zinc: 0.8, vitaminA: 40, vitaminC: 9, folate: 24, vitaminB6: 0.18 },
    category: "composite",
  },
  "peas_and_carrots": {
    names: ["بسلة", "بسلة بالجزر", "طبيخ بسلة", "peas and carrots"],
    per100g: { calories: 72, protein: 3.5, carbs: 11.8, fats: 1.5, fiber: 4.0, sugar: 4.2, sodium: 180 },
    micronutrients: { calcium: 32, iron: 1.3, magnesium: 28, potassium: 240, zinc: 0.9, vitaminA: 380, vitaminC: 22, folate: 48, vitaminB6: 0.16 },
    category: "vegetables",
  },
  "mahshi_cabbage": {
    names: ["محشي كرنب", "محشى كرنب", "stuffed cabbage"],
    per100g: { calories: 125, protein: 2.6, carbs: 21.0, fats: 3.5, fiber: 2.8, sugar: 2.5, sodium: 280 },
    micronutrients: { calcium: 48, iron: 1.1, magnesium: 22, potassium: 210, zinc: 0.5, vitaminA: 30, vitaminC: 28, folate: 35, vitaminB6: 0.2 },
    category: "composite",
  },
  "mahshi_grape_leaves": {
    names: ["محشي ورق عنب", "ورق عنب", "stuffed grape leaves"],
    per100g: { calories: 140, protein: 3.2, carbs: 22.5, fats: 4.5, fiber: 3.6, sugar: 1.8, sodium: 310 },
    micronutrients: { calcium: 88, iron: 2.2, magnesium: 35, potassium: 260, zinc: 0.7, vitaminA: 110, vitaminC: 14, folate: 40, vitaminB6: 0.22 },
    category: "composite",
  },
  "mahshi_zucchini": {
    names: ["محشي كوسة", "محشى كوسة", "stuffed zucchini"],
    per100g: { calories: 110, protein: 2.4, carbs: 18.0, fats: 3.2, fiber: 2.2, sugar: 2.0, sodium: 260 },
    micronutrients: { calcium: 32, iron: 0.9, magnesium: 24, potassium: 230, zinc: 0.5, vitaminA: 25, vitaminC: 16, folate: 28, vitaminB6: 0.18 },
    category: "composite",
  },
  "hawawshi": {
    names: ["حواوشي", "حواوشى", "حواوشي مصري", "hawawshi"],
    per100g: { calories: 285, protein: 14.5, carbs: 24.0, fats: 15.0, fiber: 2.1, sugar: 1.4, sodium: 520 },
    micronutrients: { calcium: 45, iron: 2.8, magnesium: 32, potassium: 290, zinc: 3.2, vitaminA: 25, vitaminC: 4, vitaminB12: 1.4, folate: 22, vitaminB6: 0.28 },
    category: "meat",
  },

  // ── Meats, Poultry & Seafood (لحوم وفراخ وأسماك) ─────────────────────────
  "grilled_chicken_breast": {
    names: ["فراخ مشوية", "صدر فرخة", "صدور فراخ", "دجاج مشوي", "grilled chicken breast"],
    per100g: { calories: 165, protein: 31.0, carbs: 0.0, fats: 3.6, fiber: 0.0, sugar: 0.0, sodium: 74 },
    micronutrients: { calcium: 15, iron: 1.0, magnesium: 29, potassium: 330, zinc: 1.0, vitaminA: 10, vitaminC: 0, vitaminB12: 0.4, folate: 4, vitaminB6: 0.6 },
    category: "poultry",
  },
  "boiled_chicken": {
    names: ["فراخ مسلوقة", "دجاج مسلوق", "boiled chicken"],
    per100g: { calories: 150, protein: 28.5, carbs: 0.0, fats: 3.8, fiber: 0.0, sugar: 0.0, sodium: 80 },
    micronutrients: { calcium: 14, iron: 0.9, magnesium: 26, potassium: 310, zinc: 1.0, vitaminA: 8, vitaminC: 0, vitaminB12: 0.4, folate: 4, vitaminB6: 0.55 },
    category: "poultry",
  },
  "pane_chicken": {
    names: ["فراخ بانيه", "بانيه", "دجاج بانيه", "chicken pane"],
    per100g: { calories: 240, protein: 22.0, carbs: 12.5, fats: 11.5, fiber: 0.8, sugar: 0.4, sodium: 390 },
    micronutrients: { calcium: 24, iron: 1.4, magnesium: 28, potassium: 280, zinc: 1.2, vitaminA: 15, vitaminC: 0, vitaminB12: 0.4, folate: 14, vitaminB6: 0.4 },
    category: "poultry",
  },
  "grilled_kofta": {
    names: ["كفتة مشوية", "كفتة", "كفتة حاتي", "grilled kofta"],
    per100g: { calories: 260, protein: 18.5, carbs: 4.5, fats: 18.5, fiber: 0.6, sugar: 0.8, sodium: 480 },
    micronutrients: { calcium: 30, iron: 2.6, magnesium: 24, potassium: 310, zinc: 4.1, vitaminA: 18, vitaminC: 2, vitaminB12: 1.8, folate: 12, vitaminB6: 0.32 },
    category: "meat",
  },
  "alexandrian_liver": {
    names: ["كبدة إسكندراني", "كبدة اسكندراني", "كبدة", "alexandrian liver"],
    per100g: { calories: 195, protein: 24.5, carbs: 4.2, fats: 8.8, fiber: 0.7, sugar: 1.1, sodium: 420 },
    micronutrients: { calcium: 22, iron: 9.5, magnesium: 25, potassium: 360, zinc: 5.8, vitaminA: 4200, vitaminC: 25, vitaminB12: 59.0, folate: 260, vitaminB6: 0.85 },
    category: "meat",
  },
  "boiled_beef": {
    names: ["لحمة مسلوقة", "لحم مسلوق", "لحمة", "boiled beef"],
    per100g: { calories: 215, protein: 26.5, carbs: 0.0, fats: 11.8, fiber: 0.0, sugar: 0.0, sodium: 65 },
    micronutrients: { calcium: 18, iron: 2.9, magnesium: 24, potassium: 340, zinc: 5.2, vitaminA: 0, vitaminC: 0, vitaminB12: 2.6, folate: 8, vitaminB6: 0.4 },
    category: "meat",
  },
  "tilapia_fish": {
    names: ["سمك بلطي", "بلطي مشوي", "سمك مشوي", "grilled tilapia"],
    per100g: { calories: 128, protein: 26.1, carbs: 0.0, fats: 2.7, fiber: 0.0, sugar: 0.0, sodium: 56 },
    micronutrients: { calcium: 14, iron: 0.6, magnesium: 34, potassium: 380, zinc: 0.4, vitaminA: 0, vitaminC: 0, vitaminD: 3.1, vitaminB12: 1.9, folate: 6, vitaminB6: 0.2 },
    category: "seafood",
  },
  "boiled_egg": {
    names: ["بيض مسلوق", "بيضة مسلوقة", "boiled egg"],
    per100g: { calories: 155, protein: 12.6, carbs: 1.1, fats: 10.6, fiber: 0.0, sugar: 1.1, sodium: 124 },
    micronutrients: { calcium: 50, iron: 1.8, magnesium: 12, potassium: 126, zinc: 1.1, vitaminA: 160, vitaminC: 0, vitaminD: 2.0, vitaminB12: 1.1, folate: 47, vitaminB6: 0.14 },
    category: "dairy_eggs",
  },
  "fried_egg_ghee": {
    names: ["بيض مقلي", "بيض بالسمنة", "أومليت", "fried egg"],
    per100g: { calories: 196, protein: 12.0, carbs: 1.0, fats: 15.5, fiber: 0.0, sugar: 0.8, sodium: 180 },
    micronutrients: { calcium: 52, iron: 1.7, magnesium: 12, potassium: 130, zinc: 1.1, vitaminA: 210, vitaminC: 0, vitaminD: 2.1, vitaminB12: 1.0, folate: 45, vitaminB6: 0.13 },
    category: "dairy_eggs",
  },
  "cottage_cheese": {
    names: ["جبنة قريش", "جبن قريش", "قريش", "cottage cheese"],
    per100g: { calories: 98, protein: 11.1, carbs: 3.4, fats: 4.3, fiber: 0.0, sugar: 2.7, sodium: 360 },
    micronutrients: { calcium: 83, iron: 0.1, magnesium: 11, potassium: 104, zinc: 0.5, vitaminA: 37, vitaminC: 0, vitaminB12: 0.5, folate: 12, vitaminB6: 0.06 },
    category: "dairy_eggs",
  },

  // ── Fresh Fruits & Vegetables (فواكه وخضار طازجة) ──────────────────────────
  "tomato": {
    names: ["طماطم", "قوطة", "بندورة", "tomato"],
    per100g: { calories: 18, protein: 0.9, carbs: 3.9, fats: 0.2, fiber: 1.2, sugar: 2.6, sodium: 5 },
    micronutrients: { calcium: 10, iron: 0.3, magnesium: 11, potassium: 237, zinc: 0.2, vitaminA: 42, vitaminC: 14, folate: 15, vitaminB6: 0.08 },
    category: "fruits_veg",
  },
  "cucumber": {
    names: ["خيار", "خيار طازة", "cucumber"],
    per100g: { calories: 15, protein: 0.7, carbs: 3.6, fats: 0.1, fiber: 0.5, sugar: 1.7, sodium: 2 },
    micronutrients: { calcium: 16, iron: 0.3, magnesium: 13, potassium: 147, zinc: 0.2, vitaminA: 5, vitaminC: 2.8, folate: 7, vitaminB6: 0.04 },
    category: "fruits_veg",
  },
  "apple": {
    names: ["تفاح", "تفاحة", "تفاح أحمر", "تفاح أخضر", "apple"],
    per100g: { calories: 52, protein: 0.3, carbs: 13.8, fats: 0.2, fiber: 2.4, sugar: 10.4, sodium: 1 },
    micronutrients: { calcium: 6, iron: 0.1, magnesium: 5, potassium: 107, zinc: 0.1, vitaminA: 3, vitaminC: 4.6, folate: 3, vitaminB6: 0.04 },
    category: "fruits_veg",
  },
  "banana": {
    names: ["موز", "موزة", "banana"],
    per100g: { calories: 89, protein: 1.1, carbs: 22.8, fats: 0.3, fiber: 2.6, sugar: 12.2, sodium: 1 },
    micronutrients: { calcium: 5, iron: 0.3, magnesium: 27, potassium: 358, zinc: 0.15, vitaminA: 4, vitaminC: 8.7, folate: 20, vitaminB6: 0.37 },
    category: "fruits_veg",
  },
  "orange": {
    names: ["برتقال", "برتقالة", "orange"],
    per100g: { calories: 47, protein: 0.9, carbs: 11.8, fats: 0.1, fiber: 2.4, sugar: 9.4, sodium: 0 },
    micronutrients: { calcium: 40, iron: 0.1, magnesium: 10, potassium: 181, zinc: 0.1, vitaminA: 11, vitaminC: 53.2, folate: 30, vitaminB6: 0.06 },
    category: "fruits_veg",
  },
  "mango": {
    names: ["مانجو", "مانجا", "mango"],
    per100g: { calories: 60, protein: 0.8, carbs: 15.0, fats: 0.4, fiber: 1.6, sugar: 13.7, sodium: 1 },
    micronutrients: { calcium: 11, iron: 0.2, magnesium: 10, potassium: 168, zinc: 0.1, vitaminA: 54, vitaminC: 36.4, folate: 43, vitaminB6: 0.12 },
    category: "fruits_veg",
  },
  "guava": {
    names: ["جوافة", "guava"],
    per100g: { calories: 68, protein: 2.6, carbs: 14.3, fats: 1.0, fiber: 5.4, sugar: 8.9, sodium: 2 },
    micronutrients: { calcium: 18, iron: 0.3, magnesium: 22, potassium: 417, zinc: 0.2, vitaminA: 31, vitaminC: 228.3, folate: 49, vitaminB6: 0.11 },
    category: "fruits_veg",
  },
  "watermelon": {
    names: ["بطيخ", "watermelon"],
    per100g: { calories: 30, protein: 0.6, carbs: 7.6, fats: 0.2, fiber: 0.4, sugar: 6.2, sodium: 1 },
    micronutrients: { calcium: 7, iron: 0.2, magnesium: 10, potassium: 112, zinc: 0.1, vitaminA: 28, vitaminC: 8.1, folate: 3, vitaminB6: 0.05 },
    category: "fruits_veg",
  },
  "boiled_potato": {
    names: ["بطاطس مسلوقة", "بطاطا مسلوقة", "boiled potato"],
    per100g: { calories: 87, protein: 1.9, carbs: 20.1, fats: 0.1, fiber: 1.8, sugar: 0.9, sodium: 4 },
    micronutrients: { calcium: 12, iron: 0.8, magnesium: 23, potassium: 379, zinc: 0.3, vitaminA: 0, vitaminC: 13.0, folate: 18, vitaminB6: 0.3 },
    category: "fruits_veg",
  },
  "french_fries": {
    names: ["بطاطس محمرة", "بطاطس مقلية", "french fries"],
    per100g: { calories: 312, protein: 3.4, carbs: 41.4, fats: 15.0, fiber: 3.8, sugar: 0.3, sodium: 320 },
    micronutrients: { calcium: 18, iron: 1.2, magnesium: 35, potassium: 579, zinc: 0.5, vitaminA: 0, vitaminC: 9.5, folate: 24, vitaminB6: 0.37 },
    category: "fruits_veg",
  },

  // ── Egyptian Desserts (حلويات مصرية) ──────────────────────────────────────
  "om_ali": {
    names: ["أم علي", "ام علي", "om ali", "umm ali"],
    per100g: { calories: 275, protein: 6.5, carbs: 36.0, fats: 12.0, fiber: 1.5, sugar: 22.0, sodium: 180 },
    micronutrients: { calcium: 140, iron: 1.2, magnesium: 32, potassium: 210, zinc: 0.9, vitaminA: 80, vitaminC: 1, vitaminD: 0.5, vitaminB12: 0.4, folate: 18, vitaminB6: 0.1 },
    category: "desserts",
  },
  "roz_bel_laban": {
    names: ["رز بلبن", "ارز باللبن", "rice pudding"],
    per100g: { calories: 145, protein: 3.8, carbs: 24.5, fats: 3.4, fiber: 0.4, sugar: 14.5, sodium: 75 },
    micronutrients: { calcium: 115, iron: 0.2, magnesium: 18, potassium: 150, zinc: 0.6, vitaminA: 40, vitaminC: 0.5, vitaminD: 0.4, vitaminB12: 0.4, folate: 8, vitaminB6: 0.08 },
    category: "desserts",
  },
  "basbousa": {
    names: ["بسبوسة", "بسبوسه", "basbousa"],
    per100g: { calories: 360, protein: 4.5, carbs: 58.0, fats: 13.0, fiber: 1.8, sugar: 38.0, sodium: 140 },
    micronutrients: { calcium: 45, iron: 0.9, magnesium: 22, potassium: 110, zinc: 0.5, vitaminA: 65, vitaminC: 0, folate: 12, vitaminB6: 0.06 },
    category: "desserts",
  },
};

/**
 * Normalizes text for matching Arabic spelling variations
 */
export function normalizeArabicText(str = "") {
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u065F]/g, ""); // strip tashkeel
}

/**
 * Finds reference food in database by exact or fuzzy match
 */
export function findFoodReference(name) {
  if (!name) return null;
  const normalized = normalizeArabicText(name);

  for (const [key, item] of Object.entries(FOOD_DATABASE)) {
    for (const alias of item.names) {
      const normAlias = normalizeArabicText(alias);
      if (normalized === normAlias || normalized.includes(normAlias) || normAlias.includes(normalized)) {
        return { key, ...item };
      }
    }
  }
  return null;
}

/**
 * Computes deterministic nutrition for an ingredient based on weight in grams
 */
export function calculateNutritionForIngredient(name, grams = 100) {
  const g = Math.max(0, Number(grams) || 0);
  const factor = g / 100;
  const ref = findFoodReference(name);

  if (ref) {
    const p = ref.per100g;
    const m = ref.micronutrients || {};
    return {
      found: true,
      calories: Math.round(p.calories * factor),
      protein: Number((p.protein * factor).toFixed(1)),
      carbs: Number((p.carbs * factor).toFixed(1)),
      fats: Number((p.fats * factor).toFixed(1)),
      fiber: Number(((p.fiber || 0) * factor).toFixed(1)),
      sugar: Number(((p.sugar || 0) * factor).toFixed(1)),
      sodium: Math.round((p.sodium || 0) * factor),
      micronutrients: {
        calcium: Math.round((m.calcium || 0) * factor),
        iron: Number(((m.iron || 0) * factor).toFixed(1)),
        magnesium: Math.round((m.magnesium || 0) * factor),
        potassium: Math.round((m.potassium || 0) * factor),
        zinc: Number(((m.zinc || 0) * factor).toFixed(1)),
        vitaminA: Math.round((m.vitaminA || 0) * factor),
        vitaminC: Number(((m.vitaminC || 0) * factor).toFixed(1)),
        vitaminD: Number(((m.vitaminD || 0) * factor).toFixed(1)),
        vitaminB12: Number(((m.vitaminB12 || 0) * factor).toFixed(1)),
        folate: Math.round((m.folate || 0) * factor),
        vitaminB6: Number(((m.vitaminB6 || 0) * factor).toFixed(2)),
      },
    };
  }

  // Fallback generic estimate when food is not in dictionary
  return {
    found: false,
    calories: Math.round(factor * 120),
    protein: Number((factor * 3).toFixed(1)),
    carbs: Number((factor * 15).toFixed(1)),
    fats: Number((factor * 3).toFixed(1)),
    fiber: Number((factor * 1).toFixed(1)),
    sugar: Number((factor * 1).toFixed(1)),
    sodium: Math.round(factor * 50),
    micronutrients: {},
  };
}

/**
 * Re-aggregates a full meal from its ingredients array
 */
export function recalculateMealNutrition(ingredients = []) {
  const totals = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    estimatedGrams: 0,
    micronutrients: {
      calcium: 0,
      iron: 0,
      magnesium: 0,
      potassium: 0,
      zinc: 0,
      vitaminA: 0,
      vitaminC: 0,
      vitaminD: 0,
      vitaminB12: 0,
      folate: 0,
      vitaminB6: 0,
    },
  };

  const processed = (ingredients || []).map((ing) => {
    const grams = Number(ing.estimatedGrams) || 100;
    totals.estimatedGrams += grams;

    // Use ingredient's existing numbers if provided, otherwise compute from dictionary
    const computed = calculateNutritionForIngredient(ing.nameArabic || ing.name, grams);

    const calories = ing.calories != null && ing.calories > 0 ? Number(ing.calories) : computed.calories;
    const protein = ing.protein != null && ing.protein > 0 ? Number(ing.protein) : computed.protein;
    const carbs = ing.carbs != null && ing.carbs > 0 ? Number(ing.carbs) : computed.carbs;
    const fats = ing.fats != null && ing.fats > 0 ? Number(ing.fats) : computed.fats;
    const fiber = ing.fiber != null ? Number(ing.fiber) : computed.fiber;
    const sugar = ing.sugar != null ? Number(ing.sugar) : computed.sugar;
    const sodium = ing.sodium != null ? Number(ing.sodium) : computed.sodium;

    totals.calories += calories;
    totals.protein += protein;
    totals.carbs += carbs;
    totals.fats += fats;
    totals.fiber += fiber;
    totals.sugar += sugar;
    totals.sodium += sodium;

    if (computed.micronutrients) {
      for (const [k, v] of Object.entries(computed.micronutrients)) {
        if (totals.micronutrients[k] != null && typeof v === "number") {
          totals.micronutrients[k] += v;
        }
      }
    }

    return {
      ...ing,
      estimatedGrams: grams,
      calories: Math.round(calories),
      protein: Number(protein.toFixed(1)),
      carbs: Number(carbs.toFixed(1)),
      fats: Number(fats.toFixed(1)),
      fiber: Number(fiber.toFixed(1)),
      sugar: Number(sugar.toFixed(1)),
      sodium: Math.round(sodium),
    };
  });

  // Round totals cleanly
  totals.calories = Math.round(totals.calories);
  totals.protein = Number(totals.protein.toFixed(1));
  totals.carbs = Number(totals.carbs.toFixed(1));
  totals.fats = Number(totals.fats.toFixed(1));
  totals.fiber = Number(totals.fiber.toFixed(1));
  totals.sugar = Number(totals.sugar.toFixed(1));
  totals.sodium = Math.round(totals.sodium);

  for (const k of Object.keys(totals.micronutrients)) {
    totals.micronutrients[k] = Number(totals.micronutrients[k].toFixed(1));
  }

  return { totals, ingredients: processed };
}

/**
 * Checks for complementary plant proteins and protein quality context
 */
export function detectProteinQuality(ingredients = []) {
  const names = ingredients.map((i) => normalizeArabicText(i.nameArabic || i.name)).join(" ");

  const hasLegumes = /عدس|فول|حمص|لوبيا|فاصوليا|طعميه|فلافل/.test(names);
  const hasGrains = /رز|ارز|عيش|خبز|مكرونه|شعريه|فريك/.test(names);
  const hasAnimalProtein = /فراخ|دجاج|لحم|كفته|كبده|سمك|بيض|جبن|تونة|جمبري/.test(names);

  if (hasAnimalProtein) {
    return "يحتوي على بروتين كامل عالي القيمة الحيوية مع جميع الأحماض الأمينية الأساسية.";
  }

  if (hasLegumes && hasGrains) {
    return "تكامل بروتيني ممتاز: دمج الحبوب مع البقوليات يوفّر ملفاً متكاملاً من الأحماض الأمينية الأساسية لبناء العضلات.";
  }

  if (hasLegumes) {
    return "مصدر نباتي غني بالألياف والبروتين، ويفضل تناوله مع حبوب (مثل العيش البلدي أو الأرز) لاكتمال الأحماض الأمينية.";
  }

  return "مصدر طاقة وكربوهيدرات متنوع مع نسبة خفيفة من البروتين النباتي.";
}

/**
 * Generates badge highlights for the UI
 */
export function generateNutritionalHighlights(nutrition = {}) {
  const highlights = [];
  const protein = Number(nutrition.protein) || 0;
  const fiber = Number(nutrition.fiber) || 0;
  const m = nutrition.micronutrients || {};

  if (protein >= 20) {
    highlights.push({ key: "protein", emoji: "💪", labelAr: "غني بالبروتين", descAr: `${protein} جم بروتين يدعم بناء واستشفاء العضلات` });
  }
  if (fiber >= 5) {
    highlights.push({ key: "fiber", emoji: "🌿", labelAr: "غني بالألياف", descAr: `${fiber} جم ألياف تعزز الشبع وصحة الجهاز الهضمي` });
  }
  if ((m.calcium || 0) >= 80) {
    highlights.push({ key: "calcium", emoji: "🦴", labelAr: "مصدر للكالسيوم", descAr: "يساهم في صحة العظام والأسنان ووظائف الأعصاب" });
  }
  if ((m.iron || 0) >= 2.0) {
    highlights.push({ key: "iron", emoji: "🩸", labelAr: "غني بالحديد", descAr: "يدعم تكوين الهيموجلوبين ونقل الأكسجين في الدم وتقليل الإجهاد" });
  }
  if ((m.potassium || 0) >= 300) {
    highlights.push({ key: "potassium", emoji: "⚡", labelAr: "غني بالبوتاسيوم", descAr: "يساهم في توازن السوائل وضغط الدم الطبيعي وانقباض العضلات" });
  }
  if ((m.vitaminC || 0) >= 20) {
    highlights.push({ key: "vitaminC", emoji: "🍊", labelAr: "غني بفيتامين C", descAr: "مضاد أكسدة قوي يدعم المناعة وامتصاص الحديد" });
  }
  if ((m.vitaminA || 0) >= 100) {
    highlights.push({ key: "vitaminA", emoji: "👁️", labelAr: "فيتامين A", descAr: "مهم لصحة النظر والبشرة والوظائف المناعية" });
  }

  return highlights;
}

/**
 * Generates educational summary: "Why is this food good?"
 */
export function generateWhyItsGood(foodName = "", ingredients = [], nutrition = {}) {
  const highlights = generateNutritionalHighlights(nutrition);
  const proteinNote = detectProteinQuality(ingredients);

  const keyPoints = highlights.map((h) => h.labelAr).join("، ");
  if (keyPoints) {
    return `يتميز هذا الطبق بأنه ${keyPoints}. ${proteinNote}`;
  }

  return `وجبة متوازنة توفر طاقة سريعة وسعرات محسوبة مع فوائد غذائية متنوعة. ${proteinNote}`;
}
