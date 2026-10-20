// public/js/api.js
// Simple fetch wrapper used by all front‑end modules.
// Returns parsed JSON on success, throws an Error with a readable message on failure.
// Network failures => "Couldn't reach the server"
// Non‑200 responses use the server's { "error": "msg" } payload.
// Times out after 40 seconds.

/**
 * POST JSON to the given path (relative to the server root).
 * @param {string} path - e.g. "/api/explain"
 * @param {object} body - JSON payload
 * @returns {Promise<any>} parsed JSON response
 */
async function post(path, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 40_000);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const data = await response.json();
    if (!response.ok) {
      // Server sent { error: "msg" }
      const msg = data && typeof data.error === 'string' ? data.error : response.statusText;
      throw new Error(msg);
    }
    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Request timed out');
    }
    if (err.message === 'Failed to fetch') {
      // Chrome/Edge generic network error string
      throw new Error("Couldn't reach the server");
    }
    // Any other error (including our custom message) is re‑thrown
    throw err;
  }
}

export { post };