import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { validatePack, loadPack } from '../../games/pin-drop/src/data/load-pack.js';
import { MAPS, DIFFICULTIES, ROUND_OPTIONS } from '../../games/pin-drop/src/config.js';
import { poolFor } from '../../games/pin-drop/src/data/pick-places.js';

const DIR = new URL('../../games/pin-drop/data/packs/', import.meta.url);
const packs = Object.fromEntries(
  readdirSync(DIR).map((file) => {
    const pack = JSON.parse(readFileSync(new URL(file, DIR), 'utf8'));
    return [pack.id, pack];
  }),
);
const sample = () => ({
  id: 't',
  name: 'Test',
  map: 'world',
  scoreScaleKm: 1500,
  places: [{ name: 'A', detail: 'B', lat: 1, lon: 2, tier: 1, region: 'Asia' }],
});

test('every bundled pack is valid and file name matches id', () => {
  for (const file of readdirSync(DIR)) {
    const pack = validatePack(JSON.parse(readFileSync(new URL(file, DIR), 'utf8')));
    assert.equal(`${pack.id}.json`, file);
  }
});

test('every map × topic × difficulty has enough places for the longest game', () => {
  const longest = Math.max(...ROUND_OPTIONS);
  for (const [mapId, { topics }] of Object.entries(MAPS)) {
    for (const [topic, { packs: ids }] of Object.entries(topics)) {
      for (const [difficulty, { tiers }] of Object.entries(DIFFICULTIES)) {
        const pool = poolFor(ids.map((id) => packs[id]), tiers);
        assert.ok(pool.length >= longest, `${mapId}/${topic}/${difficulty} has ${pool.length}`);
      }
    }
  }
});

test('every pack is drawn on the map its topics belong to, and places lie inside that map', () => {
  for (const [mapId, { topics }] of Object.entries(MAPS)) {
    const { bounds } = JSON.parse(readFileSync(new URL(`../../games/pin-drop/data/maps/${mapId}.json`, import.meta.url), 'utf8'));
    for (const id of Object.values(topics).flatMap((t) => t.packs)) {
      assert.equal(packs[id].map, mapId, id);
      for (const p of packs[id].places) {
        const inside = p.lat <= bounds.north && p.lat >= bounds.south && p.lon >= bounds.west && p.lon <= bounds.east;
        assert.ok(inside, `${id}: ${p.name} is outside the ${mapId} map`);
      }
    }
  }
});

test('no duplicate names inside a pack', () => {
  for (const pack of Object.values(packs)) {
    const names = pack.places.map((p) => p.name);
    assert.equal(new Set(names).size, names.length, pack.id);
  }
});

test('validatePack rejects bad data', () => {
  assert.doesNotThrow(() => validatePack(sample()));
  const bad = (edit) => {
    const pack = sample();
    edit(pack);
    return pack;
  };
  assert.throws(() => validatePack(null));
  assert.throws(() => validatePack(bad((p) => delete p.map)), /map/);
  assert.throws(() => validatePack(bad((p) => (p.scoreScaleKm = 0))), /scoreScaleKm/);
  assert.throws(() => validatePack(bad((p) => (p.places = []))), /places/);
  assert.throws(() => validatePack(bad((p) => (p.places[0].lat = 91))), /lat/);
  assert.throws(() => validatePack(bad((p) => (p.places[0].lon = -181))), /lon/);
  assert.throws(() => validatePack(bad((p) => (p.places[0].tier = 4))), /tier/);
  assert.throws(() => validatePack(bad((p) => (p.places[0].clue = { src: 'x.jpg' }))), /clue/);
  assert.throws(() => validatePack(bad((p) => (p.places[0].blurb = 42))), /blurb/);
});

test('loadPack validates what it fetches', async () => {
  const ok = async () => ({ ok: true, json: async () => sample() });
  assert.equal((await loadPack('x.json', ok)).id, 't');
  const missing = async () => ({ ok: false, status: 404 });
  await assert.rejects(loadPack('x.json', missing), /404/);
});
