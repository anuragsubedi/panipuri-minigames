// Game state and its transitions. Every function is pure: (state, ...) → new state.
// Invalid transitions throw, so wiring bugs surface immediately.

import { ROUNDS, DIFFICULTIES, DEFAULT_DIFFICULTY, TARGET_RANGES, SCORE_CURVE } from '../config.js';
import { randomHsb } from '../color/random.js';
import { hsbToLab } from '../color/convert.js';
import { deltaE2000 } from '../color/distance.js';
import { roundScore, totalScore } from '../../../../shared/js/score.js';

export const PHASES = Object.freeze({
  INTRO: 'intro',
  MEMORIZE: 'memorize',
  RECREATE: 'recreate',
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
 * Generate all targets and begin round 1. Also used for "play again".
 * @param {object} state
 * @param {() => number} rng float generator in [0, 1)
 * @returns {object}
 */
export function startGame(state, rng) {
  assertPhase(state, PHASES.INTRO, PHASES.SUMMARY);
  const rounds = Array.from({ length: ROUNDS }, () => ({
    target: randomHsb(rng, TARGET_RANGES),
    guess: null,
    deltaE: null,
    score: null,
  }));
  return { ...state, phase: PHASES.MEMORIZE, roundIndex: 0, rounds };
}

/**
 * Memorize time is over; hide the target.
 * @param {object} state
 * @returns {object}
 */
export function endMemorize(state) {
  assertPhase(state, PHASES.MEMORIZE);
  return { ...state, phase: PHASES.RECREATE };
}

/**
 * Lock in the player's guess and score the round.
 * @param {object} state
 * @param {{h: number, s: number, b: number}} guess
 * @returns {object}
 */
export function submitGuess(state, guess) {
  assertPhase(state, PHASES.RECREATE);
  const current = state.rounds[state.roundIndex];
  const deltaE = deltaE2000(hsbToLab(current.target), hsbToLab(guess));
  const scored = { ...current, guess: { ...guess }, deltaE, score: roundScore(deltaE, SCORE_CURVE) };
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
  return { ...state, phase: PHASES.MEMORIZE, roundIndex: state.roundIndex + 1 };
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
 * Memorize duration for the state's difficulty.
 * @param {object} state
 * @returns {number} milliseconds
 */
export function memorizeMs(state) {
  return DIFFICULTIES[state.difficulty].memorizeMs;
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
