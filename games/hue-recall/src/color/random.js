// Random target colors, driven by an injectable RNG for reproducibility.

/**
 * Seeded PRNG (mulberry32). Returns a function yielding floats in [0, 1).
 * @param {number} seed 32-bit integer seed
 * @returns {() => number}
 */
export function createRng(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Random integer in an inclusive range.
 * @param {() => number} rng
 * @param {[number, number]} range [min, max]
 * @returns {number}
 */
export function randomInt(rng, [min, max]) {
  return min + Math.floor(rng() * (max - min + 1));
}

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
