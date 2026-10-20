// test/validate.test.js
// Node built‑in test runner (node --test)
const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// Helper to replace the llm module's callModel implementation for each test
function mockCallModel(impl) {
  // Clear require cache for llm
  delete require.cache[require.resolve('../src/llm')];
  // Mock module
  const mock = { callModel: impl };
  require.cache[require.resolve('../src/llm')] = {
    id: require.resolve('../src/llm'),
    filename: require.resolve('../src/llm'),
    loaded: true,
    exports: mock,
  };
}

const { getValidJson } = require('../src/validate');

describe('getValidJson', () => {
  beforeEach(() => {
    // Ensure env is set
    process.env.AI_API_KEY = 'test';
    process.env.AI_MODEL = 'test-model';
  });

  test('returns parsed object for clean JSON', async () => {
    mockCallModel(async () => '{"ok":true}');
    const result = await getValidJson({
      system: 'system',
      user: 'prompt',
      check: (obj) => {
        assert.ok(obj.ok, 'ok flag missing');
      },
    });
    assert.deepStrictEqual(result, { ok: true });
  });

  test('strips markdown code fences', async () => {
    mockCallModel(async () => '```json\n{\"ok\":false}\n```');
    const result = await getValidJson({
      system: 'system',
      user: 'prompt',
      check: () => {},
    });
    assert.deepStrictEqual(result, { ok: false });
  });

  test('retries once on invalid JSON then succeeds', async () => {
    let callCount = 0;
    mockCallModel(async () => {
      callCount++;
      return callCount === 1 ? 'not json' : '{"good":123}';
    });
    const result = await getValidJson({
      system: 'system',
      user: 'prompt',
      check: (obj) => {
        assert.strictEqual(obj.good, 123);
      },
    });
    assert.deepStrictEqual(result, { good: 123 });
    assert.strictEqual(callCount, 2);
  });

  test('fails after two bad attempts', async () => {
    let attempts = 0;
    mockCallModel(async () => {
      attempts++;
      return 'invalid';
    });
    try {
      await getValidJson({
        system: 'system',
        user: 'prompt',
        check: () => {},
      });
      assert.fail('Expected error not thrown');
    } catch (err) {
      assert.strictEqual(err.status, 502);
    }
    assert.strictEqual(attempts, 2);
  });
});
