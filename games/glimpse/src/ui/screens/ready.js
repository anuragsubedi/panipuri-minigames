import { el } from '../../../../../shared/js/dom.js';
import { createCountdown } from '../../../../../shared/js/components/countdown.js';
import { createRoundBadge } from '../../../../../shared/js/components/round-badge.js';

/**
 * Short pause before the flash so the player is looking at the card.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, durationMs: number}} props
 * @param {{onDone: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderReady(root, { roundNumber, totalRounds, durationMs }, { onDone }) {
  const countdown = createCountdown({ durationMs, caption: 'Eyes on the card…', onDone });
  root.append(
    el('section', { class: 'screen screen--ready' }, [
      el('div', { class: 'screen__meta' }, [createRoundBadge(roundNumber, totalRounds), el('span', { text: 'Get ready' })]),
      countdown.el,
    ]),
  );
  return () => countdown.stop();
}
