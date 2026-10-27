import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SCORE_CURVE } from '../../games/glimpse/src/config.js';
import { ratioError, percentOff } from '../../games/glimpse/src/scoring/error.js';
import { roundScore } from '../../shared/js/score.js';

const close = (actual, expected, tol) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} not within ${tol} of ${expected}`);

test('ratioError: exact guess is 0', () => {
  assert.equal(ratioError(42, 42), 0);
});

test('ratioError: scale-free (11 for 10 equals 110 for 100)', () => {
  close(ratioError(11, 10), ratioError(110, 100), 1e-12);
});

test('ratioError: symmetric in ratio (half equals double)', () => {
  close(ratioError(50, 100), ratioError(200, 100), 1e-12);
});

test('percentOff: signed', () => {
  assert.equal(percentOff(125, 100), 25);
  assert.equal(percentOff(75, 100), -25);
});

test('score curve: documented feel holds', () => {
  const at = (guess, actual) => roundScore(ratioError(guess, actual), SCORE_CURVE);
  assert.equal(at(100, 100), 10);
  close(at(110, 100), 9.5, 0.1);
  close(at(125, 100), 7.5, 0.25);
  close(at(150, 100), 4, 0.25);
  assert.ok(at(200, 100) < 1);
});
