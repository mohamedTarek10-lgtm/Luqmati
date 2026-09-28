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
Identify the food, portion, calories, protein, carbs, fats, fiber, sugar, sodium, micronutrients, and individual ingredients with realistic Egyptian/Arabic preparation methods.

Return ONLY valid JSON matching this schema:
{
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
 * Common pipeline to compress image buffer and query OpenRouter AI
 */
export async function processAndAnalyzeFoodImage(imageBytes) {
  // 1. Normalize and compress image buffer using Sharp
  const normalizedBuffer = await sharp(Buffer.from(imageBytes))
    .rotate()
    .resize({ width: 1200, height: 1200, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer();

  const base64 = normalizedBuffer.toString("base64");
  const apiKey = process.env.OPENROUTER_API_KEY;

  // 2. Request AI Analysis
  const { content: rawContent } = await requestFoodAnalysis({
    apiKey,
    systemPrompt: SYSTEM_FOOD_PROMPT,
    userPrompt: "حلل محتويات ومكونات وسعرات هذا الطبق بدقة.",
    imageDataUrl: `data:image/jpeg;base64,${base64}`,
    maxTokens: 1000,
  });

  // 3. Parse JSON response
  let parsed;
  try {
    parsed = JSON.parse(extractJsonFromText(rawContent));
  } catch (err) {
    throw new FoodAnalysisError("AI provider returned invalid JSON", {
      status: 502,
      code: "invalid_json_response",
    });
  }

  // 4. Recalculate nutrition with Egyptian food dictionary
  const rawIngredients = Array.isArray(parsed.ingredients) ? parsed.ingredients : [];
  const { totals, ingredients } = recalculateMealNutrition(rawIngredients);

  return {
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
