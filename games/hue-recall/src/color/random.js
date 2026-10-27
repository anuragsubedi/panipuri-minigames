// Random target colors, driven by an injectable RNG for reproducibility.

import { randomInt } from '../../../../shared/js/rng.js';

/**
 * Random HSB color with integer channels inside the given ranges.
 * @param {() => number} rng
 * @param {{h: [number, number], s: [number, number], b: [number, number]}} ranges
 * @returns {{h: number, s: number, b: number}}
 */
export function randomHsb(rng, ranges) {
  return {
    h: randomInt(rng, ranges.h),
    s: randomInt(rng, ranges.s),
    b: randomInt(rng, ranges.b),
  };
}
