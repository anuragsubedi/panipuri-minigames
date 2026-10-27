// Words for the reveal: "1,240 km" and "It's north-east of your pin".

import { bearingDeg, compassPoint } from './haversine.js';

/** Closer than this, direction words are noise. */
const ON_TARGET_KM = 25;

/**
 * Distance for display, e.g. 0.4 → "< 1 km", 1239.6 → "1,240 km".
 * @param {number} km
 * @returns {string}
 */
export function formatKm(km) {
  if (km < 1) return '< 1 km';
  return `${Math.round(km).toLocaleString('en-US')} km`;
}

/**
 * Where the answer lies relative to the pin.
 * @param {{lat: number, lon: number}} guess
 * @param {{lat: number, lon: number}} target
 * @param {number} km distance between them
 * @returns {string}
 */
export function directionHint(guess, target, km) {
  if (km < ON_TARGET_KM) return 'Right on it';
  return `It's ${compassPoint(bearingDeg(guess, target))} of your pin`;
}
