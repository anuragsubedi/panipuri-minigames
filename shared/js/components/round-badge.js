import { el } from '../dom.js';

/**
 * "Round 2 / 5" pill.
 * @param {number} roundNumber 1-based
 * @param {number} totalRounds
 * @returns {HTMLElement}
 */
export function createRoundBadge(roundNumber, totalRounds) {
  return el('span', { class: 'round-badge', text: `Round ${roundNumber} / ${totalRounds}` });
}
