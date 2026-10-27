import { el, onKey } from '../../../../../shared/js/dom.js';
import { formatPoints } from '../../../../../shared/js/format.js';
import { createWorldMap } from '../components/world-map.js';

/**
 * End-of-game recap: total, every pin pair on one map, and a row per round.
 * @param {HTMLElement} root
 * @param {{rounds: Array<{answer: string, guess: object, target: object, distance: string, score: number, verdict: string}>,
 *          total: number, maxTotal: number, verdict: string, optionsLabel: string,
 *          map: object, mapView: object, gridStep: number}} props
 * @param {{onPlayAgain: () => void, onMenu: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderSummary(root, props, { onPlayAgain, onMenu }) {
  const { rounds, total, maxTotal, verdict, optionsLabel } = props;
  const worldMap = createWorldMap({ map: props.map, view: props.mapView, gridStep: props.gridStep, label: 'Map of all your pins' });
  worldMap.showResults(rounds.map((r, i) => ({ guess: r.guess, target: r.target, label: String(i + 1) })));
  worldMap.frame(rounds.flatMap((r) => [r.guess, r.target]));

  const rows = rounds.map((round, i) =>
    el('li', { class: 'summary__row' }, [
      el('span', { class: 'summary__index', text: i + 1 }),
      el('div', {}, [
        el('p', { class: 'summary__label', text: round.answer }),
        el('p', { class: 'summary__sub', text: `${round.distance} · ${round.verdict}` }),
      ]),
      el('span', { class: 'summary__points', text: formatPoints(round.score) }),
    ]),
  );

  root.append(
    el('section', { class: 'screen screen--summary' }, [
      el('div', { class: 'summary__head' }, [
        el('div', { class: 'screen__meta' }, [el('span', { class: 'round-badge', text: optionsLabel }), el('span', { text: 'Final score' })]),
        el('div', { class: 'summary__score' }, [
          el('p', { class: 'result__score' }, [formatPoints(total), el('span', { class: 'result__max', text: ` / ${maxTotal}` })]),
          el('p', { class: 'result__verdict', text: verdict }),
        ]),
      ]),
      worldMap.element,
      el('ol', { class: 'summary__list' }, rows),
      el('div', { class: 'summary__actions' }, [
        el('button', { class: 'btn btn--ghost', text: 'Menu', attrs: { type: 'button' }, on: { click: onMenu } }),
        el('button', { class: 'btn btn--primary', text: 'Play again', attrs: { type: 'button' }, on: { click: onPlayAgain } }),
      ]),
    ]),
  );

  const stopKey = onKey('Enter', onPlayAgain);
  return () => {
    stopKey();
    worldMap.destroy();
  };
}
