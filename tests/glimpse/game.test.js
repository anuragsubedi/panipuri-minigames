import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUNDS, GUESS_LIMITS } from '../../games/glimpse/src/config.js';
import { createRng } from '../../shared/js/rng.js';
import {
  PHASES,
  createGame,
  setDifficulty,
  startGame,
  endReady,
  endFlash,
  submitGuess,
  nextRound,
  isValidGuess,
  currentRound,
  gameTotal,
  flashMs,
} from '../../games/glimpse/src/state/game.js';

const started = () => startGame(createGame(), createRng(123));
const toGuess = (s) => endFlash(endReady(s));

test('createGame: starts on intro with default difficulty', () => {
  const s = createGame();
  assert.equal(s.phase, PHASES.INTRO);
  assert.equal(s.difficulty, 'easy');
  assert.deepEqual(s.rounds, []);
});

test('setDifficulty: hard flashes shorter; unknown rejected', () => {
  assert.ok(flashMs(setDifficulty(createGame(), 'hard')) < flashMs(createGame()));
  assert.throws(() => setDifficulty(createGame(), 'nightmare'));
});

test('startGame: deterministic rounds with dots matching counts', () => {
  const a = started();
  const b = started();
  assert.equal(a.phase, PHASES.READY);
  assert.equal(a.rounds.length, ROUNDS);
  assert.deepEqual(a.rounds, b.rounds);
  for (const r of a.rounds) {
    assert.equal(r.dots.length, r.count);
    assert.equal(r.guess, null);
  }
});

test('phases: ready → flash → guess', () => {
  const s = started();
  assert.equal(endReady(s).phase, PHASES.FLASH);
  assert.equal(toGuess(s).phase, PHASES.GUESS);
});

test('submitGuess: exact count scores 10', () => {
  const s0 = toGuess(started());
  const s1 = submitGuess(s0, currentRound(s0).count);
  assert.equal(s1.phase, PHASES.ROUND_RESULT);
  assert.equal(currentRound(s1).error, 0);
  assert.equal(currentRound(s1).score, 10);
  assert.equal(currentRound(s0).guess, null, 'original state not mutated');
});

test('submitGuess: closer guess scores higher', () => {
  const s0 = toGuess(started());
  const { count } = currentRound(s0);
  const near = currentRound(submitGuess(s0, Math.round(count * 1.1))).score;
  const far = currentRound(submitGuess(s0, count * 3)).score;
  assert.ok(near > far);
});

test('submitGuess: rejects invalid guesses', () => {
  const s0 = toGuess(started());
  for (const bad of [0, -3, 2.5, NaN, GUESS_LIMITS.max + 1, '12', null]) {
    assert.throws(() => submitGuess(s0, bad), RangeError, `accepted ${bad}`);
  }
});

test('isValidGuess: matches limits', () => {
  assert.ok(isValidGuess(GUESS_LIMITS.min));
  assert.ok(isValidGuess(GUESS_LIMITS.max));
  assert.ok(!isValidGuess(GUESS_LIMITS.min - 1));
  assert.ok(!isValidGuess(1.5));
});

test('full game: plays every round then reaches summary', () => {
  let s = started();
  for (let i = 0; i < ROUNDS; i++) {
    assert.equal(s.roundIndex, i);
    s = toGuess(s);
    s = nextRound(submitGuess(s, currentRound(s).count));
  }
  assert.equal(s.phase, PHASES.SUMMARY);
  assert.equal(gameTotal(s), ROUNDS * 10);
});

test('startGame from summary resets for play again', () => {
  let s = started();
  for (let i = 0; i < ROUNDS; i++) s = nextRound(submitGuess(toGuess(s), 1));
  const again = startGame(s, createRng(9));
  assert.equal(again.phase, PHASES.READY);
  assert.equal(again.roundIndex, 0);
  assert.equal(gameTotal(again), 0);
});

test('invalid transitions throw', () => {
  assert.throws(() => endReady(createGame()));
  assert.throws(() => endFlash(started()));
  assert.throws(() => submitGuess(started(), 10));
  assert.throws(() => nextRound(started()));
  assert.throws(() => startGame(started(), createRng(1)));
});
