// Pairwise Newtonian gravity with Plummer softening. O(n²); fine for ≤ 50 bodies.

/**
 * Acceleration of every body from every other body.
 * @param {Array<{x: number, y: number, mass: number}>} bodies
 * @param {number} G
 * @param {number} eps softening length
 * @returns {{ax: Float64Array, ay: Float64Array}}
 */
export function accelerations(bodies, G, eps) {
  const n = bodies.length;
  const ax = new Float64Array(n);
  const ay = new Float64Array(n);
  const eps2 = eps * eps;
  for (let i = 0; i < n; i++) {
    const a = bodies[i];
    for (let j = i + 1; j < n; j++) {
      const b = bodies[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const d2 = dx * dx + dy * dy + eps2;
      const inv = G / (d2 * Math.sqrt(d2));
      ax[i] += dx * inv * b.mass;
      ay[i] += dy * inv * b.mass;
      ax[j] -= dx * inv * a.mass;
      ay[j] -= dy * inv * a.mass;
    }
  }
  return { ax, ay };
}

/**
 * Acceleration at a point from a set of bodies (used by the path preview).
 * @param {number} x
 * @param {number} y
 * @param {Array<{x: number, y: number, mass: number}>} bodies
 * @param {number} G
 * @param {number} eps
 * @returns {[number, number]}
 */
export function accelerationAt(x, y, bodies, G, eps) {
  let ax = 0;
  let ay = 0;
  const eps2 = eps * eps;
  for (const b of bodies) {
    const dx = b.x - x;
    const dy = b.y - y;
    const d2 = dx * dx + dy * dy + eps2;
    const inv = (G * b.mass) / (d2 * Math.sqrt(d2));
    ax += dx * inv;
    ay += dy * inv;
  }
  return [ax, ay];
}

/**
 * Total kinetic + (softened) potential energy.
 * @param {Array<{x: number, y: number, vx: number, vy: number, mass: number}>} bodies
 * @param {number} G
 * @param {number} eps
 * @returns {number}
 */
export function totalEnergy(bodies, G, eps) {
  let kinetic = 0;
  let potential = 0;
  for (let i = 0; i < bodies.length; i++) {
    const a = bodies[i];
    kinetic += 0.5 * a.mass * (a.vx * a.vx + a.vy * a.vy);
    for (let j = i + 1; j < bodies.length; j++) {
      const b = bodies[j];
      potential -= (G * a.mass * b.mass) / Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2 + eps * eps);
    }
  }
  return kinetic + potential;
}

/**
 * Total linear momentum.
 * @param {Array<{vx: number, vy: number, mass: number}>} bodies
 * @returns {[number, number]}
 */
export function totalMomentum(bodies) {
  let px = 0;
  let py = 0;
  for (const b of bodies) {
    px += b.mass * b.vx;
    py += b.mass * b.vy;
  }
  return [px, py];
}
