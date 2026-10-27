import { el } from '../../../../../shared/js/dom.js';
import { createField } from '../components/field.js';

/**
 * Shows the dots for durationMs, then calls onDone.
 * @param {HTMLElement} root
 * @param {{dots: Array<{x: number, y: number}>, radius: number, durationMs: number}} props
 * @param {{onDone: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderFlash(root, { dots, radius, durationMs }, { onDone }) {
  root.append(el('section', { class: 'screen screen--flash' }, [createField({ dots, radius })]));
  const timer = setTimeout(onDone, durationMs);
  return () => clearTimeout(timer);
}
