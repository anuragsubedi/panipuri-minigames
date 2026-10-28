import { test } from 'node:test';
import assert from 'node:assert/strict';
import { project, unproject, boundsRect, clampToBounds } from '../../games/pin-drop/src/geo/project.js';
import { distanceKm, bearingDeg, compassPoint } from '../../games/pin-drop/src/geo/haversine.js';

const LONDON = { lat: 51.507, lon: -0.128 };
const PARIS = { lat: 48.857, lon: 2.352 };

test('project/unproject round-trip', () => {
  for (const p of [LONDON, PARIS, { lat: -33.9, lon: 151.2 }, { lat: 0, lon: -180 }]) {
    assert.deepEqual(unproject(project(p)), p);
  }
  assert.deepEqual(project({ lat: 10, lon: 20 }), { x: 20, y: -10 });
});

test('boundsRect and clampToBounds', () => {
  const bounds = { west: -180, east: 180, north: 84, south: -60 };
  assert.deepEqual(boundsRect(bounds), { x: -180, y: -84, w: 360, h: 144 });
  assert.deepEqual(clampToBounds({ lat: -75, lon: 10 }, bounds), { lat: -60, lon: 10 });
});

test('haversine: London → Paris ≈ 343.5 km', () => {
  assert.ok(Math.abs(distanceKm(LONDON, PARIS) - 343.5) < 1);
  assert.equal(distanceKm(PARIS, PARIS), 0);
});

test('haversine: antipodes are half the circumference; crossing the antimeridian is short', () => {
  assert.ok(Math.abs(distanceKm({ lat: 0, lon: 0 }, { lat: 0, lon: 180 }) - 20015.1) < 1);
  assert.ok(distanceKm({ lat: 0, lon: 179.5 }, { lat: 0, lon: -179.5 }) < 112);
});

test('bearing and compass words', () => {
  assert.equal(compassPoint(bearingDeg({ lat: 0, lon: 0 }, { lat: 10, lon: 0 })), 'north');
  assert.equal(compassPoint(bearingDeg({ lat: 0, lon: 0 }, { lat: 0, lon: -10 })), 'west');
  assert.equal(compassPoint(bearingDeg(LONDON, PARIS)), 'south-east');
  assert.equal(compassPoint(350), 'north');
  assert.equal(compassPoint(-90), 'west');
});

test('formatKm and directionHint', async () => {
  const { formatKm, directionHint } = await import('../../games/pin-drop/src/geo/describe.js');
  assert.equal(formatKm(0.4), '< 1 km');
  assert.equal(formatKm(1239.6), '1,240 km');
  assert.equal(directionHint(PARIS, PARIS, 0), 'Right on it');
  assert.equal(directionHint(LONDON, PARIS, 343), "It's south-east of your pin");
  assert.equal(directionHint(LONDON, PARIS, 20), 'Right on it');
  assert.equal(directionHint(LONDON, PARIS, 20, 7.5), "It's south-east of your pin");
});
