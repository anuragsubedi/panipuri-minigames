import { el, onKey } from '../dom.js';
import { formatPoints } from '../format.js';
import { createSwatch } from '../components/swatch.js';

/**
 * Target vs. guess side by side, with the round's score.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, target: object, guess: object,
 *          score: number, maxScore: number, verdict: string, isLast: boolean}} props
 * @param {{onNext: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderRoundResult(root, props, { onNext }) {
  const { roundNumber, totalRounds, target, guess, score, maxScore, verdict, isLast } = props;

  const screen = el('section', { class: 'screen screen--result' }, [
    el('div', { class: 'result__pair' }, [
      createSwatch({ hsb: target, label: 'Target' }),
      createSwatch({ hsb: guess, label: 'Yours' }),
    ]),
    el('div', { class: 'result__panel' }, [
      el('div', {}, [
        el('p', { class: 'result__verdict', text: `Round ${roundNumber} / ${totalRounds} · ${verdict}` }),
        el('p', { class: 'result__score' }, [
          formatPoints(score),
          el('span', { class: 'result__max', text: ` / ${maxScore}` }),
        ]),
      ]),
      el('button', {
        class: 'btn btn--primary',
        text: isLast ? 'See results' : 'Next color',
        attrs: { type: 'button' },
        on: { click: onNext },
      }),
    ]),
  ]);

  root.append(screen);
  return onKey('Enter', onNext);
}
