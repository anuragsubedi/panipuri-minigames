import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roundScore, totalScore } from '../../shared/js/score.js';

const CURVE = { max: 10, scale: 22, shape: 1.6 };

test('roundScore: perfect match earns max', () => {
  assert.equal(roundScore(0, CURVE), 10);
});

test('roundScore: decreases monotonically with deltaE', () => {
  let prev = Infinity;
  for (let dE = 0; dE <= 100; dE += 1) {
    const s = roundScore(dE, CURVE);
    assert.ok(s <= prev, `score rose at ΔE ${dE}`);
    prev = s;
  }
});

test('roundScore: stays within [0, max] and near 0 for large errors', () => {
  assert.ok(roundScore(100, CURVE) >= 0);
  assert.ok(roundScore(100, CURVE) < 0.01);
  assert.equal(roundScore(-5, CURVE), 10);
});

test('totalScore: sums and ignores unscored rounds', () => {
  assert.equal(totalScore([1, 2.5, null, 3]), 6.5);
  assert.equal(totalScore([]), 0);
});
