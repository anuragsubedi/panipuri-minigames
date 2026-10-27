import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hsbToRgb, rgbToHex, rgbToLab, hsbToHex } from '../../games/hue-recall/src/color/convert.js';

const close = (actual, expected, tol = 0.01) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${actual} not within ${tol} of ${expected}`);

test('hsbToRgb: primaries and greys', () => {
  assert.deepEqual(hsbToRgb({ h: 0, s: 100, b: 100 }), { r: 255, g: 0, b: 0 });
  assert.deepEqual(hsbToRgb({ h: 120, s: 100, b: 100 }), { r: 0, g: 255, b: 0 });
  assert.deepEqual(hsbToRgb({ h: 240, s: 100, b: 100 }), { r: 0, g: 0, b: 255 });
  assert.deepEqual(hsbToRgb({ h: 200, s: 0, b: 100 }), { r: 255, g: 255, b: 255 });
  assert.deepEqual(hsbToRgb({ h: 200, s: 50, b: 0 }), { r: 0, g: 0, b: 0 });
});

test('hsbToRgb: hue 360 wraps to red', () => {
  assert.deepEqual(hsbToRgb({ h: 360, s: 100, b: 100 }), { r: 255, g: 0, b: 0 });
});

test('rgbToHex: pads, rounds and clamps', () => {
  assert.equal(rgbToHex({ r: 255, g: 0, b: 15 }), '#ff000f');
  assert.equal(rgbToHex({ r: 127.6, g: 0.4, b: 300 }), '#8000ff');
});

test('hsbToHex: convenience composes correctly', () => {
  assert.equal(hsbToHex({ h: 60, s: 100, b: 100 }), '#ffff00');
});

test('rgbToLab: reference values (D65)', () => {
  const white = rgbToLab({ r: 255, g: 255, b: 255 });
  close(white.L, 100);
  close(white.a, 0);
  close(white.b, 0);

  const black = rgbToLab({ r: 0, g: 0, b: 0 });
  close(black.L, 0);

  const red = rgbToLab({ r: 255, g: 0, b: 0 });
  close(red.L, 53.24, 0.05);
  close(red.a, 80.09, 0.05);
  close(red.b, 67.2, 0.05);
});
