// How many dots each round shows.

import { randomInt } from '../../../../shared/js/rng.js';

/**
 * One random count per band, in shuffled order.
 * @param {() => number} rng
 * @param {Array<[number, number]>} bands inclusive [min, max] ranges
 * @returns {number[]}
 */
export function roundCounts(rng, bands) {
  return shuffle(
    rng,
    bands.map((band) => randomInt(rng, band)),
  );
}

// Fisher–Yates on a copy.
function shuffle(rng, items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
