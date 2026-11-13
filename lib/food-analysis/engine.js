import { createHash } from "node:crypto";
import sharp from "sharp";
import {
  recalculateMealNutrition,
  generateNutritionalHighlights,
  generateWhyItsGood,
  detectProteinQuality,
} from "@/lib/nutrition/foodDictionary";
import {
  FoodAnalysisError,
  requestFoodAnalysis,
} from "@/lib/food-analysis/openrouter";

export const SYSTEM_FOOD_PROMPT = `
You are Luqmati (لقمتي), an expert AI food intelligence system specialized in Egyptian cuisine, Middle Eastern food, and general nutrition.

FIRST AND FOREMOST - FOOD VERIFICATION:
Inspect the image carefully. Does it contain edible food, raw cooking ingredients, groceries, or a beverage?
If the image does NOT depict food (for example: a human selfie, animals, clothes, shoes, electronics, cars, documents, random furniture, or a completely black/blurry unintelligible photo):
You MUST immediately return ONLY this JSON:
{
  "isFood": false,
  "reasonArabic": "هذه الصورة لا تبدو وجبة طعام أو مشروب. يرجى تصوير طبقك أو مكونات طعامك بوضوح."
}

IF THE IMAGE IS FOOD:
Identify the food, portion, calories, protein, carbs, fats, fiber, sugar, sodium, micronutrients, and individual ingredients with realistic Egyptian/Arabic preparation methods.
Set "isFood": true and return ONLY valid JSON matching this schema:
{
  "isFood": true,
  "foodName": "Food Name in English",
  "foodNameArabic": "اسم الطبق بالعربي",
  "descriptionArabic": "وصف دقيق ومختصر للطبق وطريقة تحضيره بالعربي",
  "portion": {
    "size": "طبق متوسط",
    "estimatedGrams": 250
  },
  "calories": 350,
  "protein": 22,
  "carbs": 40,
  "fats": 12,
  "fiber": 6,
  "sugar": 4,
  "sodium": 320,
  "micronutrients": {
    "calcium": 50,
    "iron": 3.2,
    "potassium": 410,
    "vitaminC": 15
  },
  "benefitsArabic": "فائدة صحية سريعة للطبق",
  "proteinQualityNote": "ملاحظة عن جودة البروتين",
  "ingredients": [
    {
      "name": "Ingredient Name",
      "nameArabic": "اسم المكون",
      "estimatedGrams": 100,
      "calories": 150,
      "protein": 10,
      "carbs": 20,
      "fats": 3
    }
  ],
  "confidence": "high"
}

confidence MUST be: "high" | "medium" | "low".
`;

export const SYSTEM_TEXT_FOOD_PROMPT = `
You are Luqmati (لقمتي), an expert AI food intelligence system specialized in Egyptian cuisine, Middle Eastern food, and general nutrition.
The user is describing a meal or food items they ate in Arabic or English (either written or transcribed from voice).

FIRST - VERIFY FOOD CONTENT:
Does the user text describe food, drinks, or ingredients?
If the text is clearly NOT related to food or is random gibberish (e.g. 'لابتوب', 'سيارة', 'شوز', random characters):
Return ONLY this JSON:
{
  "isFood": false,
  "reasonArabic": "الوصف لا يبدو وجبة طعام أو شراب. اكتب أو اذكر ما أكلته بوضوح (مثال: رغيف عيش بلدي مع قطعتين جبنة قريش وطماطم)."
}

IF IT IS FOOD:
Estimate realistic portions and nutritional breakdown based on standard Egyptian home-cooking and street-food portions.
Set "isFood": true and return ONLY valid JSON matching this schema:
{
  "isFood": true,
  "foodName": "Food Name in English",
  "foodNameArabic": "اسم الطبق أو الوجبة بالعربي",
  "descriptionArabic": "وصف دقيق للمكونات والكمية المقدرة بالعربي",
  "portion": {
    "size": "وجبة متوسطة",
    "estimatedGrams": 300
  },
  "calories": 420,
  "protein": 25,
  "carbs": 50,
  "fats": 14,
  "fiber": 7,
  "sugar": 5,
  "sodium": 380,
  "micronutrients": {
    "calcium": 60,
    "iron": 2.8,
    "potassium": 390,
    "vitaminC": 12
  },
  "benefitsArabic": "فائدة صحية سريعة للوجبة",
  "proteinQualityNote": "ملاحظة عن جودة البروتين",
  "ingredients": [
    {
      "name": "Ingredient Name",
      "nameArabic": "اسم المكون",
      "estimatedGrams": 120,
      "calories": 180,
      "protein": 12,
      "carbs": 24,
      "fats": 4
    }
  ],
  "confidence": "high"
}

confidence MUST be: "high" | "medium" | "low".
`;

export function extractJsonFromText(text) {
  if (!text) return "{}";
  const cleaned = text
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  let start = -1;
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = 0; i < cleaned.length; i += 1) {
    const char = cleaned[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === "{") {
      if (start === -1) start = i;
      depth += 1;
    } else if (char === "}" && start !== -1) {
      depth -= 1;
      if (depth === 0) {
        return cleaned.slice(start, i + 1);
      }
    }
  }

  return cleaned;
}

/**
 * Decode the upload once, then derive both the AI-sized JPEG and the stored
 * thumbnail from that single normalised buffer. The old version decoded the
 * original bytes twice per request.
 */
export async function buildFoodImage(imageBytes) {
  const input = Buffer.from(imageBytes);

  const normalizedBuffer = await sharp(input)
    .rotate()
    .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const thumbnailBuffer = await sharp(normalizedBuffer)
    .resize({ width: 480, height: 480, fit: "cover", position: "centre" })
    .webp({ quality: 75 })
    .toBuffer();

  return {
    visionDataUrl: "data:image/jpeg;base64," + normalizedBuffer.toString("base64"),
    thumbnailBuffer,
    thumbnailDataUrl: "data:image/webp;base64," + thumbnailBuffer.toString("base64"),
    imageHash: createHash("sha256").update(input).digest("hex"),
  };
}

/**
 * Send an already prepared (normalised) image to the vision model.
 */
export async function analyzePreparedFoodImage(visionDataUrl) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  const { content: rawContent } = await requestFoodAnalysis({
    apiKey,
    systemPrompt: SYSTEM_FOOD_PROMPT,
    userPrompt: "حلل محتويات ومكونات وسعرات هذا الطبق بدقة. إذا لم يكن طعاماً أرجع isFood: false.",
    imageDataUrl: visionDataUrl,
    maxTokens: 1000,
  });

  let parsed;
  try {
    parsed = JSON.parse(extractJsonFromText(rawContent));
  } catch (err) {
    throw new FoodAnalysisError("AI provider returned invalid JSON", {
      status: 502,
      code: "invalid_json_response",
    });
  }

  if (parsed.isFood === false) {
    throw new FoodAnalysisError(
      parsed.reasonArabic || "هذه الصورة لا تبدو وجبة طعام أو شراب. يرجى تصوير طبقك أو مكونات طعامك بوضوح.",
      { status: 400, code: "not_food" }
    );
  }

  const rawIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
  const { totals, ingredients } = recalculateMealNutrition(rawIngredients);

  return {
    isFood: true,
    foodName: parsed.foodName || "Meal",
    foodNameArabic: parsed.foodNameArabic || parsed.foodName || "طبق غير محدد",
    descriptionArabic: parsed.descriptionArabic || "",
    portion: {
      size: parsed.portion?.size || "طبق متوسط",
      estimatedGrams: parsed.portion?.estimatedGrams || totals.estimatedGrams || 250,
    },
    calories: parsed.calories || totals.calories,
    protein: parsed.protein != null ? parsed.protein : totals.protein,
    carbs: parsed.carbs != null ? parsed.carbs : totals.carbs,
    fats: parsed.fats != null ? parsed.fats : totals.fats,
    fiber: parsed.fiber != null ? parsed.fiber : totals.fiber,
    sugar: parsed.sugar != null ? parsed.sugar : totals.sugar,
    sodium: parsed.sodium != null ? parsed.sodium : totals.sodium,
    micronutrients: {
      calcium: parsed.micronutrients?.calcium || totals.micronutrients?.calcium || 0,
      iron: parsed.micronutrients?.iron || totals.micronutrients?.iron || 0,
      potassium: parsed.micronutrients?.potassium || totals.micronutrients?.potassium || 0,
      vitaminC: parsed.micronutrients?.vitaminC || totals.micronutrients?.vitaminC || 0,
    },
    nutritionHighlights: generateNutritionalHighlights(totals),
    benefitsArabic:
      parsed.benefitsArabic ||
      generateWhyItsGood(parsed.foodNameArabic, ingredients, totals),
    proteinQualityNote:
      parsed.proteinQualityNote || detectProteinQuality(ingredients),
    ingredients,
    confidence: parsed.confidence || "medium",
  };
}

/**
 * Full image pipeline: prepare, analyse, and return the thumbnail to store.
 */
export async function processAndAnalyzeFoodImage(imageBytes) {
  const prepared = await buildFoodImage(imageBytes);
  const result = await analyzePreparedFoodImage(prepared.visionDataUrl);
  return {
    result,
    imageHash: prepared.imageHash,
    thumbnailBuffer: prepared.thumbnailBuffer,
    thumbnailDataUrl: prepared.thumbnailDataUrl,
  };
}

/**
 * Pipeline to analyze meal from natural Arabic/English text or voice transcription
 */
export async function processAndAnalyzeFoodText(mealDescription) {
  if (!mealDescription || !mealDescription.trim()) {
    throw new FoodAnalysisError("يرجى كتابة أو ذكر تفاصيل الوجبة أولاً.", {
      status: 400,
      code: "missing_text",
    });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;

  // 1. Request AI Text Analysis
  const { content: rawContent } = await requestFoodAnalysis({
    apiKey,
    systemPrompt: SYSTEM_TEXT_FOOD_PROMPT,
    userPrompt: `حلل هذه الوجبة الموصوفة بدقة: "${mealDescription.trim()}"`,
    imageDataUrl: null, // text-only
    maxTokens: 1000,
  });

  // 2. Parse JSON response
  let parsed;
  try {
    parsed = JSON.parse(extractJsonFromText(rawContent));
  } catch (err) {
    throw new FoodAnalysisError("AI provider returned invalid JSON", {
      status: 502,
      code: "invalid_json_response",
    });
  }

  // 3. Non-Food Guardrail for Text
  if (parsed.isFood === false) {
    throw new FoodAnalysisError(
      parsed.reasonArabic || "النص المكتوب لا يبدو وجبة طعام أو مشروب. اكتب مكونات ما أكلته بوضوح.",
      { status: 400, code: "not_food" }
    );
  }

  // 4. Recalculate nutrition with Egyptian food dictionary
  const rawIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
  const { totals, ingredients } = recalculateMealNutrition(rawIngredients);

  return {
    isFood: true,
    isTextOnly: true,
    imageUrl: null,
    thumbnailDataUrl: null,
    foodName: parsed.foodName || "Meal",
    foodNameArabic: parsed.foodNameArabic || parsed.foodName || "وجبة موصوفة",
    descriptionArabic: parsed.descriptionArabic || mealDescription.trim(),
    portion: {
      size: parsed.portion?.size || "وجبة مقدرة",
      estimatedGrams: parsed.portion?.estimatedGrams || totals.estimatedGrams || 250,
    },
    calories: parsed.calories || totals.calories,
    protein: parsed.protein != null ? parsed.protein : totals.protein,
    carbs: parsed.carbs != null ? parsed.carbs : totals.carbs,
    fats: parsed.fats != null ? parsed.fats : totals.fats,
    fiber: parsed.fiber != null ? parsed.fiber : totals.fiber,
    sugar: parsed.sugar != null ? parsed.sugar : totals.sugar,
    sodium: parsed.sodium != null ? parsed.sodium : totals.sodium,
    micronutrients: {
      calcium: parsed.micronutrients?.calcium || totals.micronutrients?.calcium || 0,
      iron: parsed.micronutrients?.iron || totals.micronutrients?.iron || 0,
      potassium: parsed.micronutrients?.potassium || totals.micronutrients?.potassium || 0,
      vitaminC: parsed.micronutrients?.vitaminC || totals.micronutrients?.vitaminC || 0,
    },
    nutritionHighlights: generateNutritionalHighlights(totals),
    benefitsArabic:
      parsed.benefitsArabic ||
      generateWhyItsGood(parsed.foodNameArabic, ingredients, totals),
    proteinQualityNote:
      parsed.proteinQualityNote || detectProteinQuality(ingredients),
    ingredients,
    confidence: parsed.confidence || "high",
  };
}
