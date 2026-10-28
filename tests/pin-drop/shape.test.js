import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nearestOnShape, insideArea } from '../../games/pin-drop/src/geo/shape.js';
import { validatePack } from '../../games/pin-drop/src/data/load-pack.js';

const RIVER = { kind: 'line', paths: [[[84, 27], [84, 28], [85, 28]]] };
const SQUARE = [[84, 27], [85, 27], [85, 28], [84, 28]];
const PARK = { kind: 'area', paths: [SQUARE] };

const close = (a, b) => Math.abs(a.lat - b.lat) < 1e-9 && Math.abs(a.lon - b.lon) < 1e-9;

test('nearestOnShape: a line snaps to the closest segment, clamped to its ends', () => {
  assert.ok(close(nearestOnShape({ lat: 27.5, lon: 83.5 }, RIVER), { lat: 27.5, lon: 84 }));
  assert.ok(close(nearestOnShape({ lat: 28.4, lon: 84.6 }, RIVER), { lat: 28, lon: 84.6 }));
  assert.ok(close(nearestOnShape({ lat: 26, lon: 84 }, RIVER), { lat: 27, lon: 84 }));
});

test('nearestOnShape: inside an area is the pin itself; outside snaps to the edge, closing the ring', () => {
  assert.ok(close(nearestOnShape({ lat: 27.5, lon: 84.5 }, PARK), { lat: 27.5, lon: 84.5 }));
  // The closing edge (84,28) → (84,27) isn't repeated in the ring.
  assert.ok(close(nearestOnShape({ lat: 27.5, lon: 83 }, PARK), { lat: 27.5, lon: 84 }));
  // A line with the same points has no closing edge.
  assert.ok(close(nearestOnShape({ lat: 27.5, lon: 83 }, { kind: 'line', paths: [SQUARE] }), { lat: 27, lon: 84 }));
});

test('insideArea: even-odd, so a hole is outside', () => {
  const hole = [[84.4, 27.4], [84.6, 27.4], [84.6, 27.6], [84.4, 27.6]];
  assert.equal(insideArea({ lat: 27.2, lon: 84.2 }, [SQUARE, hole]), true);
  assert.equal(insideArea({ lat: 27.5, lon: 84.5 }, [SQUARE, hole]), false);
  assert.equal(insideArea({ lat: 30, lon: 84.5 }, [SQUARE]), false);
});

test('validatePack: shapes must have a kind and [lon, lat] paths', () => {
  const pack = (shape) => ({ id: 'p', name: 'P', map: 'm', scoreScaleKm: 50, places: [{ name: 'X', lat: 27, lon: 84, tier: 1, region: 'R', shape }] });
  assert.doesNotThrow(() => validatePack(pack(RIVER)));
  assert.throws(() => validatePack(pack({ kind: 'blob', paths: RIVER.paths })), /shape/);
  assert.throws(() => validatePack(pack({ kind: 'line', paths: [[[84, 27]]] })), /shape/);
});
