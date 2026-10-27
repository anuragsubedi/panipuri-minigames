import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/js/rng.js';
import { poolFor, pickPlaces, shuffle } from '../../games/pin-drop/src/data/pick-places.js';
import { clueFor, answerLabel } from '../../games/pin-drop/src/data/clue.js';

const place = (name, region, tier = 1) => ({ name, detail: 'Land', lat: 0, lon: 0, tier, region });
const POOL = [
  ...['a1', 'a2', 'a3', 'a4'].map((n) => place(n, 'Asia')),
  ...['e1', 'e2', 'e3'].map((n) => place(n, 'Europe')),
  place('f1', 'Africa'),
];

test('poolFor filters tiers and tags pack id + scale', () => {
  const pack = { id: 'p', scoreScaleKm: 900, places: [place('x', 'Asia', 1), place('y', 'Asia', 3)] };
  const pool = poolFor([pack], [1, 2]);
  assert.deepEqual(pool.map((p) => [p.name, p.packId, p.scaleKm]), [['x', 'p', 900]]);
});

test('pickPlaces: deterministic, distinct, and spread across regions', () => {
  const a = pickPlaces(POOL, 6, createRng(7));
  assert.deepEqual(a, pickPlaces(POOL, 6, createRng(7)));
  assert.equal(new Set(a.map((p) => p.name)).size, 6);
  // First three picks cover all three regions before any repeats.
  assert.equal(new Set(a.slice(0, 3).map((p) => p.region)).size, 3);
  // Africa is exhausted after one pick; later picks still find places.
  assert.equal(pickPlaces(POOL, 8, createRng(1)).length, 8);
});

test('pickPlaces throws when the pool is too small', () => {
  assert.throws(() => pickPlaces(POOL, 9, createRng(1)), RangeError);
});

test('shuffle keeps every item and does not mutate', () => {
  const items = [1, 2, 3, 4, 5];
  const out = shuffle(items, createRng(3));
  assert.deepEqual([...out].sort(), items);
  assert.deepEqual(items, [1, 2, 3, 4, 5]);
});

test('clueFor: text clue hides the country on request; custom clues pass through', () => {
  const p = { name: 'Timbuktu', detail: 'Mali' };
  assert.deepEqual(clueFor(p, { showDetail: true }), { type: 'text', text: 'Timbuktu', detail: 'Mali' });
  assert.equal(clueFor(p, { showDetail: false }).detail, null);
  const photo = { type: 'photo', src: 'a.jpg', credit: 'CC BY' };
  assert.equal(clueFor({ ...p, clue: photo }, { showDetail: true }), photo);
  assert.equal(answerLabel(p), 'Timbuktu, Mali');
  assert.equal(answerLabel({ name: 'Somewhere' }), 'Somewhere');
});
