// The generator's settings and every way they can change. Pure: (settings, …) → new settings.
// When `linked`, moving one ear moves the other by the same amount, so the beat stays put.

import {
  FREQ_RANGE,
  FREQ_STEP,
  BEAT_MAX,
  DEFAULT_SETTINGS,
  NOISE_TYPES,
  TIMER_OPTIONS,
} from '../config.js';

/** Channel step operations offered as buttons. */
export const CHANNEL_OPS = {
  half: (f) => f / 2,
  minus: (f) => f - 1,
  plus: (f) => f + 1,
  double: (f) => f * 2,
};

/**
 * Settings from defaults plus (possibly untrusted, e.g. stored) overrides, sanitized.
 * @param {object} [overrides]
 * @returns {object}
 */
export function createSettings(overrides = {}) {
  const merged = { ...DEFAULT_SETTINGS, ...overrides };
  return {
    left: clampFreq(Number(merged.left) || DEFAULT_SETTINGS.left),
    right: clampFreq(Number(merged.right) || DEFAULT_SETTINGS.right),
    linked: Boolean(merged.linked),
    volume: clamp(Number(merged.volume), 0, 1, DEFAULT_SETTINGS.volume),
    noise: NOISE_TYPES.includes(merged.noise) ? merged.noise : DEFAULT_SETTINGS.noise,
    timerMin: TIMER_OPTIONS.includes(merged.timerMin) ? merged.timerMin : DEFAULT_SETTINGS.timerMin,
  };
}

/**
 * Set one ear's frequency. When linked, the other ear keeps its offset, and
 * the requested value is limited so both ears stay in range.
 * @param {object} settings
 * @param {'left' | 'right'} side
 * @param {number} freq Hz
 * @returns {object}
 */
export function setChannel(settings, side, freq) {
  if (!settings.linked) {
    return { ...settings, [side]: clampFreq(freq) };
  }
  const other = side === 'left' ? 'right' : 'left';
  const offset = settings[other] - settings[side];
  const lo = Math.max(FREQ_RANGE.min, FREQ_RANGE.min - offset);
  const hi = Math.min(FREQ_RANGE.max, FREQ_RANGE.max - offset);
  const value = round(Math.min(hi, Math.max(lo, freq)));
  return { ...settings, [side]: value, [other]: round(value + offset) };
}

/**
 * Apply a step button (½, −1, +1, ×2) to one ear.
 * @param {object} settings
 * @param {'left' | 'right'} side
 * @param {keyof CHANNEL_OPS} op
 * @returns {object}
 */
export function stepChannel(settings, side, op) {
  return setChannel(settings, side, CHANNEL_OPS[op](settings[side]));
}

/**
 * Beat in Hz: the gap between the ears.
 * @param {object} settings
 * @returns {number}
 */
export function beatOf(settings) {
  return round(Math.abs(settings.right - settings.left));
}

/**
 * Set the beat by moving the right ear relative to the left (keeping which
 * ear is higher). Shifts the left ear if the right would leave the range.
 * @param {object} settings
 * @param {number} beat Hz
 * @returns {object}
 */
export function setBeat(settings, beat) {
  const gap = round(Math.min(BEAT_MAX, Math.max(0, beat)));
  const sign = settings.right >= settings.left ? 1 : -1;
  const right = clampFreq(settings.left + sign * gap);
  const left = clampFreq(right - sign * gap);
  return { ...settings, left, right: round(left + sign * gap) };
}

/**
 * @param {object} settings
 * @param {number} delta Hz
 * @returns {object}
 */
export function nudgeBeat(settings, delta) {
  return setBeat(settings, beatOf(settings) + delta);
}

/** @param {object} settings @returns {object} */
export function toggleLink(settings) {
  return { ...settings, linked: !settings.linked };
}

/**
 * @param {object} settings
 * @param {number} volume 0–1
 * @returns {object}
 */
export function setVolume(settings, volume) {
  return { ...settings, volume: clamp(volume, 0, 1, settings.volume) };
}

/** @param {object} settings @returns {object} next noise type */
export function cycleNoise(settings) {
  return { ...settings, noise: nextOf(NOISE_TYPES, settings.noise) };
}

/** @param {object} settings @returns {object} next timer option */
export function cycleTimer(settings) {
  return { ...settings, timerMin: nextOf(TIMER_OPTIONS, settings.timerMin) };
}

/**
 * @param {object} settings
 * @param {{left: number, beat: number}} preset
 * @returns {object}
 */
export function applyPreset(settings, { left, beat }) {
  const l = clampFreq(left);
  return { ...settings, left: l, right: clampFreq(l + beat) };
}

/**
 * Whether the current tones match a preset.
 * @param {object} settings
 * @param {{left: number, beat: number}} preset
 * @returns {boolean}
 */
export function matchesPreset(settings, { left, beat }) {
  return settings.left === round(left) && settings.right === round(left + beat);
}

function clampFreq(freq) {
  return round(Math.min(FREQ_RANGE.max, Math.max(FREQ_RANGE.min, freq)));
}

// Snap to the 0.1 Hz grid without float noise (e.g. 210.00000000000003).
function round(freq) {
  return Math.round(freq / FREQ_STEP) / Math.round(1 / FREQ_STEP);
}

function clamp(value, min, max, fallback) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}

function nextOf(list, current) {
  return list[(list.indexOf(current) + 1) % list.length];
}
