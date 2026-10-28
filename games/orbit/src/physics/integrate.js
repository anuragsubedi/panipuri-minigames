// Leapfrog (kick-drift-kick velocity Verlet). Symplectic, so with a fixed dt
// orbits keep their energy instead of spiralling in or out.

import { accelerations } from './gravity.js';

/**
 * One fixed step. Mutates `bodies` (callers pass their own copies) and
 * returns the accelerations at the new positions, to reuse as the next
 * step's first kick.
 * @param {Array<{x: number, y: number, vx: number, vy: number, mass: number}>} bodies
 * @param {{ax: Float64Array, ay: Float64Array}} acc accelerations at the current positions
 * @param {number} G
 * @param {number} eps
 * @param {number} dt
 * @returns {{ax: Float64Array, ay: Float64Array}}
 */
export function leapfrogStep(bodies, acc, G, eps, dt) {
  const half = dt / 2;
  for (let i = 0; i < bodies.length; i++) {
    const b = bodies[i];
    b.vx += acc.ax[i] * half;
    b.vy += acc.ay[i] * half;
    b.x += b.vx * dt;
    b.y += b.vy * dt;
  }
  const next = accelerations(bodies, G, eps);
  for (let i = 0; i < bodies.length; i++) {
    bodies[i].vx += next.ax[i] * half;
    bodies[i].vy += next.ay[i] * half;
  }
  return next;
}
