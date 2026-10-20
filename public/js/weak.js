// public/js/weak.js
// Logic for the Weak Topics tab.
// Computes ranked topics for display and provides drillWeakTopics.

import { getStats } from './store.js';

/**
 * Returns topics with attempts sorted by average ascending (weakest first).
 * Each item: { name, avg, attempts, isWeak, level: 'weak'|'ok'|'good' }
 */
export function getRankedTopics() {
  const stats = getStats();
  const entries = Object.entries(stats.topics || {});
  const list = [];
  for (const [name, data] of entries) {
    if (Array.isArray(data.recent) && data.recent.length > 0) {
      const avg = data.recent.reduce((a, b) => a + b, 0) / data.recent.length;
      let level = 'ok';
      if (avg < 6) level = 'weak';
      else if (avg >= 8) level = 'good';

      list.push({
        name,
        avg: Math.round(avg * 10) / 10,
        attempts: data.attempts || data.recent.length,
        isWeak: avg < 6,
        level,
        lastSeen: data.lastSeen,
      });
    }
  }
  // Weakest first; ties broken by oldest lastSeen
  list.sort((a, b) => {
    if (a.avg !== b.avg) return a.avg - b.avg;
    return new Date(a.lastSeen || 0) - new Date(b.lastSeen || 0);
  });
  return list;
}

/**
 * Starts a weak‑topic drill session.
 * @param {Object} vivaController - controller from viva.js
 */
export async function drillWeakTopics(vivaController) {
  if (!vivaController || typeof vivaController.startSession !== 'function') {
    throw new Error('Invalid Viva controller');
  }
  vivaController.startSession({ source: 'weak' });
}
