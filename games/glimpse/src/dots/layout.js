// Places non-overlapping dots in a unit square.

/**
 * Random dot centers in [radius, 1 - radius]², each at least minDistance from
 * every other (rejection sampling). Throws if the cloud can't be placed within
 * maxAttempts, which means the layout settings are too tight for the count.
 * @param {() => number} rng
 * @param {number} count
 * @param {{radius: number, minDistance: number, maxAttempts: number}} layout
 * @returns {Array<{x: number, y: number}>}
 */
export function layoutDots(rng, count, { radius, minDistance, maxAttempts }) {
  const span = 1 - 2 * radius;
  const minDistanceSq = minDistance ** 2;
  const dots = [];

  for (let attempt = 0; dots.length < count; attempt++) {
    if (attempt >= maxAttempts) {
      throw new Error(`Could not place ${count} dots (placed ${dots.length} in ${maxAttempts} attempts)`);
    }
    const x = radius + rng() * span;
    const y = radius + rng() * span;
    if (dots.every((d) => (d.x - x) ** 2 + (d.y - y) ** 2 >= minDistanceSq)) {
      dots.push({ x, y });
    }
  }

  return dots;
}
