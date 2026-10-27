import { el, onKey } from '../../../../../shared/js/dom.js';
import { formatPoints } from '../../../../../shared/js/format.js';
import { createWorldMap } from '../components/world-map.js';

/**
 * The answer: your pin, the real spot, the line between, distance and points.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, answer: string, guess: object, target: object,
 *          distance: string, direction: string, score: number, maxScore: number, verdict: string,
 *          isLast: boolean, map: object, mapView: object, gridStep: number}} props
 * @param {{onNext: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderReveal(root, props, { onNext }) {
  const { roundNumber, totalRounds, answer, guess, target, distance, direction, score, maxScore, verdict, isLast } = props;
  const worldMap = createWorldMap({ map: props.map, view: props.mapView, gridStep: props.gridStep, label: `Map showing ${answer}` });
  worldMap.showResults([{ guess, target }]);
  worldMap.frame([guess, target]);

  root.append(
    el('section', { class: 'screen screen--play screen--reveal' }, [
      el('div', { class: 'reveal__answer' }, [
        el('p', { class: 'result__verdict', text: `Round ${roundNumber} / ${totalRounds} · ${verdict}` }),
        el('p', { class: 'clue__text', text: answer }),
      ]),
      worldMap.element,
      el('div', { class: 'reveal__panel' }, [
        el('div', {}, [
          el('p', { class: 'result__score' }, [formatPoints(score), el('span', { class: 'result__max', text: ` / ${maxScore}` })]),
          el('p', { class: 'reveal__detail', text: `${distance} away · ${direction}` }),
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

  const stopKey = onKey('Enter', onNext);
  return () => {
    stopKey();
    worldMap.destroy();
  };
}
