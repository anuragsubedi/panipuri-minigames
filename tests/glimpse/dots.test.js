import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/js/rng.js';
import { COUNT_BANDS, DOT_LAYOUT, ROUNDS } from '../../games/glimpse/src/config.js';
import { roundCounts } from '../../games/glimpse/src/dots/counts.js';
import { layoutDots } from '../../games/glimpse/src/dots/layout.js';

test('config: one count band per round', () => {
  assert.equal(COUNT_BANDS.length, ROUNDS);
});

test('roundCounts: one count from each band, order shuffled', () => {
  const counts = roundCounts(createRng(3), COUNT_BANDS);
  assert.equal(counts.length, COUNT_BANDS.length);
  const sorted = [...counts].sort((a, b) => a - b);
  sorted.forEach((count, i) => {
    const [min, max] = COUNT_BANDS[i];
    assert.ok(Number.isInteger(count) && count >= min && count <= max, `${count} not in band ${i}`);
  });
});

test('roundCounts: order varies between games', () => {
  const orders = new Set();
  for (let seed = 1; seed <= 20; seed++) {
    const counts = roundCounts(createRng(seed), COUNT_BANDS);
    orders.add(counts.map((c) => COUNT_BANDS.findIndex(([min, max]) => c >= min && c <= max)).join(''));
  }
  assert.ok(orders.size > 1);
});

test('layoutDots: exact count, inside bounds, never closer than minDistance', () => {
  const { radius, minDistance } = DOT_LAYOUT;
  const dots = layoutDots(createRng(11), 150, DOT_LAYOUT);
  assert.equal(dots.length, 150);
  for (const { x, y } of dots) {
    assert.ok(x >= radius && x <= 1 - radius && y >= radius && y <= 1 - radius);
  }
  for (let i = 0; i < dots.length; i++) {
    for (let j = i + 1; j < dots.length; j++) {
      const d = Math.hypot(dots[i].x - dots[j].x, dots[i].y - dots[j].y);
      assert.ok(d >= minDistance - 1e-12, `dots ${i} and ${j} are ${d} apart`);
    }
  }
});

test('layoutDots: max band count fits for many seeds', () => {
  const max = Math.max(...COUNT_BANDS.map(([, hi]) => hi));
  for (let seed = 1; seed <= 50; seed++) {
    assert.equal(layoutDots(createRng(seed), max, DOT_LAYOUT).length, max);
  }
});

test('layoutDots: deterministic for a seed', () => {
  assert.deepEqual(layoutDots(createRng(5), 40, DOT_LAYOUT), layoutDots(createRng(5), 40, DOT_LAYOUT));
});

test('layoutDots: throws when the layout is impossible', () => {
  assert.throws(() => layoutDots(createRng(1), 500, { radius: 0.05, minDistance: 0.2, maxAttempts: 2000 }));
});
