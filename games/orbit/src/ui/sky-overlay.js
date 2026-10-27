// Everything drawn over the canvas in HTML: body count, paused badge, the
// first-launch hint, and the inspector card for the selected body.

import { el } from '../../../../shared/js/dom.js';
import { icon } from './icons.js';

/**
 * @param {{onResume: () => void, onDelete: () => void, onDeselect: () => void}} handlers
 * @returns {{el: HTMLElement, update: (view: object) => void}}
 */
export function createSkyOverlay({ onResume, onDelete, onDeselect }) {
  const count = el('span', { class: 'sky__count', attrs: { 'aria-live': 'polite' } });
  const paused = el('button', { class: 'sky__paused', text: 'Paused', attrs: { type: 'button', 'aria-label': 'Paused. Resume' }, on: { click: onResume } });

  const hintIcon = el('span', { class: 'hint__icon', attrs: { 'aria-hidden': 'true' } });
  hintIcon.innerHTML = icon('fling');
  const hintText = el('span', { class: 'hint__text' });
  const hint = el('p', { class: 'hint' }, [hintIcon, hintText]);

  const swatch = el('span', { class: 'inspector__swatch', attrs: { 'aria-hidden': 'true' } });
  const name = el('h2', { class: 'inspector__name' });
  const mass = el('dd');
  const speed = el('dd');
  const remove = el('button', { class: 'inspector__delete', attrs: { type: 'button' }, on: { click: onDelete } });
  remove.innerHTML = `${icon('trash')}<span>Delete</span>`;
  const close = el('button', { class: 'inspector__close', attrs: { type: 'button', 'aria-label': 'Close' }, on: { click: onDeselect } });
  close.innerHTML = icon('close');
  const inspector = el('section', { class: 'inspector', attrs: { 'aria-label': 'Selected body' } }, [
    el('div', { class: 'inspector__head' }, [swatch, name, remove, close]),
    el('dl', { class: 'inspector__stats' }, [
      el('div', {}, [el('dt', { text: 'Mass' }), mass]),
      el('div', {}, [el('dt', { text: 'Speed' }), speed]),
    ]),
  ]);

  const root = el('div', { class: 'sky__overlay' }, [el('div', { class: 'sky__top' }, [count, paused]), hint, inspector]);
  const text = (node, value) => {
    if (node.textContent !== value) node.textContent = value;
  };

  return {
    el: root,
    /**
     * @param {{count: number, paused: boolean, hint: string | null,
     *          selected: {name: string, mass: string, speed: string, slot: number, star: boolean} | null}} view
     */
    update(view) {
      text(count, `${view.count} ${view.count === 1 ? 'body' : 'bodies'}`);
      paused.hidden = !view.paused;
      hint.hidden = !view.hint;
      if (view.hint) text(hintText, view.hint);
      inspector.hidden = !view.selected;
      if (view.selected) {
        text(name, view.selected.name);
        text(mass, view.selected.mass);
        text(speed, view.selected.speed);
        swatch.dataset.slot = view.selected.star ? 'star' : String(view.selected.slot);
        remove.setAttribute('aria-label', `Delete ${view.selected.name}`);
      }
    },
  };
}
