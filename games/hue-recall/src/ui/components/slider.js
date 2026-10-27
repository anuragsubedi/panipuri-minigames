import { el } from '../dom.js';

/**
 * Vertical slider, max at the top. Drag anywhere on the track, or use the
 * keyboard: arrows ±1 (Shift ±10), PageUp/PageDown ±10%, Home/End.
 * @param {{label: string, shortLabel: string, min: number, max: number, value: number,
 *          onInput: (value: number) => void}} options
 * @returns {{el: HTMLElement, setTrack: (background: string) => void}}
 */
export function createSlider({ label, shortLabel, min, max, value, onInput }) {
  const thumb = el('div', { class: 'slider__thumb' });
  const track = el('div', { class: 'slider__track' }, [thumb]);
  const root = el(
    'div',
    {
      class: 'slider',
      attrs: {
        role: 'slider',
        tabindex: 0,
        'aria-label': label,
        'aria-orientation': 'vertical',
        'aria-valuemin': min,
        'aria-valuemax': max,
      },
    },
    [track, el('span', { class: 'slider__label', text: shortLabel, attrs: { 'aria-hidden': 'true' } })],
  );

  let current = null;

  function set(next) {
    const clamped = Math.round(Math.min(max, Math.max(min, next)));
    if (clamped === current) return;
    const isInitial = current === null;
    current = clamped;
    root.style.setProperty('--t', String((current - min) / (max - min)));
    root.setAttribute('aria-valuenow', String(current));
    if (!isInitial) onInput(current);
  }

  // Maps a pointer position to a value; the thumb's radius is inset at both
  // ends so the thumb never overflows the track.
  function valueAt(clientY) {
    const rect = track.getBoundingClientRect();
    const inset = thumb.offsetHeight / 2;
    const t = 1 - (clientY - rect.top - inset) / (rect.height - 2 * inset);
    return min + Math.min(1, Math.max(0, t)) * (max - min);
  }

  track.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    track.setPointerCapture(event.pointerId);
    root.focus({ preventScroll: true });
    set(valueAt(event.clientY));
  });

  track.addEventListener('pointermove', (event) => {
    if (track.hasPointerCapture(event.pointerId)) set(valueAt(event.clientY));
  });

  root.addEventListener('keydown', (event) => {
    const step = event.shiftKey ? 10 : 1;
    const page = (max - min) / 10;
    const targets = {
      ArrowUp: current + step,
      ArrowRight: current + step,
      ArrowDown: current - step,
      ArrowLeft: current - step,
      PageUp: current + page,
      PageDown: current - page,
      Home: min,
      End: max,
    };
    if (!(event.key in targets)) return;
    event.preventDefault();
    set(targets[event.key]);
  });

  set(value);

  return {
    el: root,
    setTrack: (background) => {
      track.style.background = background;
    },
  };
}
