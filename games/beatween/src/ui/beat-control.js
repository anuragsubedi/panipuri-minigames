import { el } from '../../../../shared/js/dom.js';
import { icon } from './icons.js';

/**
 * The beat readout with − / + nudges (moves the right ear relative to the left).
 * @param {{step: number, onNudge: (delta: number) => void}} options
 * @returns {{el: HTMLElement, update: (beat: number) => void}}
 */
export function createBeatControl({ step, onNudge }) {
  const nudge = (delta, label, name) => {
    const button = el('button', {
      class: 'beat__btn',
      attrs: { type: 'button', 'aria-label': label },
      on: { click: () => onNudge(delta) },
    });
    button.innerHTML = icon(name);
    return button;
  };
  const value = el('output', { class: 'beat__value', attrs: { 'aria-live': 'polite' } });
  const root = el('div', { class: 'beat' }, [
    nudge(-step, `Lower the beat by ${step} Hz`, 'minus'),
    el('div', { class: 'beat__readout' }, [value, el('span', { class: 'beat__unit', text: 'Hz beat' })]),
    nudge(step, `Raise the beat by ${step} Hz`, 'plus'),
  ]);

  return {
    el: root,
    update(beat) {
      value.textContent = beat.toFixed(1);
    },
  };
}
