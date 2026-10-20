// test/store.test.js
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// In-memory localStorage mock
class MockLocalStorage {
  constructor() {
    this.store = {};
  }
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }
  setItem(key, value) {
    this.store[key] = String(value);
  }
  removeItem(key) {
    delete this.store[key];
  }
  clear() {
    this.store = {};
  }
}

describe('store.js logic', async () => {
  let storeModule;

  beforeEach(async () => {
    global.localStorage = new MockLocalStorage();
    // Dynamic import to get fresh module
    storeModule = await import('../public/js/store.js');
    storeModule.reset();
  });

  test('weak detection: topic with avg < 6 is weak', () => {
    storeModule.recordAnswer('inheritance', 4);
    storeModule.recordAnswer('inheritance', 5); // avg = 4.5
    storeModule.recordAnswer('exceptions', 8);
    storeModule.recordAnswer('exceptions', 9); // avg = 8.5

    const weak = storeModule.getWeakTopics();
    assert.deepStrictEqual(weak, ['inheritance']);
  });

  test('ordering: weak topics sorted by avg ascending, ties broken by oldest lastSeen', async () => {
    storeModule.recordAnswer('arrays', 3);
    // Artificially change lastSeen to ensure order
    const stats = storeModule.getStats();
    stats.topics['arrays'].lastSeen = '2026-01-01T00:00:00.000Z';
    global.localStorage.setItem('vivapilot.stats', JSON.stringify(stats));

    storeModule.recordAnswer('strings', 3);
    const stats2 = storeModule.getStats();
    stats2.topics['strings'].lastSeen = '2026-01-02T00:00:00.000Z';
    global.localStorage.setItem('vivapilot.stats', JSON.stringify(stats2));

    storeModule.recordAnswer('exceptions', 1); // lower avg = 1

    const weak = storeModule.getWeakTopics();
    // exceptions (avg 1), then arrays (avg 3, older date), then strings (avg 3, newer date)
    assert.deepStrictEqual(weak, ['exceptions', 'arrays', 'strings']);
  });

  test('last-5 limit: only keeps the last 5 scores', () => {
    const scores = [2, 3, 4, 5, 6, 10]; // 6 scores
    for (const s of scores) {
      storeModule.recordAnswer('generics', s);
    }
    const stats = storeModule.getStats();
    assert.strictEqual(stats.topics['generics'].attempts, 6);
    // Last 5 scores should be [3, 4, 5, 6, 10]
    assert.deepStrictEqual(stats.topics['generics'].recent, [3, 4, 5, 6, 10]);
  });

  test('reset: clears all stored stats', () => {
    storeModule.recordAnswer('polymorphism', 4);
    assert.strictEqual(storeModule.getWeakTopics().length, 1);
    storeModule.reset();
    const stats = storeModule.getStats();
    assert.deepStrictEqual(stats.topics, {});
  });

  test('corrupt data: handles corrupt JSON gracefully', () => {
    global.localStorage.setItem('vivapilot.stats', 'NOT_VALID_JSON{:::');
    const stats = storeModule.getStats();
    assert.strictEqual(stats.version, 1);
    assert.deepStrictEqual(stats.topics, {});
    // recordAnswer should still work on corrupt data
    storeModule.recordAnswer('multithreading', 7);
    const statsAfter = storeModule.getStats();
    assert.deepStrictEqual(statsAfter.topics['multithreading'].recent, [7]);
  });

  test('drill topics fallback: no weak topics picks lowest-avg, no data picks from list', () => {
    // 1. No data at all -> random from list
    const drillNoData = storeModule.getDrillTopics();
    assert.strictEqual(drillNoData.length, 1);
    assert.ok(storeModule.TOPIC_LIST.includes(drillNoData[0]));

    // 2. All topics >= 6 (no weak topics) -> picks lowest-average topic
    storeModule.recordAnswer('inheritance', 8);
    storeModule.recordAnswer('collections', 7);
    const drillGood = storeModule.getDrillTopics();
    assert.deepStrictEqual(drillGood, ['collections']);
  });
});
