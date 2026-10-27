import { el } from '../../../../../shared/js/dom.js';
import { hsbToHex } from '../../color/convert.js';
import { inkFor } from '../../color/contrast.js';
import { createCountdown } from '../../../../../shared/js/components/countdown.js';
import { createRoundBadge } from '../../../../../shared/js/components/round-badge.js';

/**
 * Shows the target color while a countdown runs.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, target: object, durationMs: number}} props
 * @param {{onDone: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderMemorize(root, { roundNumber, totalRounds, target, durationMs }, { onDone }) {
  const countdown = createCountdown({ durationMs, caption: 'seconds to memorize', onDone });

  const screen = el(
    'section',
    { class: 'screen screen--memorize', style: { background: hsbToHex(target) }, dataset: { ink: inkFor(target) } },
    [
      el('div', { class: 'screen__meta' }, [createRoundBadge(roundNumber, totalRounds), el('span', { text: 'Memorize' })]),
      countdown.el,
    ],
  );

  root.append(screen);
  return () => countdown.stop();
}
