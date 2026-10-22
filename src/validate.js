// src/validate.js
// Provides getValidJson which calls the Gemini model, validates JSON shape, and retries once on error.
// The check function should throw an Error with a helpful message if the object is not acceptable.

const { callModel } = require('./llm'); // import callModel for use

/**
 * Extracts the first complete JSON object from a string.
 * Handles cases where the model wraps JSON in markdown fences,
 * adds explanation text before/after, or returns it bare.
 * Strategy:
 *  1. Strip ``` code fences if present.
 *  2. Find the first '{' and the matching closing '}' by brace counting.
 *  3. Fall back to the full trimmed string if no braces found.
 */
function extractJson(text) {
  // Step 1: strip any markdown code fences (```json ... ``` or ``` ... ```)
  let s = text.replace(/^```(?:json|javascript|js)?\s*\n?([\s\S]*?)\n?```\s*$/im, '$1').trim();

  // Step 2: find first '{' and its matching '}'
  const start = s.indexOf('{');
  if (start === -1) return s; // no object found — let JSON.parse fail with a clear message

  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\' && inString) { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }

  // Brace mismatch — return from first '{' onward and let JSON.parse report the error
  return s.slice(start);
}

/**
 * Calls the model and returns a parsed JSON object after validation.
 * Retries once if parsing or the check fails, providing the error message to the model.
 * @param {{system:string, user:string, check: (obj:any)=>void}} param
 * @returns {Promise<any>} parsed and validated JSON object
 */
async function getValidJson({ system, user, check, callFn }) {
  // Use the provided callFn or fallback to the real callModel at call time
  const fn = callFn || require('./llm').callModel;

  // Helper to invoke the model with optional error hint
  async function invokeModel(errorHint) {
    const promptUser = errorHint ? `${user}\n\nPrevious error: ${errorHint}` : user;
    const raw = await fn({ system, user: promptUser });
    const cleaned = extractJson(raw);
    return JSON.parse(cleaned);
  }

  try {
    const obj = await invokeModel();
    await check(obj);
    return obj;
  } catch (firstErr) {
    // Retry once with description of what went wrong
    try {
      const obj = await invokeModel(firstErr.message || String(firstErr));
      await check(obj);
      return obj;
    } catch (secondErr) {
      const err = new Error('Failed to obtain valid JSON from AI');
      err.status = 502;
      err.cause = secondErr;
      throw err;
    }
  }
}

module.exports = { getValidJson };
