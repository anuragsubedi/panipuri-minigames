// Color stops for slider tracks.

import { hsbToHex } from './convert.js';

/**
 * Evenly spaced hex stops showing one channel swept across its range while
 * the other channels stay fixed. First stop = range min.
 * @param {'h' | 's' | 'b'} channel channel to sweep
 * @param {{h: number, s: number, b: number}} hsb current color
 * @param {[number, number]} range [min, max] for the channel
 * @param {number} count number of stops (≥ 2)
 * @returns {string[]}
 */
export function channelStops(channel, hsb, [min, max], count) {
  return Array.from({ length: count }, (_, i) =>
    hsbToHex({ ...hsb, [channel]: min + ((max - min) * i) / (count - 1) }),
  );
}
