import { el, onKey } from '../dom.js';
import { hsbToHex } from '../../color/convert.js';
import { formatPoints } from '../format.js';

/**
 * End-of-game recap: total, every round's pair and score.
 * @param {HTMLElement} root
 * @param {{rounds: Array<{target: object, guess: object, score: number, verdict: string}>,
 *          total: number, maxTotal: number, verdict: string, difficultyLabel: string}} props
 * @param {{onPlayAgain: () => void, onMenu: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderSummary(root, { rounds, total, maxTotal, verdict, difficultyLabel }, { onPlayAgain, onMenu }) {
  const rows = rounds.map((round, i) =>
    el('li', { class: 'summary__row' }, [
      el('span', { class: 'chip-pair', attrs: { 'aria-hidden': 'true' } }, [
        el('span', { class: 'chip', style: { background: hsbToHex(round.target) } }),
        el('span', { class: 'chip', style: { background: hsbToHex(round.guess) } }),
      ]),
      el('div', {}, [
        el('p', { class: 'summary__label', text: `Round ${i + 1}` }),
        el('p', { class: 'summary__sub', text: round.verdict }),
      ]),
      el('span', { class: 'summary__points', text: formatPoints(round.score) }),
    ]),
  );

  const screen = el('section', { class: 'screen screen--summary' }, [
    el('div', { class: 'summary__head' }, [
      el('div', { class: 'screen__meta' }, [el('span', { class: 'round-badge', text: difficultyLabel }), el('span', { text: 'Final score' })]),
      el('p', { class: 'result__verdict', text: verdict }),
      el('p', { class: 'result__score' }, [formatPoints(total), el('span', { class: 'result__max', text: ` / ${maxTotal}` })]),
    ]),
    el('ol', { class: 'summary__list' }, rows),
    el('div', { class: 'summary__actions' }, [
      el('button', { class: 'btn btn--ghost', text: 'Menu', attrs: { type: 'button' }, on: { click: onMenu } }),
      el('button', { class: 'btn btn--primary', text: 'Play again', attrs: { type: 'button' }, on: { click: onPlayAgain } }),
    ]),
  ]);

  root.append(screen);
  return onKey('Enter', onPlayAgain);
}
