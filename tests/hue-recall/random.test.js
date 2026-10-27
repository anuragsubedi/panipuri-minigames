import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng, randomInt, randomHsb } from '../../games/hue-recall/src/color/random.js';

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

test('randomHsb: integer channels within ranges', () => {
  const rng = createRng(99);
  const ranges = { h: [0, 359], s: [25, 100], b: [25, 100] };
  for (let i = 0; i < 500; i++) {
    const { h, s, b } = randomHsb(rng, ranges);
    for (const [v, [min, max]] of [[h, ranges.h], [s, ranges.s], [b, ranges.b]]) {
      assert.ok(Number.isInteger(v) && v >= min && v <= max);
    }
  }
});
