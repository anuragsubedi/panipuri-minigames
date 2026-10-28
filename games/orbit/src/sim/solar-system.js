// The Sun and eight planets on 1 Jan 2000, flattened to 2D. Orbital elements
// are the public approximate J2000 values (semi-major axis, eccentricity,
// mean longitude, longitude of perihelion); inclinations are ignored and the
// Moon is left out (it sits inside the softening length).

import { createBody } from './bodies.js';
import { fromAu, fromSuns } from './units.js';

/** Epoch of the elements, as a UTC timestamp. */
export const SOLAR_EPOCH = Date.UTC(2000, 0, 1, 12);

/** a in AU, mass in solar masses, angles in degrees; color is a palette slot. */
export const PLANETS = [
  { name: 'Mercury', a: 0.38709927, e: 0.20563593, L: 252.2503235, peri: 77.45779628, mass: 1.6601e-7, color: 6 },
  { name: 'Venus', a: 0.72333566, e: 0.00677672, L: 181.9790995, peri: 131.60246718, mass: 2.4478e-6, color: 7 },
  { name: 'Earth', a: 1.00000261, e: 0.01671123, L: 100.46457166, peri: 102.93768193, mass: 3.0404e-6, color: 0 },
  { name: 'Mars', a: 1.52371034, e: 0.0933941, L: -4.55343205, peri: -23.94362959, mass: 3.2272e-7, color: 3 },
  { name: 'Jupiter', a: 5.202887, e: 0.04838624, L: 34.39644051, peri: 14.72847983, mass: 9.5479e-4, color: 1 },
  { name: 'Saturn', a: 9.53667594, e: 0.05386179, L: 49.95424423, peri: 92.59887831, mass: 2.8589e-4, color: 7 },
  { name: 'Uranus', a: 19.18916464, e: 0.04725744, L: 313.23810451, peri: 170.9542763, mass: 4.3662e-5, color: 5 },
  { name: 'Neptune', a: 30.06992276, e: 0.00859048, L: -55.12002969, peri: 44.96476227, mass: 5.1514e-5, color: 4 },
];

/** Real sidereal periods in days, for tests and the "how it works" page. */
export const REAL_PERIODS = {
  Mercury: 87.969,
  Venus: 224.701,
  Earth: 365.256,
  Mars: 686.98,
  Jupiter: 4332.59,
  Saturn: 10759.22,
  Uranus: 30688.5,
  Neptune: 60195,
};

const RAD = Math.PI / 180;

/**
 * Position and velocity of a body on a Kepler orbit around mass `M` at the origin.
 * @param {{a: number, e: number, L: number, peri: number}} el a in sim units, angles in degrees
 * @param {number} GM
 * @returns {{x: number, y: number, vx: number, vy: number}}
 */
export function stateFromElements({ a, e, L, peri }, GM) {
  const M = (L - peri) * RAD;
  let E = M;
  for (let i = 0; i < 20; i++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const b = a * Math.sqrt(1 - e * e);
  // Perifocal frame, then rotate by the longitude of perihelion.
  const px = a * (Math.cos(E) - e);
  const py = b * Math.sin(E);
  const k = Math.sqrt(GM / a ** 3) * a / (1 - e * Math.cos(E));
  const qx = -k * Math.sin(E);
  const qy = k * Math.sqrt(1 - e * e) * Math.cos(E);
  const c = Math.cos(peri * RAD);
  const s = Math.sin(peri * RAD);
  return { x: px * c - py * s, y: px * s + py * c, vx: qx * c - qy * s, vy: qx * s + qy * c };
}

/**
 * @param {number} G
 * @param {number} sunMass sim units
 * @returns {object[]} bodies, Sun first (ids 1..9)
 */
export function solarSystem(G, sunMass) {
  return [
    createBody({ id: 1, x: 0, y: 0, mass: sunMass, star: true, name: 'Sun' }),
    ...PLANETS.map((p, i) =>
      createBody({
        id: i + 2,
        name: p.name,
        color: p.color,
        mass: fromSuns(p.mass),
        ...stateFromElements({ ...p, a: fromAu(p.a) }, G * (sunMass + fromSuns(p.mass))),
      }),
    ),
  ];
}
