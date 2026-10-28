// World ↔ screen mapping. The camera centers on a point and fits
// `viewRadius` sim units into half the canvas's shorter side.

/**
 * @param {{width: number, height: number, cx: number, cy: number, viewRadius: number}} opts
 *   width/height in CSS pixels; cx/cy is the world point at screen center
 * @returns {{scale: number, toScreen: (x: number, y: number) => [number, number], toWorld: (sx: number, sy: number) => [number, number]}}
 */
export function createCamera({ width, height, cx, cy, viewRadius }) {
  const scale = Math.min(width, height) / 2 / viewRadius;
  const ox = width / 2;
  const oy = height / 2;
  return {
    scale,
    // Screen y grows downward; world y grows upward, so orbits read anticlockwise.
    toScreen: (x, y) => [ox + (x - cx) * scale, oy - (y - cy) * scale],
    toWorld: (sx, sy) => [cx + (sx - ox) / scale, cy - (sy - oy) / scale],
  };
}

/**
 * Ease a value toward a target (frame-rate independent).
 * @param {number} from
 * @param {number} to
 * @param {number} seconds frame time
 * @param {number} halfLife seconds to close half the gap
 * @returns {number}
 */
export function approach(from, to, seconds, halfLife) {
  return to + (from - to) * 0.5 ** (seconds / halfLife);
}

/**
 * Body under a screen point, preferring the closest; small bodies get a
 * finger-sized hit area.
 * @param {object[]} bodies
 * @param {[number, number]} world point in sim units
 * @param {number} scale px per sim unit
 * @param {number} minHitPx
 * @returns {object | null}
 */
export function bodyAt(bodies, [x, y], scale, minHitPx) {
  let best = null;
  let bestD = Infinity;
  for (const b of bodies) {
    const d = Math.hypot(b.x - x, b.y - y);
    if (d <= Math.max(b.radius, minHitPx / scale) && d < bestD) {
      best = b;
      bestD = d;
    }
  }
  return best;
}
