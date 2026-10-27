import { el } from '../dom.js';

/**
 * Big seconds counter with a shrinking bar. Starts immediately.
 * @param {{durationMs: number, onDone: () => void}} options
 * @returns {{el: HTMLElement, stop: () => void}}
 */
export function createCountdown({ durationMs, onDone }) {
  const value = el('span', { class: 'countdown__value' });
  const bar = el('div', { class: 'countdown__bar' });
  const node = el('div', { class: 'countdown', attrs: { role: 'timer' } }, [
    value,
    el('span', { class: 'countdown__caption', text: 'seconds to memorize' }),
    el('div', { class: 'countdown__track' }, [bar]),
  ]);

  const end = performance.now() + durationMs;
  let frame = 0;

  function tick(now) {
    const remaining = Math.max(0, end - now);
    value.textContent = (remaining / 1000).toFixed(1);
    bar.style.transform = `scaleX(${remaining / durationMs})`;
    if (remaining === 0) {
      onDone();
      return;
    }
    frame = requestAnimationFrame(tick);
  }

  frame = requestAnimationFrame(tick);
  value.textContent = (durationMs / 1000).toFixed(1);

  return { el: node, stop: () => cancelAnimationFrame(frame) };
}
