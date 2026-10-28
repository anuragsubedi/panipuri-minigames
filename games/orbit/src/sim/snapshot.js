// Saved systems: a world turned into plain JSON and back. Restoring checks
// every field, so a corrupt or hand-edited save can't break the sim.

import { MAX_BODIES, PALETTE_SIZE } from '../config.js';
import { radiusOf } from './bodies.js';

const VERSION = 1;
const num = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * @param {object} world
 * @param {{name: string, view: number, savedAt: number}} meta
 * @returns {object} JSON-safe snapshot
 */
export function toSnapshot(world, { name, view, savedAt }) {
  return {
    v: VERSION,
    name,
    savedAt,
    view,
    presetId: world.presetId,
    epoch: world.epoch,
    time: world.time,
    gravity: world.gravity,
    starMass: world.starMass,
    collisions: world.collisions,
    nextId: world.nextId,
    bodies: world.bodies.map(({ id, x, y, vx, vy, mass, color, star, name: bodyName }) => ({
      id,
      x,
      y,
      vx,
      vy,
      mass,
      color,
      star,
      name: bodyName ?? null,
    })),
  };
}

/**
 * @param {unknown} snap
 * @returns {{world: object, name: string, view: number} | null} null if invalid
 */
export function fromSnapshot(snap) {
  if (!snap || typeof snap !== 'object' || snap.v !== VERSION || !Array.isArray(snap.bodies)) return null;
  if (snap.bodies.length > MAX_BODIES) return null;
  const bodies = [];
  for (const b of snap.bodies) {
    if (!b || ![b.id, b.x, b.y, b.vx, b.vy, b.mass].every(num) || b.mass <= 0) return null;
    bodies.push({
      id: b.id,
      x: b.x,
      y: b.y,
      vx: b.vx,
      vy: b.vy,
      mass: b.mass,
      radius: radiusOf(b.mass),
      color: Number.isInteger(b.color) ? Math.abs(b.color) % PALETTE_SIZE : 0,
      star: b.star === true,
      name: typeof b.name === 'string' ? b.name.slice(0, 40) : null,
    });
  }
  const maxId = bodies.reduce((m, b) => Math.max(m, b.id), 0);
  const positive = (v, fallback) => (num(v) && v > 0 ? v : fallback);
  return {
    name: typeof snap.name === 'string' ? snap.name.slice(0, 40) : 'Saved system',
    view: positive(snap.view, null),
    world: {
      presetId: typeof snap.presetId === 'string' ? snap.presetId : null,
      epoch: num(snap.epoch) ? snap.epoch : null,
      bodies,
      nextId: Math.max(maxId + 1, num(snap.nextId) ? snap.nextId : 0),
      gravity: positive(snap.gravity, 1),
      starMass: positive(snap.starMass, 1),
      collisions: snap.collisions === 'bounce' ? 'bounce' : 'merge',
      time: num(snap.time) && snap.time >= 0 ? snap.time : 0,
    },
  };
}
