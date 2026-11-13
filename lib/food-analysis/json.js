/**
 * Tolerant JSON extraction for model replies.
 *
 * Models regularly wrap JSON in fences, prepend a sentence, or get cut off by
 * the token limit mid-object. Only the last case used to blow up with
 * "invalid JSON", so we repair truncation instead of failing the request.
 */

const FENCE = /```(?:json)?/gi;

function stripFences(text) {
  return String(text || "").replace(FENCE, "").trim();
}

/** Returns the first balanced object, or the rest of the text if unbalanced. */
export function extractJson(text) {
  const cleaned = stripFences(text);
  const start = cleaned.indexOf("{");
  if (start === -1) return cleaned;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < cleaned.length; i += 1) {
    const char = cleaned[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return cleaned.slice(start, i + 1);
    }
  }

  return cleaned.slice(start);
}

/** Closes an unterminated string/number and any open objects or arrays. */
function closeOpenJson(input) {
  let inString = false;
  let escaped = false;
  const stack = [];

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
      continue;
    }

    if (char === '"') inString = true;
    else if (char === "{") stack.push("}");
    else if (char === "[") stack.push("]");
    else if ((char === "}" || char === "]") && stack[stack.length - 1] === char) stack.pop();
  }

  let out = input;
  if (inString) out += '"';
  out = out.replace(/[,:\s]+$/, "");
  return out + stack.reverse().join("");
}

function tryParse(candidate) {
  try {
    const value = JSON.parse(candidate);
    return value && typeof value === "object" ? value : null;
  } catch {
    return null;
  }
}

function unparsable() {
  const error = new Error("model_json_unparsable");
  error.code = "invalid_json_response";
  return error;
}

export function parseModelJson(text) {
  const full = stripFences(text);
  const start = full.indexOf("{");
  if (start === -1) throw unparsable();

  const candidate = full.slice(start);

  // 1. Well-formed reply (possibly after a preamble or fences).
  const direct = tryParse(extractJson(candidate));
  if (direct) return direct;

  // 2. Reply cut off by max_tokens: close what is open.
  const closed = tryParse(closeOpenJson(candidate));
  if (closed) return closed;

  // 3. Cut off mid-member: drop the incomplete member, then close.
  const lastComma = candidate.lastIndexOf(",");
  if (lastComma > 0) {
    const trimmed = tryParse(closeOpenJson(candidate.slice(0, lastComma)));
    if (trimmed) return trimmed;
  }

  // 4. Stray trailing commas before a closing brace/bracket.
  const noTrailingCommas = extractJson(candidate).replace(/,\s*([}\]])/g, "$1");
  const recovered = tryParse(noTrailingCommas) || tryParse(closeOpenJson(noTrailingCommas));
  if (recovered) return recovered;

  throw unparsable();
}
