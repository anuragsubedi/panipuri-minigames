// Game state and its transitions. Every function is pure: (state, ...) → new state.
// Invalid transitions throw, so wiring bugs surface immediately.

import { ROUND_OPTIONS, TOPICS, DEFAULT_TOPIC, DIFFICULTIES, DEFAULT_DIFFICULTY, SCORE_CURVE } from '../config.js';
import { poolFor, pickPlaces } from '../data/pick-places.js';
import { clueFor } from '../data/clue.js';
import { distanceKm } from '../geo/haversine.js';
import { roundScore, totalScore } from '../../../../shared/js/score.js';

export const PHASES = Object.freeze({
  INTRO: 'intro',
  CLUE: 'clue',
  REVEAL: 'reveal',
  SUMMARY: 'summary',
});

/**
 * Fresh game sitting on the intro screen.
 * @param {{topic?: string, difficulty?: string, roundCount?: number}} [options]
 * @returns {object} game state
 */
export function createGame({ topic = DEFAULT_TOPIC, difficulty = DEFAULT_DIFFICULTY, roundCount = ROUND_OPTIONS[0] } = {}) {
  const options = assertOptions({ topic, difficulty, roundCount });
  return { phase: PHASES.INTRO, ...options, roundIndex: 0, rounds: [] };
}

/**
 * Change topic, difficulty and/or round count; only between games.
 * @param {object} state
 * @param {{topic?: string, difficulty?: string, roundCount?: number}} changes
 * @returns {object}
 */
export function setOptions(state, changes) {
  assertPhase(state, PHASES.INTRO, PHASES.SUMMARY);
  const { topic, difficulty, roundCount } = { ...state, ...changes };
  return { ...state, ...assertOptions({ topic, difficulty, roundCount }) };
}

/**
 * Draw this game's places and begin round 1. Also used for "play again".
 * @param {object} state
 * @param {Record<string, object>} packsById loaded packs, keyed by id
 * @param {() => number} rng float generator in [0, 1)
 * @returns {object}
 */
export function startGame(state, packsById, rng) {
  assertPhase(state, PHASES.INTRO, PHASES.SUMMARY);
  const packs = TOPICS[state.topic].packs.map((id) => {
    if (!packsById[id]) throw new Error(`Pack "${id}" is not loaded`);
    return packsById[id];
  });
  const pool = poolFor(packs, DIFFICULTIES[state.difficulty].tiers);
  const rounds = pickPlaces(pool, state.roundCount, rng).map((place) => ({
    place,
    guess: null,
    distanceKm: null,
    score: null,
  }));
  return { ...state, phase: PHASES.CLUE, roundIndex: 0, rounds };
}

/**
 * Lock in the pin and score the round.
 * @param {object} state
 * @param {{lat: number, lon: number}} guess
 * @returns {object}
 */
export function submitPin(state, guess) {
  assertPhase(state, PHASES.CLUE);
  if (!isValidPin(guess)) throw new RangeError(`Pin must have lat in [-90, 90] and lon in [-180, 180]`);
  const current = state.rounds[state.roundIndex];
  const km = distanceKm(guess, current.place);
  const scored = {
    ...current,
    guess: { lat: guess.lat, lon: guess.lon },
    distanceKm: km,
    score: roundScore(km, { ...SCORE_CURVE, scale: current.place.scaleKm }),
  };
  const rounds = state.rounds.map((r, i) => (i === state.roundIndex ? scored : r));
  return { ...state, phase: PHASES.REVEAL, rounds };
}

/**
 * Advance to the next clue, or to the summary after the last round.
 * @param {object} state
 * @returns {object}
 */
export function nextRound(state) {
  assertPhase(state, PHASES.REVEAL);
  if (state.roundIndex + 1 >= state.rounds.length) return { ...state, phase: PHASES.SUMMARY };
  return { ...state, phase: PHASES.CLUE, roundIndex: state.roundIndex + 1 };
}

/**
 * Whether a value is a usable pin.
 * @param {unknown} pin
 * @returns {boolean}
 */
export function isValidPin(pin) {
  return Math.abs(pin?.lat) <= 90 && Math.abs(pin?.lon) <= 180;
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
 * The clue for the current round at the state's difficulty.
 * @param {object} state
 * @returns {object}
 */
export function currentClue(state) {
  return clueFor(currentRound(state).place, DIFFICULTIES[state.difficulty]);
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
 * Id of the map the state's topic is played on.
 * @param {object} state
 * @param {Record<string, {map: string}>} packsById
 * @returns {string}
 */
export function mapIdFor(state, packsById) {
  return packsById[TOPICS[state.topic].packs[0]].map;
}

function assertPhase(state, ...allowed) {
  if (!allowed.includes(state.phase)) {
    throw new Error(`Invalid transition from phase "${state.phase}" (expected ${allowed.join(' | ')})`);
  }
}

function assertOptions({ topic, difficulty, roundCount }) {
  if (!(topic in TOPICS)) throw new Error(`Unknown topic "${topic}"`);
  if (!(difficulty in DIFFICULTIES)) throw new Error(`Unknown difficulty "${difficulty}"`);
  if (!ROUND_OPTIONS.includes(roundCount)) throw new Error(`Unsupported round count ${roundCount}`);
  return { topic, difficulty, roundCount };
}
