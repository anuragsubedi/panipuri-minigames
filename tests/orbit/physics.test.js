import { test } from 'node:test';
import assert from 'node:assert/strict';
import { G_BASE, SOFTENING, DT } from '../../games/orbit/src/config.js';
import { accelerations, totalEnergy, totalMomentum } from '../../games/orbit/src/physics/gravity.js';
import { leapfrogStep } from '../../games/orbit/src/physics/integrate.js';
import { mergeBodies, bounceBodies, resolveCollisions } from '../../games/orbit/src/physics/collide.js';
import { predictPath } from '../../games/orbit/src/physics/predict.js';
import { createBody, radiusOf, circularSpeed, recenter, centerOfMass } from '../../games/orbit/src/sim/bodies.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

function twoBody() {
  const M = 1000;
  const r = 100;
  const v = circularSpeed(G_BASE, M, r);
  return recenter([
    createBody({ id: 1, x: 0, y: 0, mass: M, star: true }),
    createBody({ id: 2, x: r, y: 0, vy: v, mass: 1 }),
  ]);
}

test('gravity: equal and opposite forces', () => {
  const bodies = [createBody({ id: 1, x: 0, y: 0, mass: 3 }), createBody({ id: 2, x: 10, y: 5, mass: 7 })];
  const { ax, ay } = accelerations(bodies, 1, 0.5);
  close(ax[0] * 3 + ax[1] * 7, 0);
  close(ay[0] * 3 + ay[1] * 7, 0);
  assert.ok(ax[0] > 0 && ax[1] < 0);
});

test('leapfrog: 2-body circular orbit keeps energy within 1% over 20 000 steps', () => {
  const bodies = twoBody().map((b) => ({ ...b }));
  const e0 = totalEnergy(bodies, G_BASE, SOFTENING);
  let acc = accelerations(bodies, G_BASE, SOFTENING);
  let worst = 0;
  for (let s = 0; s < 20_000; s++) {
    acc = leapfrogStep(bodies, acc, G_BASE, SOFTENING, DT);
    if (s % 100 === 0) worst = Math.max(worst, Math.abs((totalEnergy(bodies, G_BASE, SOFTENING) - e0) / e0));
  }
  assert.ok(worst < 0.01, `energy drift ${(worst * 100).toFixed(3)}%`);
  // ~5 orbits later the planet is still ~100 units out.
  const [sun, planet] = bodies;
  close(Math.hypot(planet.x - sun.x, planet.y - sun.y), 100, 2);
});

test('leapfrog: momentum conserved', () => {
  const bodies = twoBody().map((b) => ({ ...b }));
  let acc = accelerations(bodies, G_BASE, SOFTENING);
  for (let s = 0; s < 1000; s++) acc = leapfrogStep(bodies, acc, G_BASE, SOFTENING, DT);
  const [px, py] = totalMomentum(bodies);
  close(px, 0, 1e-9);
  close(py, 0, 1e-9);
});

test('merge: conserves mass and momentum, keeps heavier id, recomputes radius', () => {
  const a = createBody({ id: 1, x: 0, y: 0, vx: 1, vy: -2, mass: 5, color: 3 });
  const b = createBody({ id: 2, x: 3, y: 1, vx: -4, vy: 0.5, mass: 2, star: true });
  const m = mergeBodies(a, b, radiusOf);
  const [px0, py0] = totalMomentum([a, b]);
  const [px1, py1] = totalMomentum([m]);
  close(m.mass, 7);
  close(px1, px0);
  close(py1, py0);
  assert.equal(m.id, 1);
  assert.equal(m.color, 3);
  assert.equal(m.star, true);
  close(m.radius, radiusOf(7));
  const c = centerOfMass([a, b]);
  close(m.x, c.x);
  close(m.y, c.y);
});

test('resolveCollisions: merge chain reports every merge', () => {
  const bodies = [
    createBody({ id: 1, x: 0, y: 0, mass: 10 }),
    createBody({ id: 2, x: 3, y: 0, mass: 1 }),
    createBody({ id: 3, x: 50, y: 0, mass: 1 }),
  ];
  const out = resolveCollisions(bodies, 'merge', { restitution: 0.8, radiusOf });
  assert.equal(out.bodies.length, 2);
  assert.deepEqual(out.merges.map((m) => [m.from, m.into]), [[2, 1]]);
  assert.equal(bodies.length, 3, 'input array not shortened');
});

test('bounce: conserves momentum, separates, reverses approach', () => {
  const a = createBody({ id: 1, x: 0, y: 0, vx: 2, mass: 3 });
  const b = createBody({ id: 2, x: 4, y: 0, vx: -1, mass: 1 });
  const [px0, py0] = totalMomentum([a, b]);
  const c0 = centerOfMass([a, b]);
  bounceBodies(a, b, 0.8);
  const [px1, py1] = totalMomentum([a, b]);
  close(px1, px0);
  close(py1, py0);
  close(centerOfMass([a, b]).x, c0.x);
  close(b.x - a.x, a.radius + b.radius);
  assert.ok(b.vx - a.vx > 0, 'moving apart');
  close(b.vx - a.vx, 0.8 * 3);
});

test('predictPath: capped, starts at the probe, stops on a hit', () => {
  const sun = createBody({ id: 1, x: 0, y: 0, mass: 1000, star: true });
  const free = predictPath([sun], { x: 100, y: 0, vx: 0, vy: 3.16, radius: 3 }, { G: 1, eps: 1.5, dt: 0.25, steps: 300 });
  assert.equal(free.count, 301);
  assert.equal(free.hitId, null);
  close(free.points[0], 100, 1e-4);
  const fall = predictPath([sun], { x: 100, y: 0, vx: 0, vy: 0, radius: 3 }, { G: 1, eps: 1.5, dt: 0.25, steps: 300 });
  assert.equal(fall.hitId, 1);
  assert.ok(fall.count < 301);
});
