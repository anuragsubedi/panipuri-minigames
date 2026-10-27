import { el, onKey } from '../../../../../shared/js/dom.js';
import { hsbToHex } from '../../color/convert.js';
import { inkFor } from '../../color/contrast.js';
import { channelStops } from '../../color/gradient.js';
import { createSlider } from '../components/slider.js';
import { createRoundBadge } from '../../../../../shared/js/components/round-badge.js';

// Hue needs many stops to show the full wheel; S and B are near-linear.
const CHANNELS = [
  { key: 'h', label: 'Hue', shortLabel: 'H', stops: 13 },
  { key: 's', label: 'Saturation', shortLabel: 'S', stops: 6 },
  { key: 'b', label: 'Brightness', shortLabel: 'B', stops: 6 },
];

/**
 * Player rebuilds the color with H/S/B sliders; the card previews the guess.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, start: object, ranges: object}} props
 * @param {{onSubmit: (guess: {h: number, s: number, b: number}) => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderRecreate(root, { roundNumber, totalRounds, start, ranges }, { onSubmit }) {
  const guess = { ...start };
  const screen = el('section', { class: 'screen screen--recreate' });

  const sliders = CHANNELS.map((channel) => ({
    ...channel,
    slider: createSlider({
      label: channel.label,
      shortLabel: channel.shortLabel,
      min: ranges[channel.key][0],
      max: ranges[channel.key][1],
      value: guess[channel.key],
      onInput: (value) => {
        guess[channel.key] = value;
        paint();
      },
    }),
  }));

  const submit = () => onSubmit({ ...guess });

  // Repaints the card, the thumbs and every track to reflect the current guess.
  function paint() {
    const hex = hsbToHex(guess);
    screen.style.background = hex;
    screen.style.setProperty('--thumb-fill', hex);
    screen.dataset.ink = inkFor(guess);
    for (const { key, stops, slider } of sliders) {
      slider.setTrack(`linear-gradient(to top, ${channelStops(key, guess, ranges[key], stops).join(', ')})`);
    }
  }

  screen.append(
    el('div', { class: 'recreate__main' }, [
      el('div', {}, [
        el('div', { class: 'screen__meta' }, [createRoundBadge(roundNumber, totalRounds)]),
        el('h2', { class: 'recreate__prompt', text: 'Now rebuild it from memory.' }),
      ]),
      el('button', { class: 'btn btn--float', text: 'Lock it in', attrs: { type: 'button' }, on: { click: submit } }),
    ]),
    el('div', { class: 'sliders' }, sliders.map((s) => s.slider.el)),
  );

  paint();
  root.append(screen);
  sliders[0].slider.el.focus({ preventScroll: true });
  return onKey('Enter', submit);
}
