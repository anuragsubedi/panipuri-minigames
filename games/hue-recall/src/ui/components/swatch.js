import { el } from '../../../../../shared/js/dom.js';
import { hsbToHex } from '../../color/convert.js';
import { inkFor } from '../../color/contrast.js';

/**
 * A block of color with a label and its hex code.
 * @param {{hsb: {h: number, s: number, b: number}, label: string}} options
 * @returns {HTMLElement}
 */
export function createSwatch({ hsb, label }) {
  const hex = hsbToHex(hsb);
  return el('div', { class: 'swatch', style: { background: hex }, dataset: { ink: inkFor(hsb) } }, [
    el('span', { class: 'swatch__label', text: label }),
    el('span', { class: 'swatch__hex', text: hex.toUpperCase() }),
  ]);
}
