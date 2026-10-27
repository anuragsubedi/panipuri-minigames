import { el, onKey } from '../../../../../shared/js/dom.js';
import { formatPoints } from '../../../../../shared/js/format.js';

/**
 * End-of-game recap: total, and every round's count vs. guess.
 * @param {HTMLElement} root
 * @param {{rounds: Array<{count: number, guess: number, score: number, verdict: string}>,
 *          total: number, maxTotal: number, verdict: string, difficultyLabel: string}} props
 * @param {{onPlayAgain: () => void, onMenu: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderSummary(root, { rounds, total, maxTotal, verdict, difficultyLabel }, { onPlayAgain, onMenu }) {
  const rows = rounds.map((round, i) =>
    el('li', { class: 'summary__row' }, [
      el('span', { class: 'summary__count', text: round.count, attrs: { 'aria-label': `${round.count} dots` } }),
      el('div', {}, [
        el('p', { class: 'summary__label', text: `Round ${i + 1} · you said ${round.guess}` }),
        el('p', { class: 'summary__sub', text: round.verdict }),
      ]),
      el('span', { class: 'summary__points', text: formatPoints(round.score) }),
    ]),
  );

  root.append(
    el('section', { class: 'screen screen--summary' }, [
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
    ]),
  );
  return onKey('Enter', onPlayAgain);
}
