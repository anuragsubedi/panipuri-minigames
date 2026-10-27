import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/js/rng.js';
import { SOFTENING, MAX_BODIES, DT, SIM_RATE, MAX_FRAME_SECONDS, PALETTE_SIZE } from '../../games/orbit/src/config.js';
import { totalMomentum, totalEnergy } from '../../games/orbit/src/physics/gravity.js';
import { centerOfMass, kindOf, radiusOf } from '../../games/orbit/src/sim/bodies.js';
import { PRESETS, buildPreset } from '../../games/orbit/src/sim/presets.js';
import {
  createWorld,
  advance,
  launch,
  removeBody,
  setStarMass,
  setCollisions,
  gravityOf,
  stepsFor,
  bodyById,
  aimVelocity,
} from '../../games/orbit/src/sim/world.js';
import { createCamera, bodyAt } from '../../games/orbit/src/view/camera.js';
import { createTrails } from '../../games/orbit/src/view/trails.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

for (const preset of PRESETS) {
  test(`preset ${preset.id}: valid bodies, at rest at the origin, has a star`, () => {
    const bodies = buildPreset(preset.id, createRng(7));
    assert.ok(bodies.length >= 2 && bodies.length <= MAX_BODIES);
    assert.equal(new Set(bodies.map((b) => b.id)).size, bodies.length, 'unique ids');
    assert.ok(bodies.some((b) => b.star));
    for (const b of bodies) {
      for (const k of ['x', 'y', 'vx', 'vy', 'mass', 'radius']) assert.ok(Number.isFinite(b[k]), `${k} finite`);
      assert.ok(b.mass > 0);
      close(b.radius, radiusOf(b.mass));
      assert.ok(Number.isInteger(b.color) && b.color >= 0 && b.color < PALETTE_SIZE);
    }
    const c = centerOfMass(bodies);
    for (const k of ['x', 'y', 'vx', 'vy']) close(c[k], 0, 1e-9);
    // No body starts inside another.
    for (let i = 0; i < bodies.length; i++)
      for (let j = i + 1; j < bodies.length; j++) {
        const [a, b] = [bodies[i], bodies[j]];
        assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > a.radius + b.radius, `${a.id}/${b.id} overlap`);
      }
  });
}

test('preset: chaos is reproducible from the seed', () => {
  assert.deepEqual(buildPreset('chaos', createRng(3)), buildPreset('chaos', createRng(3)));
  assert.throws(() => buildPreset('nope', createRng(1)));
});

test('presets: bound systems (negative energy) stay mostly intact for 1000 steps', () => {
  for (const id of ['inner', 'binary']) {
    const world = createWorld({ presetId: id, rng: createRng(1) });
    assert.ok(totalEnergy(world.bodies, gravityOf(world), SOFTENING) < 0);
    const after = advance(world, 1000).world;
    assert.equal(after.bodies.length, world.bodies.length, `${id} lost bodies`);
  }
});

test('world: advance is pure and conserves momentum through a merge', () => {
  const base = createWorld({ presetId: 'inner', rng: createRng(1) });
  const world = launch(base, { x: 0, y: 30, vx: 0.5, vy: -3, mass: 40, color: 1 });
  const snapshot = JSON.stringify(world);
  const [px0, py0] = totalMomentum(world.bodies);
  const { world: after, merges } = advance(world, 200);
  assert.equal(JSON.stringify(world), snapshot, 'input untouched');
  assert.deepEqual(merges.map((m) => [m.from, m.into]), [[world.bodies.at(-1).id, 1]]);
  assert.equal(after.bodies.length, world.bodies.length - 1);
  const [px1, py1] = totalMomentum(after.bodies);
  close(px1, px0, 1e-9);
  close(py1, py0, 1e-9);
  close(after.time, 200 * DT, 1e-9);
});

test('world: chaos runs 2000 steps without NaN', () => {
  const after = advance(createWorld({ presetId: 'chaos', rng: createRng(7) }), 2000).world;
  assert.ok(after.bodies.every((b) => Number.isFinite(b.x) && Number.isFinite(b.vx)));
});

test('world: launch, cap, remove', () => {
  let world = createWorld({ presetId: 'inner', rng: createRng(1) });
  const n = world.bodies.length;
  world = launch(world, { x: 10, y: 300, vx: 1, vy: 0, mass: 4, color: 2 });
  assert.equal(world.bodies.length, n + 1);
  const added = world.bodies.at(-1);
  assert.equal(added.id, n + 1);
  assert.equal(kindOf(added).kind, 'planet');
  world = removeBody(world, added.id);
  assert.equal(bodyById(world, added.id), null);
  for (let i = 0; i < 80; i++) world = launch(world, { x: i * 30, y: 900, vx: 0, vy: 0, mass: 1, color: 0 });
  assert.equal(world.bodies.length, MAX_BODIES);
});

test('world: star mass slider scales stars only, and round-trips', () => {
  const world = createWorld({ presetId: 'binary', rng: createRng(1) });
  const doubled = setStarMass(world, 2);
  for (const [a, b] of world.bodies.map((b, i) => [b, doubled.bodies[i]])) close(b.mass, a.star ? a.mass * 2 : a.mass);
  const back = setStarMass(setStarMass(doubled, 0.25), 1);
  world.bodies.forEach((b, i) => close(back.bodies[i].mass, b.mass, 1e-9));
  assert.equal(setCollisions(world, 'bounce').collisions, 'bounce');
});

test('kindOf: names by mass, stars by flag', () => {
  assert.equal(kindOf({ mass: 0.5, star: false }).label, 'Moon');
  assert.equal(kindOf({ mass: 4, star: false }).label, 'Planet');
  assert.equal(kindOf({ mass: 900, star: false }).label, 'Giant');
  assert.equal(kindOf({ mass: 100, star: true }).label, 'Star');
});

test('stepsFor: fixed steps, carry, clamps long gaps and caps steps', () => {
  const opts = { rate: SIM_RATE, speed: 1, dt: DT, maxFrame: MAX_FRAME_SECONDS, maxSteps: 400 };
  const a = stepsFor(0, 1 / 60, opts);
  assert.equal(a.steps, 6);
  close(a.carry, SIM_RATE / 60 - 6 * DT, 1e-12);
  const hidden = stepsFor(0, 30, opts);
  assert.equal(hidden.steps, Math.floor((MAX_FRAME_SECONDS * SIM_RATE) / DT + 1e-9));
  assert.deepEqual(stepsFor(0, 1, { ...opts, speed: 8 }), { steps: 400, carry: 0 });
  assert.equal(stepsFor(0, 1, { ...opts, speed: 0 }).steps, 0);
});

test('camera: round trip, y up, hit test', () => {
  const cam = createCamera({ width: 400, height: 600, cx: 10, cy: -5, viewRadius: 200 });
  close(cam.scale, 1);
  const [sx, sy] = cam.toScreen(30, 15);
  assert.deepEqual([sx, sy], [220, 280]);
  const [wx, wy] = cam.toWorld(sx, sy);
  close(wx, 30);
  close(wy, 15);
  const bodies = [{ id: 1, x: 0, y: 0, radius: 2 }, { id: 2, x: 30, y: 0, radius: 10 }];
  assert.equal(bodyAt(bodies, [5, 0], 1, 16)?.id, 1);
  assert.equal(bodyAt(bodies, [24, 0], 1, 16)?.id, 2);
  assert.equal(bodyAt(bodies, [100, 100], 1, 16), null);
});

test('trails: sample on sim time, cap length, forget gone bodies', () => {
  const trails = createTrails({ every: 1, length: 3 });
  for (let t = 0; t < 10; t += 0.5) trails.record([{ id: 1, x: t, y: 0 }], t);
  assert.deepEqual(trails.get(1), [7, 0, 8, 0, 9, 0]);
  trails.record([], 11);
  assert.equal(trails.get(1), undefined);
});

test('aimVelocity: scales with drag and caps speed', () => {
  assert.deepEqual(aimVelocity([0, 0], [100, 0], { speedPerUnit: 0.03, maxSpeed: 9 }), [3, 0]);
  const [vx, vy] = aimVelocity([0, 0], [0, -1000], { speedPerUnit: 0.03, maxSpeed: 9 });
  close(vx, 0);
  close(vy, -9);
});
