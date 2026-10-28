// Everything drawn over the canvas in HTML: the clock, the body count (which
// opens a list of the heaviest bodies), zoom buttons, the paused badge, the
// hint, and the inspector card for the selected body.

import { el } from '../../../../shared/js/dom.js';
import { icon } from './icons.js';

const LIST_SIZE = 10;

/**
 * @param {{onResume: () => void, onDelete: () => void, onDeselect: () => void,
 *          onSelect: (id: number) => void, onToggleList: () => void, onZoom: (steps: number) => void}} handlers
 *   onZoom: -1 zooms in one step, +1 zooms out
 * @returns {{el: HTMLElement, update: (view: object) => void}}
 */
export function createSkyOverlay({ onResume, onDelete, onDeselect, onSelect, onToggleList, onZoom }) {
  const clock = el('span', { class: 'clock__time' });
  const rate = el('span', { class: 'clock__rate' });
  const clockBox = el('div', { class: 'clock', attrs: { role: 'timer', 'aria-live': 'off' } }, [clock, rate]);

  const countText = el('span');
  const count = el('button', { class: 'sky__count', attrs: { type: 'button', 'aria-expanded': 'false' }, on: { click: onToggleList } }, [countText]);
  count.insertAdjacentHTML('beforeend', icon('chevron'));
  const paused = el('button', { class: 'sky__paused', text: 'Paused', attrs: { type: 'button', 'aria-label': 'Paused. Resume' }, on: { click: onResume } });

  const rows = el('ol', { class: 'bodies__rows' });
  const list = el('section', { class: 'bodies', attrs: { 'aria-label': 'Heaviest bodies' } }, [
    el('h2', { class: 'bodies__title', text: 'Heaviest bodies' }),
    rows,
  ]);

  const zoomButton = (name, label, steps) => {
    const b = el('button', { class: 'zoom__btn', attrs: { type: 'button', 'aria-label': label, title: label }, on: { click: () => onZoom(steps) } });
    b.innerHTML = icon(name);
    return b;
  };
  const zoom = el('div', { class: 'zoom' }, [zoomButton('plus', 'Zoom in', -1), zoomButton('minus', 'Zoom out', 1)]);

  const hintIcon = el('span', { class: 'hint__icon', attrs: { 'aria-hidden': 'true' } });
  const hintText = el('span', { class: 'hint__text' });
  const hint = el('p', { class: 'hint' }, [hintIcon, hintText]);

  const swatch = el('span', { class: 'swatch', attrs: { 'aria-hidden': 'true' } });
  const name = el('h2', { class: 'inspector__name' });
  const stat = (label) => {
    const value = el('span');
    const unit = el('span', { class: 'inspector__unit' });
    return { value, unit, el: el('div', {}, [el('dt', { text: label }), el('dd', {}, [value, unit])]) };
  };
  const mass = stat('Mass');
  const speed = stat('Speed');
  const distance = stat('From star');
  const remove = el('button', { class: 'inspector__delete', attrs: { type: 'button' }, on: { click: onDelete } });
  remove.innerHTML = `${icon('trash')}<span>Delete</span>`;
  const close = el('button', { class: 'inspector__close', attrs: { type: 'button', 'aria-label': 'Close' }, on: { click: onDeselect } });
  close.innerHTML = icon('close');
  const inspector = el('section', { class: 'inspector', attrs: { 'aria-label': 'Selected body' } }, [
    el('div', { class: 'inspector__head' }, [swatch, name, remove, close]),
    el('dl', { class: 'inspector__stats' }, [mass.el, speed.el, distance.el]),
  ]);

  const root = el('div', { class: 'sky__overlay' }, [
    el('div', { class: 'sky__top' }, [clockBox, el('div', { class: 'sky__right' }, [paused, count])]),
    list,
    zoom,
    hint,
    inspector,
  ]);

  const text = (node, value) => {
    if (node.textContent !== value) node.textContent = value;
  };
  let hintIconName = null;
  let rowKey = '';

  return {
    el: root,
    /**
     * @param {{time: string, rate: string, count: number, paused: boolean, listOpen: boolean,
     *          heaviest: Array<{id: number, name: string, mass: {value: string, unit: string}, slot: string}>,
     *          hint: {text: string, icon: string} | null,
     *          selected: {name: string, mass: object, speed: string, distance: string | null, slot: string} | null}} view
     */
    update(view) {
      text(clock, view.time);
      text(rate, view.rate);
      text(countText, `${view.count} ${view.count === 1 ? 'body' : 'bodies'}`);
      count.setAttribute('aria-expanded', String(view.listOpen));
      paused.hidden = !view.paused;

      list.hidden = !view.listOpen;
      if (view.listOpen) {
        const top = view.heaviest.slice(0, LIST_SIZE);
        const key = top.map((b) => `${b.id}:${b.name}:${b.mass.value}:${b.slot}:${b.id === view.selectedId}`).join('|');
        if (key !== rowKey) {
          rowKey = key;
          rows.replaceChildren(
            ...top.map((b) =>
              el('li', {}, [
                el(
                  'button',
                  {
                    class: 'bodies__row',
                    attrs: { type: 'button', 'aria-pressed': String(b.id === view.selectedId) },
                    on: { click: () => onSelect(b.id) },
                  },
                  [
                    el('span', { class: 'swatch', dataset: { slot: b.slot }, attrs: { 'aria-hidden': 'true' } }),
                    el('span', { class: 'bodies__name', text: b.name }),
                    el('span', { class: 'bodies__mass', text: `${b.mass.value} ${b.mass.unit}` }),
                  ],
                ),
              ]),
            ),
          );
        }
      }

      hint.hidden = !view.hint;
      if (view.hint) {
        text(hintText, view.hint.text);
        if (hintIconName !== view.hint.icon) {
          hintIconName = view.hint.icon;
          hintIcon.innerHTML = icon(view.hint.icon);
        }
      }

      inspector.hidden = !view.selected;
      if (view.selected) {
        const s = view.selected;
        text(name, s.name);
        text(mass.value, s.mass.value);
        text(mass.unit, ` ${s.mass.unit}`);
        text(speed.value, s.speed);
        text(speed.unit, ' km/s');
        distance.el.hidden = s.distance == null;
        text(distance.value, s.distance ?? '');
        text(distance.unit, ' AU');
        swatch.dataset.slot = s.slot;
        remove.setAttribute('aria-label', `Delete ${s.name}`);
      }
    },
  };
}
