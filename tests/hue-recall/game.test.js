import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUNDS } from '../../games/hue-recall/src/config.js';
import { createRng } from '../../shared/js/rng.js';
import {
  PHASES,
  createGame,
  setDifficulty,
  startGame,
  endMemorize,
  submitGuess,
  nextRound,
  currentRound,
  gameTotal,
  memorizeMs,
} from '../../games/hue-recall/src/state/game.js';

const started = () => startGame(createGame(), createRng(123));

test('createGame: starts on intro with default difficulty', () => {
  const s = createGame();
  assert.equal(s.phase, PHASES.INTRO);
  assert.equal(s.difficulty, 'easy');
  assert.deepEqual(s.rounds, []);
});

test('createGame / setDifficulty: reject unknown difficulty', () => {
  assert.throws(() => createGame({ difficulty: 'nightmare' }));
  assert.throws(() => setDifficulty(createGame(), 'nightmare'));
});

test('setDifficulty: changes memorize duration', () => {
  const easy = createGame();
  const hard = setDifficulty(easy, 'hard');
  assert.ok(memorizeMs(hard) < memorizeMs(easy));
  assert.equal(easy.difficulty, 'easy', 'original state not mutated');
});

test('startGame: generates targets deterministically', () => {
  const a = started();
  const b = started();
  assert.equal(a.phase, PHASES.MEMORIZE);
  assert.equal(a.rounds.length, ROUNDS);
  assert.deepEqual(a.rounds, b.rounds);
  assert.ok(a.rounds.every((r) => r.guess === null && r.score === null));
});

test('submitGuess: exact guess scores max', () => {
  const s0 = endMemorize(started());
  const s1 = submitGuess(s0, currentRound(s0).target);
  assert.equal(s1.phase, PHASES.ROUND_RESULT);
  assert.equal(currentRound(s1).deltaE, 0);
  assert.equal(currentRound(s1).score, 10);
  assert.equal(currentRound(s0).guess, null, 'original state not mutated');
});

test('submitGuess: a bad guess scores less than a close one', () => {
  const s0 = endMemorize(started());
  const { h, s, b } = currentRound(s0).target;
  const close = currentRound(submitGuess(s0, { h, s, b: Math.max(0, b - 3) })).score;
  const far = currentRound(submitGuess(s0, { h: (h + 180) % 360, s, b })).score;
  assert.ok(close > far);
});

test('full game: plays every round then reaches summary', () => {
  let s = started();
  for (let i = 0; i < ROUNDS; i++) {
    assert.equal(s.roundIndex, i);
    s = endMemorize(s);
    s = submitGuess(s, currentRound(s).target);
    s = nextRound(s);
  }
  assert.equal(s.phase, PHASES.SUMMARY);
  assert.equal(gameTotal(s), ROUNDS * 10);
});

test('startGame from summary resets for play again', () => {
  let s = started();
  for (let i = 0; i < ROUNDS; i++) {
    s = nextRound(submitGuess(endMemorize(s), { h: 0, s: 0, b: 50 }));
  }
  const again = startGame(s, createRng(5));
  assert.equal(again.phase, PHASES.MEMORIZE);
  assert.equal(again.roundIndex, 0);
  assert.equal(gameTotal(again), 0);
});

test('invalid transitions throw', () => {
  const intro = createGame();
  assert.throws(() => endMemorize(intro));
  assert.throws(() => submitGuess(started(), { h: 0, s: 0, b: 0 }));
  assert.throws(() => nextRound(started()));
  assert.throws(() => startGame(started(), createRng(1)));
});
