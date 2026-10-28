// Human-readable time, rate, mass, speed and distance. Pure.

import { UNITS } from '../config.js';
import { toDays, toSuns, toKms, toAu } from '../sim/units.js';

const YEAR = 365.25;
const MONTH = YEAR / 12;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Elapsed sim time as "12 d", "4 mo 12 d", "3 yr 4 mo" or "152 yr".
 * @param {number} t sim time
 * @returns {string}
 */
export function formatElapsed(t) {
  const days = Math.max(0, toDays(t));
  if (days < MONTH) return `${Math.floor(days)} d`;
  if (days < YEAR) {
    const mo = Math.floor(days / MONTH);
    return `${mo} mo ${Math.floor(days - mo * MONTH)} d`;
  }
  const yr = Math.floor(days / YEAR);
  if (yr >= 100) return `${yr} yr`;
  return `${yr} yr ${Math.floor((days - yr * YEAR) / MONTH)} mo`;
}

/**
 * Calendar date `t` after an epoch, e.g. "14 Mar 2003" (UTC, no locale).
 * @param {number} epochMs epoch as a UTC timestamp
 * @param {number} t sim time
 * @returns {string}
 */
export function formatDate(epochMs, t) {
  const d = new Date(epochMs + toDays(t) * 86_400_000);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/**
 * How much sim time one real second covers, e.g. "1 s ≈ 5 weeks".
 * @param {number} simPerSecond sim time per real second
 * @returns {string}
 */
export function formatRate(simPerSecond) {
  const days = toDays(simPerSecond);
  const round = (n) => (n < 10 ? Math.round(n * 10) / 10 : Math.round(n));
  const plural = (n, unit) => `${round(n)} ${unit}${round(n) === 1 ? '' : 's'}`;
  let text;
  if (days < 1) text = plural(days * 24, 'hour');
  else if (days < 14) text = plural(days, 'day');
  else if (days < 2 * MONTH) text = plural(days / 7, 'week');
  else if (days < YEAR) text = plural(days / MONTH, 'month');
  else text = plural(days / YEAR, 'year');
  return `1 s ≈ ${text}`;
}

/**
 * Mass in the friendliest real unit: Suns for stars, Jupiters for big
 * bodies, Earths for small ones.
 * @param {number} m sim mass
 * @param {boolean} star
 * @returns {{value: string, unit: string}}
 */
export function formatMass(m, star) {
  const suns = toSuns(m);
  const jupiters = suns * UNITS.jupitersPerSun;
  if (star || jupiters >= 80) return massOf(suns, 'Sun');
  if (jupiters >= 0.1) return massOf(jupiters, 'Jupiter');
  return massOf(suns * UNITS.earthsPerSun, 'Earth');
}

function massOf(n, unit) {
  const value = sig(n);
  return { value, unit: value === '1' ? unit : `${unit}s` };
}

/**
 * @param {number} v sim speed
 * @returns {string} km/s, e.g. "29.8"
 */
export function formatSpeed(v) {
  return sig(toKms(v));
}

/**
 * @param {number} d sim distance
 * @returns {string} AU, e.g. "1.02"
 */
export function formatDistance(d) {
  return sig(toAu(d));
}

// Three significant figures, no exponent, no trailing ".0".
function sig(n) {
  if (n === 0) return '0';
  if (n >= 1000) return String(Math.round(n));
  return String(Number(n.toPrecision(3)));
}
