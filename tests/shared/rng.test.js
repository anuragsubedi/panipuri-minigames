import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randomInt, seedFromQuery } from '../../shared/js/rng.js';

test('createRng: same seed gives same sequence', () => {
  const a = createRng(42);
  const b = createRng(42);
  for (let i = 0; i < 10; i++) assert.equal(a(), b());
});

test('createRng: values stay in [0, 1)', () => {
  const rng = createRng(7);
  for (let i = 0; i < 1000; i++) {
    const v = rng();
    assert.ok(v >= 0 && v < 1);
  }
});

test('randomInt: inclusive bounds are both reachable', () => {
  const rng = createRng(1);
  const seen = new Set();
  for (let i = 0; i < 500; i++) seen.add(randomInt(rng, [3, 5]));
  assert.deepEqual([...seen].sort(), [3, 4, 5]);
});

test('seedFromQuery: reads ?seed=, falls back to time otherwise', () => {
  assert.equal(seedFromQuery('?seed=42'), 42);
  const before = Date.now();
  assert.ok(seedFromQuery('') >= before);
  assert.ok(seedFromQuery('?seed=abc') >= before);
  assert.ok(seedFromQuery('?seed=0') >= before);
});
