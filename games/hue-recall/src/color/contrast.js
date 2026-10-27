// Picks readable text ink for a colored background.

import { hsbToLab } from './convert.js';

// Lab lightness above which dark text reads better than light text.
const LIGHTNESS_THRESHOLD = 62;

/**
 * Which ink to draw on top of a color.
 * @param {{h: number, s: number, b: number}} hsb background color
 * @returns {'light' | 'dark'}
 */
export function inkFor(hsb) {
  return hsbToLab(hsb).L > LIGHTNESS_THRESHOLD ? 'dark' : 'light';
}
