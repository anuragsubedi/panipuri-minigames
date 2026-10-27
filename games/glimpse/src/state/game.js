// Game state and its transitions. Every function is pure: (state, ...) → new state.
// Invalid transitions throw, so wiring bugs surface immediately.

import {
  ROUNDS,
  DIFFICULTIES,
  DEFAULT_DIFFICULTY,
  COUNT_BANDS,
  DOT_LAYOUT,
  GUESS_LIMITS,
  SCORE_CURVE,
} from '../config.js';
import { roundCounts } from '../dots/counts.js';
import { layoutDots } from '../dots/layout.js';
import { ratioError } from '../scoring/error.js';
import { roundScore, totalScore } from '../../../../shared/js/score.js';

export const PHASES = Object.freeze({
  INTRO: 'intro',
  READY: 'ready',
  FLASH: 'flash',
  GUESS: 'guess',
  ROUND_RESULT: 'roundResult',
  SUMMARY: 'summary',
});

/**
 * Fresh game sitting on the intro screen.
 * @param {{difficulty?: string}} [options]
 * @returns {object} game state
 */
export function createGame({ difficulty = DEFAULT_DIFFICULTY } = {}) {
  assertDifficulty(difficulty);
  return { phase: PHASES.INTRO, difficulty, roundIndex: 0, rounds: [] };
}

/**
 * Change difficulty; only allowed before a game starts.
 * @param {object} state
 * @param {string} difficulty key of DIFFICULTIES
 * @returns {object}
 */
export function setDifficulty(state, difficulty) {
  assertPhase(state, PHASES.INTRO, PHASES.SUMMARY);
  assertDifficulty(difficulty);
  return { ...state, difficulty };
}

/**
 * Generate every round's dot cloud and begin round 1. Also used for "play again".
 * @param {object} state
 * @param {() => number} rng float generator in [0, 1)
 * @returns {object}
 */
export function startGame(state, rng) {
  assertPhase(state, PHASES.INTRO, PHASES.SUMMARY);
  const rounds = roundCounts(rng, COUNT_BANDS)
    .slice(0, ROUNDS)
    .map((count) => ({
      count,
      dots: layoutDots(rng, count, DOT_LAYOUT),
      guess: null,
      error: null,
      score: null,
    }));
  return { ...state, phase: PHASES.READY, roundIndex: 0, rounds };
}

/**
 * Ready pause is over; show the dots.
 * @param {object} state
 * @returns {object}
 */
export function endReady(state) {
  assertPhase(state, PHASES.READY);
  return { ...state, phase: PHASES.FLASH };
}

/**
 * Flash time is over; hide the dots and ask for a guess.
 * @param {object} state
 * @returns {object}
 */
export function endFlash(state) {
  assertPhase(state, PHASES.FLASH);
  return { ...state, phase: PHASES.GUESS };
}

/**
 * Lock in the player's count and score the round.
 * @param {object} state
 * @param {number} guess integer within GUESS_LIMITS
 * @returns {object}
 */
export function submitGuess(state, guess) {
  assertPhase(state, PHASES.GUESS);
  if (!isValidGuess(guess)) {
    throw new RangeError(`Guess must be an integer from ${GUESS_LIMITS.min} to ${GUESS_LIMITS.max}, got ${guess}`);
  }
  const current = state.rounds[state.roundIndex];
  const error = ratioError(guess, current.count);
  const scored = { ...current, guess, error, score: roundScore(error, SCORE_CURVE) };
  const rounds = state.rounds.map((r, i) => (i === state.roundIndex ? scored : r));
  return { ...state, phase: PHASES.ROUND_RESULT, rounds };
}

/**
 * Advance to the next round, or to the summary after the last one.
 * @param {object} state
 * @returns {object}
 */
export function nextRound(state) {
  assertPhase(state, PHASES.ROUND_RESULT);
  if (state.roundIndex + 1 >= state.rounds.length) {
    return { ...state, phase: PHASES.SUMMARY };
  }
  return { ...state, phase: PHASES.READY, roundIndex: state.roundIndex + 1 };
}

/**
 * Whether a value can be submitted as a guess. Lets the UI disable Submit.
 * @param {unknown} guess
 * @returns {boolean}
 */
export function isValidGuess(guess) {
  return Number.isInteger(guess) && guess >= GUESS_LIMITS.min && guess <= GUESS_LIMITS.max;
}

/**
 * The round currently being played (or last played).
 * @param {object} state
 * @returns {object | undefined}
 */
export function currentRound(state) {
  return state.rounds[state.roundIndex];
}

/**
 * Total points scored so far.
 * @param {object} state
 * @returns {number}
 */
export function gameTotal(state) {
  return totalScore(state.rounds.map((r) => r.score));
}

/**
 * Flash duration for the state's difficulty.
 * @param {object} state
 * @returns {number} milliseconds
 */
export function flashMs(state) {
  return DIFFICULTIES[state.difficulty].flashMs;
}

function assertPhase(state, ...allowed) {
  if (!allowed.includes(state.phase)) {
    throw new Error(`Invalid transition from phase "${state.phase}" (expected ${allowed.join(' | ')})`);
  }
}

function assertDifficulty(difficulty) {
  if (!(difficulty in DIFFICULTIES)) {
    throw new Error(`Unknown difficulty "${difficulty}"`);
  }
}
