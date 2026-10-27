import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/js/rng.js';
import {
  PHASES,
  createGame,
  setOptions,
  startGame,
  submitPin,
  nextRound,
  isValidPin,
  currentRound,
  currentClue,
  gameTotal,
  packIdsFor,
} from '../../games/pin-drop/src/state/game.js';

const regions = ['Asia', 'Europe', 'Africa', 'Oceania'];
const makePack = (id, map = 'world') => ({
  id,
  name: id,
  map,
  scoreScaleKm: 1500,
  places: Array.from({ length: 36 }, (_, i) => ({
    name: `${id}-${i}`,
    detail: 'Country',
    lat: -50 + i * 3,
    lon: -170 + i * 9,
    tier: (i % 3) + 1,
    region: regions[i % 4],
  })),
});
const PACKS = Object.fromEntries(
  [...['capitals', 'cities', 'landmarks'].map((id) => makePack(id)), ...['india-capitals', 'india-cities', 'india-landmarks'].map((id) => makePack(id, 'india'))].map((p) => [p.id, p]),
);
const started = (opts) => startGame(createGame(opts), PACKS, createRng(42));

test('createGame: defaults and validation', () => {
  const s = createGame();
  assert.equal(s.phase, PHASES.INTRO);
  assert.deepEqual([s.mapId, s.topic, s.difficulty, s.roundCount], ['world', 'capitals', 'easy', 5]);
  assert.throws(() => createGame({ topic: 'moons' }));
  assert.throws(() => createGame({ mapId: 'mars' }));
  assert.throws(() => createGame({ roundCount: 7 }));
});

test('setOptions: only between games', () => {
  const s = setOptions(createGame(), { topic: 'mix', roundCount: 10 });
  assert.deepEqual([s.topic, s.roundCount, s.difficulty], ['mix', 10, 'easy']);
  assert.throws(() => setOptions(started(), { topic: 'cities' }));
  assert.throws(() => setOptions(createGame(), { difficulty: 'brutal' }));
});

test('startGame: seeded, right length, tiers follow difficulty', () => {
  const a = started({ difficulty: 'hard', roundCount: 5 });
  assert.equal(a.phase, PHASES.CLUE);
  assert.equal(a.rounds.length, 5);
  assert.deepEqual(a.rounds, started({ difficulty: 'hard', roundCount: 5 }).rounds);
  assert.ok(a.rounds.every((r) => r.place.tier >= 2 && r.place.packId === 'capitals'));
  assert.equal(started({ roundCount: 10 }).rounds.length, 10);
  const mix = started({ topic: 'mix', difficulty: 'medium', roundCount: 10 });
  assert.ok(new Set(mix.rounds.map((r) => r.place.packId)).size > 1);
  assert.throws(() => startGame(createGame({ topic: 'mix' }), { capitals: PACKS.capitals }, createRng(1)), /not loaded/);
});

test('currentClue hides the country on hard', () => {
  assert.equal(currentClue(started()).detail, 'Country');
  assert.equal(currentClue(started({ difficulty: 'hard' })).detail, null);
});

test('submitPin scores by distance; exact pin is full marks', () => {
  const s = started();
  const { lat, lon } = currentRound(s).place;
  const exact = submitPin(s, { lat, lon });
  assert.equal(exact.phase, PHASES.REVEAL);
  assert.equal(currentRound(exact).distanceKm, 0);
  assert.equal(currentRound(exact).score, 10);
  const far = submitPin(s, { lat: -lat, lon: lon > 0 ? lon - 180 : lon + 180 });
  assert.ok(currentRound(far).distanceKm > 19000);
  assert.ok(currentRound(far).score < 0.01);
  assert.throws(() => submitPin(s, { lat: 95, lon: 0 }), RangeError);
  assert.throws(() => submitPin(exact, { lat, lon }), /Invalid transition/);
});

test('full game: clue → reveal → … → summary; total adds up', () => {
  let s = started();
  for (let i = 0; i < 5; i++) {
    assert.equal(s.phase, PHASES.CLUE);
    s = nextRound(submitPin(s, { lat: 0, lon: 0 }));
  }
  assert.equal(s.phase, PHASES.SUMMARY);
  const sum = s.rounds.reduce((t, r) => t + r.score, 0);
  assert.equal(gameTotal(s), sum);
  assert.equal(startGame(s, PACKS, createRng(9)).phase, PHASES.CLUE);
});

test('isValidPin', () => {
  assert.ok(isValidPin({ lat: 0, lon: 180 }));
  assert.ok(!isValidPin({ lat: NaN, lon: 0 }));
  assert.ok(!isValidPin(null));
});

test('maps: switching map keeps the topic and draws from that map\'s packs', () => {
  assert.deepEqual(packIdsFor({ mapId: 'india', topic: 'mix' }), ['india-capitals', 'india-cities', 'india-landmarks']);
  const s = setOptions(createGame({ topic: 'landmarks' }), { mapId: 'india' });
  assert.equal(s.topic, 'landmarks');
  const game = startGame(s, PACKS, createRng(3));
  assert.ok(game.rounds.every((r) => r.place.packId === 'india-landmarks'));
});
