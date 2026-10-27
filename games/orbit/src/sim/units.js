// Sim units ↔ real units. Pure conversions; formatting lives in view/format.js.

import { UNITS } from '../config.js';

/** Days in one sim time unit (≈ 1.838). */
export const DAYS_PER_UNIT = Math.sqrt(UNITS.auPerUnit ** 3 / UNITS.sunsPerUnit) / UNITS.gaussK;

/** km/s for one sim speed unit (≈ 9.42). */
export const KMS_PER_UNIT = (UNITS.auPerUnit * UNITS.kmPerAu) / (DAYS_PER_UNIT * 86_400);

/**
 * @param {number} t sim time
 * @returns {number} days
 */
export function toDays(t) {
  return t * DAYS_PER_UNIT;
}

/**
 * @param {number} days
 * @returns {number} sim time
 */
export function fromDays(days) {
  return days / DAYS_PER_UNIT;
}

/**
 * @param {number} d sim distance
 * @returns {number} AU
 */
export function toAu(d) {
  return d * UNITS.auPerUnit;
}

/**
 * @param {number} au
 * @returns {number} sim distance
 */
export function fromAu(au) {
  return au / UNITS.auPerUnit;
}

/**
 * @param {number} v sim speed
 * @returns {number} km/s
 */
export function toKms(v) {
  return v * KMS_PER_UNIT;
}

/**
 * @param {number} m sim mass
 * @returns {number} solar masses
 */
export function toSuns(m) {
  return m * UNITS.sunsPerUnit;
}

/**
 * @param {number} suns solar masses
 * @returns {number} sim mass
 */
export function fromSuns(suns) {
  return suns / UNITS.sunsPerUnit;
}
