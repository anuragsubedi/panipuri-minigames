// Starting systems. Each build returns bodies with ids 1..n, recentred so the
// system's center of mass sits still at the origin.

import { G_BASE, SUN_MASS, PALETTE_SIZE } from '../config.js';
import { createBody, circularSpeed, recenter } from './bodies.js';

const TAU = Math.PI * 2;

// Body on a circular, counter-clockwise orbit around a point mass at the origin.
function orbiter(id, M, r, angle, mass, color) {
  const v = circularSpeed(G_BASE, M, r);
  return createBody({
    id,
    mass,
    color,
    x: r * Math.cos(angle),
    y: r * Math.sin(angle),
    vx: -v * Math.sin(angle),
    vy: v * Math.cos(angle),
  });
}

function innerPlanets() {
  const planets = [
    { r: 52, mass: 0.6, angle: 0.4 },
    { r: 82, mass: 2.4, angle: 2.6 },
    { r: 118, mass: 3, angle: 4.4 },
    { r: 160, mass: 1.2, angle: 1.2 },
    { r: 222, mass: 14, angle: 5.5 },
  ];
  return [
    createBody({ id: 1, x: 0, y: 0, mass: SUN_MASS, star: true }),
    ...planets.map((p, i) => orbiter(i + 2, SUN_MASS, p.r, p.angle, p.mass, i % PALETTE_SIZE)),
  ];
}

function binaryStar() {
  const m = SUN_MASS / 2;
  const d = 60;
  // Equal masses circling their midpoint: each needs v = √(G·m / 2d).
  const v = Math.sqrt((G_BASE * m) / (2 * d));
  const stars = [
    createBody({ id: 1, x: -d / 2, y: 0, vx: 0, vy: -v, mass: m, star: true }),
    createBody({ id: 2, x: d / 2, y: 0, vx: 0, vy: v, mass: m, color: 1, star: true }),
  ];
  const planets = [
    { r: 150, mass: 2, angle: 0.8 },
    { r: 192, mass: 1, angle: 3.3 },
    { r: 236, mass: 6, angle: 5 },
  ];
  return [...stars, ...planets.map((p, i) => orbiter(i + 3, SUN_MASS, p.r, p.angle, p.mass, (i + 2) % PALETTE_SIZE))];
}

function chaos(rng) {
  const bodies = [createBody({ id: 1, x: 0, y: 0, mass: SUN_MASS, star: true })];
  for (let i = 0; i < 16; i++) {
    const mass = 0.4 + rng() ** 2 * 24;
    let body;
    do {
      body = orbiter(i + 2, SUN_MASS, 40 + rng() * 200, rng() * TAU, mass, i % PALETTE_SIZE);
    } while (bodies.some((b) => Math.hypot(b.x - body.x, b.y - body.y) < b.radius + body.radius + 4));
    // Off-circular speeds and tilted headings: crossings, slingshots, mergers.
    const scale = 0.65 + rng() * 0.6;
    const turn = (rng() - 0.5) * 0.9;
    const cos = Math.cos(turn);
    const sin = Math.sin(turn);
    bodies.push({
      ...body,
      vx: (body.vx * cos - body.vy * sin) * scale,
      vy: (body.vx * sin + body.vy * cos) * scale,
    });
  }
  return bodies;
}

/** Presets in the order the deck shows them. */
export const PRESETS = [
  { id: 'inner', label: 'Inner planets', build: innerPlanets },
  { id: 'binary', label: 'Binary star', build: binaryStar },
  { id: 'chaos', label: 'Chaos', build: chaos },
];

/**
 * Build a preset's bodies.
 * @param {string} id preset id
 * @param {() => number} rng used by random presets
 * @returns {object[]} bodies
 */
export function buildPreset(id, rng) {
  const preset = PRESETS.find((p) => p.id === id);
  if (!preset) throw new Error(`Unknown preset: ${id}`);
  return recenter(preset.build(rng));
}
