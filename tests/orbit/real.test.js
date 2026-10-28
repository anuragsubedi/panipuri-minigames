import { test } from 'node:test';
import assert from 'node:assert/strict';
import { G_BASE, SUN_MASS, SOFTENING, DT } from '../../games/orbit/src/config.js';
import { DAYS_PER_UNIT, KMS_PER_UNIT, toDays, fromDays, toAu, fromAu, toSuns, fromSuns } from '../../games/orbit/src/sim/units.js';
import { formatElapsed, formatDate, formatRate, formatMass, formatSpeed, formatDistance } from '../../games/orbit/src/view/format.js';
import { solarSystem, stateFromElements, PLANETS, REAL_PERIODS, SOLAR_EPOCH } from '../../games/orbit/src/sim/solar-system.js';
import { circularSpeed } from '../../games/orbit/src/sim/bodies.js';
import { createWorld, advance, launch } from '../../games/orbit/src/sim/world.js';
import { toSnapshot, fromSnapshot } from '../../games/orbit/src/sim/snapshot.js';
import { createRng } from '../../shared/js/rng.js';

const close = (a, b, tol) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('units: r = 100 around the Sun is one year at Earth speed', () => {
  const period = (2 * Math.PI * 100) / circularSpeed(G_BASE, SUN_MASS, 100);
  close(toDays(period), 365.25, 0.1);
  close(DAYS_PER_UNIT, 1.8383, 1e-3);
  close(circularSpeed(G_BASE, SUN_MASS, 100) * KMS_PER_UNIT, 29.78, 0.05);
  close(fromDays(toDays(3.3)), 3.3, 1e-12);
  close(fromAu(toAu(42)), 42, 1e-12);
  close(fromSuns(toSuns(7)), 7, 1e-12);
});

test('formatElapsed: days, months, years', () => {
  assert.equal(formatElapsed(0), '0 d');
  assert.equal(formatElapsed(fromDays(12.7)), '12 d');
  assert.equal(formatElapsed(fromDays(130)), '4 mo 8 d');
  assert.equal(formatElapsed(fromDays(365.25 * 3 + 125)), '3 yr 4 mo');
  assert.equal(formatElapsed(fromDays(365.25 * 152.5)), '152 yr');
});

test('formatDate: calendar date from an epoch, UTC', () => {
  assert.equal(formatDate(SOLAR_EPOCH, 0), '1 Jan 2000');
  assert.equal(formatDate(SOLAR_EPOCH, fromDays(366)), '1 Jan 2001');
  assert.equal(formatDate(SOLAR_EPOCH, fromDays(31)), '1 Feb 2000');
});

test('formatRate: picks a readable unit', () => {
  assert.equal(formatRate(fromDays(0.5)), '1 s ≈ 12 hours');
  assert.equal(formatRate(fromDays(1)), '1 s ≈ 1 day');
  assert.equal(formatRate(20), '1 s ≈ 5.3 weeks');
  assert.equal(formatRate(fromDays(120)), '1 s ≈ 3.9 months');
  assert.equal(formatRate(20 * 64), '1 s ≈ 6.4 years');
});

test('formatMass / speed / distance', () => {
  assert.deepEqual(formatMass(SUN_MASS, true), { value: '1', unit: 'Sun' });
  assert.deepEqual(formatMass(fromSuns(9.5479e-4), false), { value: '1', unit: 'Jupiter' });
  assert.deepEqual(formatMass(fromSuns(3.0404e-6), false), { value: '1.01', unit: 'Earths' });
  assert.deepEqual(formatMass(fromSuns(0.2), false), { value: '0.2', unit: 'Suns' });
  assert.equal(formatSpeed(1), '9.42');
  assert.equal(formatDistance(152), '1.52');
});

test('solar system: every orbit period within 0.5% of the real one', () => {
  for (const p of PLANETS) {
    const GM = G_BASE * (SUN_MASS + fromSuns(p.mass));
    const a = fromAu(p.a);
    const days = toDays(2 * Math.PI * Math.sqrt(a ** 3 / GM));
    const real = REAL_PERIODS[p.name];
    assert.ok(Math.abs(days - real) / real < 0.005, `${p.name}: ${days.toFixed(1)} vs ${real}`);
  }
});

test('solar system: state vectors reproduce a and e (vis-viva)', () => {
  for (const p of PLANETS) {
    const GM = G_BASE * SUN_MASS;
    const a = fromAu(p.a);
    const s = stateFromElements({ ...p, a }, GM);
    const r = Math.hypot(s.x, s.y);
    const v2 = s.vx ** 2 + s.vy ** 2;
    close(1 / (2 / r - v2 / GM), a, a * 1e-9);
    const h = s.x * s.vy - s.y * s.vx;
    close(Math.sqrt(Math.max(0, 1 - (h * h) / (GM * a))), p.e, 1e-6);
    assert.ok(h > 0, `${p.name} orbits counter-clockwise`);
  }
});

test('solar system preset: Earth is back near its start after one year', () => {
  let world = createWorld({ presetId: 'solar', rng: createRng(1) });
  assert.equal(world.epoch, SOLAR_EPOCH);
  assert.equal(world.bodies.length, 9);
  const earth0 = world.bodies.find((b) => b.name === 'Earth');
  const steps = Math.round(fromDays(365.256) / DT);
  world = advance(world, steps).world;
  const earth = world.bodies.find((b) => b.name === 'Earth');
  assert.equal(world.bodies.length, 9, 'nothing merged or escaped');
  // Within 1.5% of the orbit radius (Jupiter tugs a little; that's real too).
  assert.ok(Math.hypot(earth.x - earth0.x, earth.y - earth0.y) < 1.5, 'Earth closes its orbit');
  assert.ok(solarSystem(G_BASE, SUN_MASS).every((b) => b.radius > SOFTENING));
});

test('snapshot: round trip keeps the world; junk is rejected', () => {
  let world = createWorld({ presetId: 'binary', rng: createRng(2) });
  world = launch(world, { x: 300, y: 0, vx: 0, vy: 2, mass: 0.95, color: 3 });
  world = advance(world, 50).world;
  const snap = JSON.parse(JSON.stringify(toSnapshot(world, { name: 'Test', view: 400, savedAt: 1 })));
  const back = fromSnapshot(snap);
  assert.equal(back.name, 'Test');
  assert.equal(back.view, 400);
  assert.deepEqual(back.world.bodies, world.bodies);
  for (const k of ['presetId', 'epoch', 'nextId', 'gravity', 'starMass', 'collisions', 'time']) assert.equal(back.world[k], world[k], k);
  assert.equal(fromSnapshot(null), null);
  assert.equal(fromSnapshot({ v: 1, bodies: [{ id: 1, x: 'a' }] }), null);
  assert.equal(fromSnapshot({ v: 1, bodies: [{ id: 1, x: 0, y: 0, vx: 0, vy: 0, mass: -1 }] }), null);
  assert.equal(fromSnapshot({ v: 99, bodies: [] }), null);
});
