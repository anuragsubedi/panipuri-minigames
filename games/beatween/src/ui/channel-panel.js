import { el } from '../../../../shared/js/dom.js';
import { freqToSlider, sliderToFreq } from '../tone/scale.js';

const SLIDER_STEPS = 1000;

const OPS = [
  { op: 'half', text: '½', label: 'Halve' },
  { op: 'minus', text: '−1', label: 'Lower by 1 Hz' },
  { op: 'plus', text: '+1', label: 'Raise by 1 Hz' },
  { op: 'double', text: '×2', label: 'Double' },
];

/**
 * Controls for one ear: typed frequency, log slider, and ½ / −1 / +1 / ×2 steps.
 * @param {{side: 'left' | 'right', range: {min: number, max: number},
 *          onSet: (freq: number) => void, onStep: (op: string) => void}} options
 * @returns {{el: HTMLElement, update: (freq: number) => void}}
 */
export function createChannelPanel({ side, range, onSet, onStep }) {
  const ear = side === 'left' ? 'Left' : 'Right';
  const id = `freq-${side}`;

  const input = el('input', {
    class: 'channel__input',
    attrs: { id, type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': `${ear} ear frequency in hertz` },
    on: {
      change: commitTyped,
      // Show the stored (rounded, clamped) value once editing ends.
      blur: () => {
        input.value = input.dataset.value;
      },
      keydown: (event) => {
        if (event.key === 'Enter') input.blur();
      },
    },
  });
  const slider = el('input', {
    class: 'range',
    attrs: { id: `${id}-slider`, type: 'range', min: 0, max: SLIDER_STEPS, step: 1, 'aria-label': `${ear} ear frequency` },
    on: { input: () => onSet(sliderToFreq(slider.valueAsNumber / SLIDER_STEPS, range)) },
  });

  function commitTyped() {
    const value = Number.parseFloat(input.value.replace(',', '.'));
    if (Number.isFinite(value)) onSet(value);
    else input.value = input.dataset.value;
  }

  const ops = OPS.map(({ op, text, label }) =>
    el('button', {
      class: 'op',
      text,
      attrs: { type: 'button', 'aria-label': `${label} the ${side} ear` },
      on: { click: () => onStep(op) },
    }),
  );

  const root = el('div', { class: `channel channel--${side}` }, [
    el('div', { class: 'channel__head' }, [
      el('span', { class: 'channel__badge', text: side === 'left' ? 'L' : 'R', attrs: { 'aria-hidden': 'true' } }),
      el('label', { class: 'channel__name', text: `${ear} ear`, attrs: { for: id } }),
    ]),
    el('div', { class: 'channel__freq' }, [input, el('span', { class: 'channel__unit', text: 'Hz' })]),
    slider,
    el('div', { class: 'channel__ops' }, ops),
  ]);

  return {
    el: root,
    update(freq) {
      input.dataset.value = freq.toFixed(1);
      // Don't overwrite what the user is typing.
      if (document.activeElement !== input) input.value = input.dataset.value;
      const t = freqToSlider(freq, range);
      if (document.activeElement !== slider) slider.value = String(Math.round(t * SLIDER_STEPS));
      slider.style.setProperty('--fill', `${(t * 100).toFixed(2)}%`);
    },
  };
}
