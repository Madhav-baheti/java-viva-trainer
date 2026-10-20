// public/js/store.js
// Browser‑side progress tracker using localStorage.
// Implements the data model described in ARCHITECTURE.md §7.

const LS_KEY = 'vivapilot.stats';
const MAX_RECENT = 5;
// Fixed topic list – copy of src/topics.js (section 5 of ARCHITECTURE)
const TOPIC_LIST = [
  'java-basics', 'strings', 'arrays', 'loops-control-flow', 'classes-objects',
  'constructors', 'encapsulation', 'inheritance', 'polymorphism', 'abstraction-interfaces',
  'exceptions', 'collections', 'generics', 'file-io', 'multithreading',
];

/** Safe JSON parse – returns fallback on error */
function safeParse(str) {
  try { return JSON.parse(str); } catch { return null; }
}

/** Retrieve the whole stats object from localStorage */
function getStats() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    const obj = safeParse(raw);
    if (obj && typeof obj === 'object' && obj.version === 1 && typeof obj.topics === 'object') {
      return obj;
    }
  } catch (_) {}
  // fallback – empty structure
  return { version: 1, topics: {} };
}

/** Write the whole stats object back to localStorage */
function _save(stats) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(stats));
  } catch (_) {
    // ignore – progress will be lost but app keeps working
  }
}

/** Record a new answer for a topic */
function recordAnswer(topic, score) {
  if (typeof topic !== 'string' || typeof score !== 'number') return;
  const stats = getStats();
  if (!stats.topics[topic]) {
    stats.topics[topic] = { attempts: 0, recent: [], lastSeen: null };
  }
  const t = stats.topics[topic];
  t.attempts += 1;
  t.recent.push(score);
  if (t.recent.length > MAX_RECENT) t.recent.shift();
  t.lastSeen = new Date().toISOString();
  _save(stats);
}

/** Compute average of recent scores for a topic */
function _average(topicObj) {
  if (!topicObj || !Array.isArray(topicObj.recent) || topicObj.recent.length === 0) return null;
  const sum = topicObj.recent.reduce((a, b) => a + b, 0);
  return sum / topicObj.recent.length;
}

/** Return weak topics (avg < 6) sorted by avg ascending, ties broken by oldest lastSeen */
function getWeakTopics() {
  const stats = getStats();
  const entries = Object.entries(stats.topics || {});
  const weak = [];
  for (const [name, data] of entries) {
    const avg = _average(data);
    if (avg !== null && avg < 6) {
      weak.push({ name, avg, lastSeen: data.lastSeen });
    }
  }
  weak.sort((a, b) => {
    if (a.avg !== b.avg) return a.avg - b.avg;
    return new Date(a.lastSeen) - new Date(b.lastSeen);
  });
  return weak.map((o) => o.name);
}

/** Return drill topics following ARCHITECTURE.md §7:
 *  1. weak topics sorted by avg ascending, ties broken by oldest lastSeen
 *  2. if no weak topics yet -> pick the lowest-average topic
 *  3. if there is no data at all -> pick from topic list at random
 */
function getDrillTopics() {
  const weak = getWeakTopics();
  if (weak.length > 0) {
    return weak;
  }
  const stats = getStats();
  const entries = Object.entries(stats.topics || {});
  if (entries.length > 0) {
    const withAvg = entries
      .map(([name, data]) => ({ name, avg: _average(data), lastSeen: data.lastSeen }))
      .filter((o) => o.avg !== null);
    if (withAvg.length > 0) {
      withAvg.sort((a, b) => {
        if (a.avg !== b.avg) return a.avg - b.avg;
        return new Date(a.lastSeen) - new Date(b.lastSeen);
      });
      return [withAvg[0].name];
    }
  }
  const rand = TOPIC_LIST[Math.floor(Math.random() * TOPIC_LIST.length)];
  return [rand];
}

/** Reset all progress */
function reset() {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(LS_KEY);
    }
  } catch (_) {}
}

export { getStats, recordAnswer, getWeakTopics, getDrillTopics, reset, TOPIC_LIST };