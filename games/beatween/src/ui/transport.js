import { el } from '../../../../shared/js/dom.js';
import { icon } from './icons.js';

const NOISE_LABELS = { off: 'Off', pink: 'Pink', brown: 'Brown' };

/**
 * Play/pause, volume, session timer and background noise.
 * @param {{onTogglePlay: () => void, onVolume: (v: number) => void,
 *          onCycleTimer: () => void, onCycleNoise: () => void}} handlers
 * @returns {{el: HTMLElement, update: (view: object) => void}}
 */
export function createTransport({ onTogglePlay, onVolume, onCycleTimer, onCycleNoise }) {
  const play = el('button', { class: 'play', attrs: { type: 'button' }, on: { click: onTogglePlay } });
  const volume = el('input', {
    class: 'range',
    attrs: { id: 'volume', type: 'range', min: 0, max: 100, step: 1, 'aria-label': 'Volume' },
    on: { input: () => onVolume(volume.valueAsNumber / 100) },
  });
  const volumeIcon = el('span', { class: 'transport__icon', attrs: { 'aria-hidden': 'true' } });
  volumeIcon.innerHTML = icon('volume');

  const chip = (caption, onClick) => {
    const value = el('span', { class: 'chip__value' });
    const button = el('button', { class: 'chip', attrs: { type: 'button' }, on: { click: onClick } }, [
      el('span', { class: 'chip__caption', text: caption }),
      value,
    ]);
    return { button, value };
  };
  const timer = chip('Timer', onCycleTimer);
  const noise = chip('Noise', onCycleNoise);

  const root = el('div', { class: 'transport' }, [
    play,
    el('label', { class: 'transport__volume', attrs: { for: 'volume' } }, [volumeIcon, volume]),
    timer.button,
    noise.button,
  ]);

  let playing = null;

  return {
    el: root,
    /** @param {{playing: boolean, volume: number, timerMin: number, remainingMs: number | null, noise: string}} view */
    update(view) {
      if (view.playing !== playing) {
        playing = view.playing;
        play.innerHTML = icon(playing ? 'pause' : 'play');
        play.setAttribute('aria-label', playing ? 'Pause' : 'Play');
      }
      if (document.activeElement !== volume) volume.value = String(Math.round(view.volume * 100));
      volume.style.setProperty('--fill', `${view.volume * 100}%`);
      timer.value.textContent = view.remainingMs != null ? formatClock(view.remainingMs) : view.timerMin ? `${view.timerMin} min` : 'Off';
      timer.button.setAttribute('aria-label', `Session timer: ${timer.value.textContent}. Change`);
      noise.value.textContent = NOISE_LABELS[view.noise];
      noise.button.setAttribute('aria-label', `Background noise: ${NOISE_LABELS[view.noise]}. Change`);
    },
  };
}

function formatClock(ms) {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}
