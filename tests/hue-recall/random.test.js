import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/js/rng.js';
import { randomHsb } from '../../games/hue-recall/src/color/random.js';

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
