// The whole simulation as one plain object, plus pure transitions. Every
// function returns a new world; the input is never mutated.

import { G_BASE, SOFTENING, DT, RESTITUTION, DROP_DISTANCE, MAX_BODIES } from '../config.js';
import { accelerations } from '../physics/gravity.js';
import { leapfrogStep } from '../physics/integrate.js';
import { resolveCollisions } from '../physics/collide.js';
import { radiusOf, createBody, centerOfMass } from './bodies.js';
import { buildPreset, presetById } from './presets.js';

/**
 * @param {{presetId: string, rng: () => number, gravity?: number, starMass?: number, collisions?: 'merge' | 'bounce'}} opts
 * @returns {object} world; `epoch` (UTC ms or null) makes the clock a calendar date
 */
export function createWorld({ presetId, rng, gravity = 1, starMass = 1, collisions = 'merge' }) {
  const bodies = buildPreset(presetId, rng);
  const { epoch } = presetById(presetId);
  const world = { presetId, epoch, bodies, nextId: bodies.length + 1, gravity, starMass: 1, collisions, time: 0 };
  return setStarMass(world, starMass);
}

/**
 * Gravitational constant in effect.
 * @param {object} world
 * @returns {number}
 */
export function gravityOf(world) {
  return G_BASE * world.gravity;
}

/**
 * Run `steps` fixed physics steps.
 * @param {object} world
 * @param {number} steps
 * @returns {{world: object, merges: Array<{from: number, into: number, x: number, y: number}>}}
 */
export function advance(world, steps) {
  if (steps <= 0 || world.bodies.length === 0) return { world, merges: [] };
  const G = gravityOf(world);
  const opts = { restitution: RESTITUTION, radiusOf };
  let bodies = world.bodies.map((b) => ({ ...b }));
  let acc = accelerations(bodies, G, SOFTENING);
  const merges = [];
  for (let s = 0; s < steps; s++) {
    acc = leapfrogStep(bodies, acc, G, SOFTENING, DT);
    const hit = resolveCollisions(bodies, world.collisions, opts);
    if (hit.changed) {
      bodies = hit.bodies;
      merges.push(...hit.merges);
      acc = accelerations(bodies, G, SOFTENING);
    }
  }
  const center = centerOfMass(bodies);
  const kept = bodies.filter((b) => Math.hypot(b.x - center.x, b.y - center.y) < DROP_DISTANCE);
  return { world: { ...world, bodies: kept, time: world.time + steps * DT }, merges };
}

/**
 * Add a launched body (ignored once the body cap is reached).
 * @param {object} world
 * @param {{x: number, y: number, vx: number, vy: number, mass: number, color: number}} props
 * @returns {object} world
 */
export function launch(world, props) {
  if (world.bodies.length >= MAX_BODIES) return world;
  const body = createBody({ ...props, id: world.nextId });
  return { ...world, bodies: [...world.bodies, body], nextId: world.nextId + 1 };
}

/**
 * @param {object} world
 * @param {number} id
 * @returns {object} world
 */
export function removeBody(world, id) {
  return { ...world, bodies: world.bodies.filter((b) => b.id !== id) };
}

/**
 * @param {object} world
 * @param {number} gravity multiplier on G_BASE
 * @returns {object} world
 */
export function setGravity(world, gravity) {
  return { ...world, gravity };
}

/**
 * Rescale every star's mass. Velocities stay as they are, so orbits react.
 * @param {object} world
 * @param {number} starMass multiplier on the preset masses
 * @returns {object} world
 */
export function setStarMass(world, starMass) {
  const ratio = starMass / world.starMass;
  const bodies = world.bodies.map((b) => {
    if (!b.star) return b;
    const mass = b.mass * ratio;
    return { ...b, mass, radius: radiusOf(mass) };
  });
  return { ...world, bodies, starMass };
}

/**
 * @param {object} world
 * @param {'merge' | 'bounce'} collisions
 * @returns {object} world
 */
export function setCollisions(world, collisions) {
  return { ...world, collisions };
}

/**
 * Fixed-timestep accumulator: how many whole steps a frame owes, and what is
 * carried over. Real time is clamped so a long-hidden tab doesn't explode.
 * @param {number} carry leftover sim time from the last frame
 * @param {number} realSeconds time since the last frame
 * @param {{rate: number, speed: number, dt: number, maxFrame: number, maxSteps: number}} opts
 * @returns {{steps: number, carry: number}}
 */
export function stepsFor(carry, realSeconds, { rate, speed, dt, maxFrame, maxSteps }) {
  const total = carry + Math.min(Math.max(realSeconds, 0), maxFrame) * rate * speed;
  const steps = Math.min(Math.floor(total / dt), maxSteps);
  return { steps, carry: steps === maxSteps ? 0 : total - steps * dt };
}

/**
 * Launch velocity for a drag from `start` to `end` (sim units), capped.
 * @param {[number, number]} start
 * @param {[number, number]} end
 * @param {{speedPerUnit: number, maxSpeed: number}} opts
 * @returns {[number, number]}
 */
export function aimVelocity([x0, y0], [x1, y1], { speedPerUnit, maxSpeed }) {
  let vx = (x1 - x0) * speedPerUnit;
  let vy = (y1 - y0) * speedPerUnit;
  const speed = Math.hypot(vx, vy);
  if (speed > maxSpeed) {
    vx *= maxSpeed / speed;
    vy *= maxSpeed / speed;
  }
  return [vx, vy];
}

/**
 * Find a body by id.
 * @param {object} world
 * @param {number | null} id
 * @returns {object | null}
 */
export function bodyById(world, id) {
  return id == null ? null : (world.bodies.find((b) => b.id === id) ?? null);
}
