// src/llm.js
// Gemini API wrapper – plain fetch, no extra npm packages.
// Reads API key and model name from environment variables.
// Returns the raw text response from the model.
// Timeout: 30 seconds. Errors do not expose the API key.

// Using the built‑in global fetch available in Node 20.

/**
 * Calls the Gemini model.
 * @param {{system:string, user:string}} param
 * @returns {Promise<string>} raw model text
 */
async function callModel({ system, user }) {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  if (!apiKey) throw new Error('AI_API_KEY not set');
  if (!model) throw new Error('AI_MODEL not set');

  const cleanModel = model.replace(/^models\//i, '').trim().replace(/^['"]|['"]$/g, '');
  const base = 'https://generativelanguage.googleapis.com/v1beta';
  const url = `${base}/models/${encodeURIComponent(cleanModel)}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30_000);

  const body = {
    systemInstruction: { role: 'system', parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!response.ok) {
      const txt = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${txt}`);
    }
    const data = await response.json();
    // The Gemini response contains candidates[0].content.parts[0].text
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') throw new Error('Unexpected Gemini response shape');
    return text;
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Gemini request timed out after 30 seconds');
    }
    // Ensure we never log the key in the error message
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

module.exports = { callModel };
