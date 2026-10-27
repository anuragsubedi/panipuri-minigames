// Body shape and small helpers. A body is a plain object:
// {id, x, y, vx, vy, mass, radius, color, star} — `color` is a palette slot, so
// the theme decides the actual colour; `star` marks bodies the Sun-mass slider
// scales and the renderer makes glow.

import { RADIUS, KINDS } from '../config.js';

/**
 * Collision/draw radius for a mass.
 * @param {number} mass
 * @returns {number}
 */
export function radiusOf(mass) {
  return RADIUS.base + RADIUS.perCubeRoot * Math.cbrt(mass);
}

const STAR = { kind: 'star', label: 'Star' };

/**
 * Kind (star / moon / planet / giant) of a body.
 * @param {{mass: number, star: boolean}} body
 * @returns {{kind: string, label: string}}
 */
export function kindOf(body) {
  return body.star ? STAR : KINDS.find((k) => body.mass < k.below);
}

/**
 * @param {{id: number, x: number, y: number, vx?: number, vy?: number, mass: number, color?: number, star?: boolean}} props
 * @returns {object} body
 */
export function createBody({ id, x, y, vx = 0, vy = 0, mass, color = 0, star = false }) {
  return { id, x, y, vx, vy, mass, radius: radiusOf(mass), color, star };
}

/**
 * Speed needed for a circular orbit at distance r around mass M.
 * @param {number} G
 * @param {number} M
 * @param {number} r
 * @returns {number}
 */
export function circularSpeed(G, M, r) {
  return Math.sqrt((G * M) / r);
}

/**
 * Mass-weighted center and velocity of a set of bodies.
 * @param {object[]} bodies
 * @returns {{x: number, y: number, vx: number, vy: number, mass: number}}
 */
export function centerOfMass(bodies) {
  let mass = 0;
  let x = 0;
  let y = 0;
  let vx = 0;
  let vy = 0;
  for (const b of bodies) {
    mass += b.mass;
    x += b.x * b.mass;
    y += b.y * b.mass;
    vx += b.vx * b.mass;
    vy += b.vy * b.mass;
  }
  if (mass === 0) return { x: 0, y: 0, vx: 0, vy: 0, mass: 0 };
  return { x: x / mass, y: y / mass, vx: vx / mass, vy: vy / mass, mass };
}

/**
 * Shift bodies so the center of mass sits still at the origin.
 * @param {object[]} bodies
 * @returns {object[]} new bodies
 */
export function recenter(bodies) {
  const c = centerOfMass(bodies);
  return bodies.map((b) => ({ ...b, x: b.x - c.x, y: b.y - c.y, vx: b.vx - c.vx, vy: b.vy - c.vy }));
}
