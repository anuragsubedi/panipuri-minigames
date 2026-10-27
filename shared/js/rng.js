// Seedable randomness, so games can be replayed (`?seed=`) and tested deterministically.

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
 * Seed from `?seed=<n>` in the page URL, or the current time if absent.
 * @param {string} search location.search
 * @returns {number}
 */
export function seedFromQuery(search) {
  const seed = Number(new URLSearchParams(search).get('seed'));
  return Number.isFinite(seed) && seed !== 0 ? seed : Date.now();
}
