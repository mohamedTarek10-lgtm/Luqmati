const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

// Very cheap and reliable vision-capable fallbacks
const DEFAULT_FALLBACK_MODELS = [
  "google/gemini-flash-1.5-8b",
  "google/gemini-2.0-flash-001",
  "meta-llama/llama-4-maverick:free",
  "google/gemma-3-27b-it:free",
];

// Temporary provider errors that allow trying the next model.
const RETRYABLE_STATUS_CODES = new Set([400, 403, 404, 408, 429, 500, 502, 503, 504]);

// Vision models can take time. Fail fast after 25s to try the next model.
const REQUEST_TIMEOUT_MS = 25_000;

export class FoodAnalysisError extends Error {
  constructor(message, { status = 503, code = "provider_unavailable" } = {}) {
    super(message);
    this.name = "FoodAnalysisError";
    this.status = status;
    this.code = code;
  }
}

/**
 * Normalize OpenRouter message.content to a plain string.
 */
function getAssistantText(content) {
  if (typeof content === "string") return content.trim();

  if (Array.isArray(content)) {
    return content
      .filter((part) => typeof part?.text === "string")
      .map((part) => part.text)
      .join("\n")
      .trim();
  }

  return "";
}

/**
 * Build the ordered model list.
 *
 * Priority:
 *  1. OPENROUTER_MODEL env var
 *  2. OPENROUTER_FALLBACK_MODELS env var (comma-separated)
 *  3. Built-in fallbacks above
 */
export function configuredModels() {
  const primary = process.env.OPENROUTER_MODEL?.trim();

  const envFallbacks = (process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  return [
    ...new Set([
      ...(primary ? [primary] : []),
      ...envFallbacks,
      ...DEFAULT_FALLBACK_MODELS,
    ]),
  ];
}

/**
 * Validate image data URL format before sending.
 */
export function validateImageDataUrl(imageDataUrl) {
  if (
    typeof imageDataUrl !== "string" ||
    !imageDataUrl.startsWith("data:image/")
  ) {
    throw new FoodAnalysisError("Invalid image data.", {
      status: 400,
      code: "invalid_image_data",
    });
  }
}

/**
 * Whether the error is a temporary provider issue (safe to retry with next model).
 */
function isRetryable(error) {
  return (
    error instanceof FoodAnalysisError &&
    RETRYABLE_STATUS_CODES.has(error.status)
  );
}

/**
 * Call one model exactly once.
 */
async function callModel({ apiKey, model, systemPrompt, userPrompt, imageDataUrl, maxTokens }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    validateImageDataUrl(imageDataUrl);

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL || "https://luqmati.app",
        "X-Title": "Luqmati",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: Number.isFinite(maxTokens) && maxTokens > 0 ? maxTokens : 700,
      }),
    });

    const rawText = await response.text();
    let data = null;
    try {
      data = JSON.parse(rawText);
    } catch {
      // Invalid JSON handled below.
    }

    if (!response.ok) {
      const providerMessage = String(
        data?.error?.message || data?.message || rawText || ""
      ).slice(0, 500);

      const providerCode =
        data?.error?.code || data?.code || `http_${response.status}`;

      console.error("[Luqmati] OpenRouter error", {
        model,
        status: response.status,
        code: providerCode,
        message: providerMessage,
      });

      throw new FoodAnalysisError(
        providerMessage || `OpenRouter returned HTTP ${response.status}.`,
        { status: response.status, code: providerCode }
      );
    }

    const content = getAssistantText(data?.choices?.[0]?.message?.content);

    if (!content) {
      console.warn(`[Luqmati] Empty response from model: ${model}`);
      throw new FoodAnalysisError("The model returned an empty response.", {
        status: 502,
        code: "empty_model_response",
      });
    }

    return { content, model };
  } catch (error) {
    if (error?.name === "AbortError") {
      console.warn(
        `[Luqmati] Timeout after ${REQUEST_TIMEOUT_MS}ms: ${model}`
      );
      throw new FoodAnalysisError("The model request timed out.", {
        status: 504,
        code: "timeout",
      });
    }

    if (error instanceof FoodAnalysisError) throw error;

    console.error(`[Luqmati] Network error for ${model}:`, error);
    throw new FoodAnalysisError("Could not connect to OpenRouter.", {
      status: 503,
      code: "network_error",
    });
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Main food-analysis function.
 *
 * Tries models in priority order, falling back on retryable errors.
 */
export async function requestFoodAnalysis({
  apiKey,
  systemPrompt,
  userPrompt,
  imageDataUrl,
  maxTokens,
}) {
  if (!apiKey || !apiKey.startsWith("sk-or-")) {
    throw new FoodAnalysisError("OpenRouter is not configured.", {
      status: 503,
      code: "missing_api_key",
    });
  }

  validateImageDataUrl(imageDataUrl);

  const models = configuredModels();

  if (!models.length) {
    throw new FoodAnalysisError("No vision models are configured.", {
      status: 503,
      code: "no_models_configured",
    });
  }

  let lastError = null;

  for (let index = 0; index < models.length; index += 1) {
    const model = models[index];
    const isFallback = index > 0;

    console.log(
      `[Luqmati] Food vision: trying ${isFallback ? "fallback" : "primary"} model: ${model}`
    );

    try {
      const result = await callModel({
        apiKey,
        model,
        systemPrompt,
        userPrompt,
        imageDataUrl,
        maxTokens,
      });

      console.log(`[Luqmati] Food vision succeeded with: ${model}`);
      return result;
    } catch (error) {
      lastError = error;

      console.warn("[Luqmati] Food vision failed", {
        model,
        status: error?.status,
        code: error?.code,
        message: error?.message,
      });

      if (!isRetryable(error)) throw error;
    }
  }

  console.error("[Luqmati] All vision models failed", {
    lastStatus: lastError?.status,
    lastCode: lastError?.code,
    lastMessage: lastError?.message,
  });

  throw new FoodAnalysisError(
    "All configured vision models are temporarily unavailable.",
    {
      status: lastError?.status || 503,
      code: lastError?.code || "all_models_failed",
    }
  );
}