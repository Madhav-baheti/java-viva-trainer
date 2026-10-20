// src/validate.js
// Provides getValidJson which calls the Gemini model, validates JSON shape, and retries once on error.
// The check function should throw an Error with a helpful message if the object is not acceptable.

const { callModel } = require('./llm'); // import callModel for use

/**
 * Strips Markdown code fences (```` ``` ````) from a string if present.
 * Handles optional language identifier after the opening fence.
 */
function stripCodeFences(text) {
  return text.replace(/^```\w*\n([\s\S]*?)\n```$/m, '$1').trim();
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
    const cleaned = stripCodeFences(raw);
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
