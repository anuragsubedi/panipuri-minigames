import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deltaE2000 } from '../../games/hue-recall/src/color/distance.js';

// Selected pairs from Sharma, Wu & Dalal (2005) CIEDE2000 test data.
const SHARMA_PAIRS = [
  [{ L: 50, a: 2.6772, b: -79.7751 }, { L: 50, a: 0, b: -82.7485 }, 2.0425],
  [{ L: 50, a: 0, b: 0 }, { L: 50, a: -1, b: 2 }, 2.3669],
  [{ L: 50, a: 2.5, b: 0 }, { L: 50, a: 3.1736, b: 0.5854 }, 1.0],
  [{ L: 50, a: 2.5, b: 0 }, { L: 73, a: 25, b: -18 }, 27.1492],
  [{ L: 50, a: 2.5, b: 0 }, { L: 61, a: -5, b: 29 }, 22.8977],
  [{ L: 60.2574, a: -34.0099, b: 36.2677 }, { L: 60.4626, a: -34.1751, b: 39.4387 }, 1.2644],
];

test('deltaE2000 matches Sharma reference data', () => {
  for (const [lab1, lab2, expected] of SHARMA_PAIRS) {
    const actual = deltaE2000(lab1, lab2);
    assert.ok(Math.abs(actual - expected) < 1e-4, `ΔE(${JSON.stringify(lab1)}, ${JSON.stringify(lab2)}) = ${actual}, expected ${expected}`);
  }
});

test('deltaE2000 is symmetric', () => {
  for (const [lab1, lab2] of SHARMA_PAIRS) {
    assert.ok(Math.abs(deltaE2000(lab1, lab2) - deltaE2000(lab2, lab1)) < 1e-9);
  }
});

test('deltaE2000 of identical colors is 0', () => {
  assert.equal(deltaE2000({ L: 40, a: 20, b: -10 }, { L: 40, a: 20, b: -10 }), 0);
});
