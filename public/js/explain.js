// public/js/explain.js
// Wrapper for the Explain feature.
// Calls the /api/explain endpoint and returns the parsed JSON.
// Also provides a helper to start a Viva session from the current code.

import { post } from './api.js';

/** Explain given Java code. */
export async function explainCode(code) {
  if (typeof code !== 'string' || code.trim() === '') {
    throw new Error('Code cannot be empty');
  }
  return await post('/api/explain', { code });
}

/** Start a Viva session using the provided code.
 *  The UI can call this to "Quiz me on this code".
 */
export function startQuizFromExplain(code, vivaController) {
  if (!vivaController || typeof vivaController.startSession !== 'function') {
    throw new Error('Invalid Viva controller');
  }
  vivaController.startSession({ source: 'code', code });
}
