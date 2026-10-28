// Path preview for a body being aimed. Everything else is frozen in place,
// which is cheap and close enough for a few seconds ahead.

import { accelerationAt } from './gravity.js';

/**
 * @param {Array<{x: number, y: number, mass: number, radius: number}>} bodies frozen attractors
 * @param {{x: number, y: number, vx: number, vy: number, radius: number}} probe
 * @param {{G: number, eps: number, dt: number, steps: number}} opts
 * @returns {{points: Float32Array, count: number, hitId: number | null}}
 *   points holds x,y pairs; count is how many pairs are filled
 */
export function predictPath(bodies, probe, { G, eps, dt, steps }) {
  const points = new Float32Array((steps + 1) * 2);
  let { x, y, vx, vy } = probe;
  points[0] = x;
  points[1] = y;
  let [ax, ay] = accelerationAt(x, y, bodies, G, eps);
  const half = dt / 2;
  for (let s = 1; s <= steps; s++) {
    vx += ax * half;
    vy += ay * half;
    x += vx * dt;
    y += vy * dt;
    [ax, ay] = accelerationAt(x, y, bodies, G, eps);
    vx += ax * half;
    vy += ay * half;
    points[s * 2] = x;
    points[s * 2 + 1] = y;
    const hit = bodies.find((b) => (b.x - x) ** 2 + (b.y - y) ** 2 < (b.radius + probe.radius) ** 2);
    if (hit) return { points, count: s + 1, hitId: hit.id };
  }
  return { points, count: steps + 1, hitId: null };
}
