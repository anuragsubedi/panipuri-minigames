import { el, onKey } from '../../../../../shared/js/dom.js';
import { formatPoints } from '../../../../../shared/js/format.js';
import { createField } from '../components/field.js';

/**
 * Shows the dots again with the true count, the guess and the score.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, dots: Array<{x: number, y: number}>, radius: number,
 *          count: number, guess: number, percentOff: number, score: number, maxScore: number,
 *          verdict: string, isLast: boolean}} props
 * @param {{onNext: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderRoundResult(root, props, { onNext }) {
  const { roundNumber, totalRounds, dots, radius, count, guess, percentOff, score, maxScore, verdict, isLast } = props;
  const off = Math.round(percentOff);
  const offText = off === 0 ? 'spot on' : `${off > 0 ? '+' : '−'}${Math.abs(off)}%`;

  root.append(
    el('section', { class: 'screen screen--result' }, [
      el('div', { class: 'result__field' }, [createField({ dots, radius, label: `${count} dots` })]),
      el('div', { class: 'result__panel' }, [
        el('div', {}, [
          el('p', { class: 'result__verdict', text: `Round ${roundNumber} / ${totalRounds} · ${verdict}` }),
          el('p', { class: 'result__score' }, [formatPoints(score), el('span', { class: 'result__max', text: ` / ${maxScore}` })]),
          el('p', { class: 'result__detail', text: `${count} dots · you said ${guess} (${offText})` }),
        ]),
        el('button', {
          class: 'btn btn--primary',
          text: isLast ? 'See results' : 'Next round',
          attrs: { type: 'button' },
          on: { click: onNext },
        }),
      ]),
    ]),
  );
  return onKey('Enter', onNext);
}
