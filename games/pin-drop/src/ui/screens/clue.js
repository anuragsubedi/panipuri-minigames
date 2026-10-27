import { el, onKey } from '../../../../../shared/js/dom.js';
import { formatPoints } from '../../../../../shared/js/format.js';
import { createRoundBadge } from '../../../../../shared/js/components/round-badge.js';
import { createClue } from '../components/clue.js';
import { createWorldMap } from '../components/world-map.js';

/**
 * A round in play: the clue, the map, and "Lock it in" once a pin is down.
 * The pin lives here until it's locked in, so dragging doesn't touch game state.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, total: number, clue: object,
 *          map: object, mapView: object, gridStep: number}} props
 * @param {{onSubmit: (pin: {lat: number, lon: number}) => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderClue(root, props, { onSubmit }) {
  const { roundNumber, totalRounds, total, clue, map, mapView, gridStep } = props;
  let pin = null;

  const hint = el('p', { class: 'play__hint', text: 'Tap the map to drop your pin' });
  const submit = el('button', {
    class: 'btn btn--primary',
    text: 'Lock it in',
    attrs: { type: 'button', disabled: '' },
    on: { click: () => pin && onSubmit(pin) },
  });
  const worldMap = createWorldMap({
    map,
    view: mapView,
    gridStep,
    interactive: true,
    label: 'World map. Tap to drop your pin.',
    onPin: (latLon) => {
      pin = latLon;
      submit.disabled = false;
      hint.textContent = 'Drag the pin to adjust, then lock it in';
    },
  });

  root.append(
    el('section', { class: 'screen screen--play' }, [
      el('div', { class: 'screen__meta' }, [
        createRoundBadge(roundNumber, totalRounds),
        el('span', { class: 'play__total', text: `${formatPoints(total)} pts` }),
      ]),
      createClue(clue),
      worldMap.element,
      el('div', { class: 'play__footer' }, [hint, submit]),
    ]),
  );

  const stopKey = onKey('Enter', () => pin && onSubmit(pin));
  return () => {
    stopKey();
    worldMap.destroy();
  };
}
