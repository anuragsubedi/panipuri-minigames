// The control deck. Built once; `update(view)` changes it in place so a
// slider keeps working mid-drag.

import { el } from '../../../../shared/js/dom.js';
import { icon } from './icons.js';

const SPEED_LABELS = { 0.25: '¼×', 0.5: '½×' };

/**
 * @param {{speeds: number[], launchSizes: Array<{id: string, label: string}>,
 *          gravityRange: {min: number, max: number}, starMassRange: {min: number, max: number}}} options
 * @param {{onTogglePause: () => void, onSpeed: (s: number) => void, onReset: () => void,
 *          onOpenSystems: () => void, onGravity: (g: number) => void, onStarMass: (m: number) => void,
 *          onToggleTrails: () => void, onToggleCollisions: () => void, onCycleLaunchSize: () => void}} handlers
 * @returns {{el: HTMLElement, update: (view: object) => void}}
 */
export function createControls(options, handlers) {
  const play = el('button', { class: 'play', attrs: { type: 'button' }, on: { click: handlers.onTogglePause } });

  const speedButtons = options.speeds.map((speed) =>
    el('button', {
      class: 'seg__item',
      text: SPEED_LABELS[speed] ?? `${speed}×`,
      attrs: { type: 'button', 'aria-label': `${speed}× speed` },
      on: { click: () => handlers.onSpeed(speed) },
    }),
  );
  const reset = el('button', {
    class: 'icon-btn',
    attrs: { type: 'button', 'aria-label': 'Restart this system', title: 'Restart this system' },
    on: { click: handlers.onReset },
  });
  reset.innerHTML = icon('reset');

  const systemName = el('span', { class: 'system__name' });
  const system = el('button', { class: 'system', attrs: { type: 'button', 'aria-haspopup': 'dialog' }, on: { click: handlers.onOpenSystems } }, [
    el('span', { class: 'system__caption', text: 'System' }),
    systemName,
  ]);
  system.insertAdjacentHTML('beforeend', icon('chevron'));

  const gravity = slider('gravity', 'Gravity', options.gravityRange, handlers.onGravity);
  const starMass = slider('star-mass', 'Sun mass', options.starMassRange, handlers.onStarMass);

  const trails = chip('Trails', handlers.onToggleTrails);
  const collisions = chip('Collisions', handlers.onToggleCollisions);
  const size = chip('New body', handlers.onCycleLaunchSize);

  const root = el('div', { class: 'deck' }, [
    el('div', { class: 'deck__row deck__row--transport' }, [
      play,
      el('div', { class: 'seg seg--speed', attrs: { role: 'group', 'aria-label': 'Time speed' } }, speedButtons),
      reset,
    ]),
    system,
    el('div', { class: 'deck__row deck__row--sliders' }, [gravity.el, starMass.el]),
    el('div', { class: 'deck__row deck__row--chips' }, [trails.el, collisions.el, size.el]),
  ]);

  let paused = null;

  return {
    el: root,
    /** @param {{paused: boolean, speed: number, systemLabel: string, gravity: number, starMass: number, trails: boolean, collisions: string, launchSize: string}} view */
    update(view) {
      if (view.paused !== paused) {
        paused = view.paused;
        play.innerHTML = icon(paused ? 'play' : 'pause');
        play.setAttribute('aria-label', paused ? 'Play' : 'Pause');
        play.classList.toggle('is-paused', paused);
      }
      options.speeds.forEach((s, i) => pressed(speedButtons[i], s === view.speed));
      if (systemName.textContent !== view.systemLabel) {
        systemName.textContent = view.systemLabel;
        system.setAttribute('aria-label', `System: ${view.systemLabel}. Change, save or load`);
      }
      gravity.update(view.gravity);
      starMass.update(view.starMass);
      trails.update(view.trails ? 'On' : 'Off', view.trails);
      collisions.update(view.collisions === 'merge' ? 'Merge' : 'Bounce', true);
      size.update(options.launchSizes.find((s) => s.id === view.launchSize).label, true);
    },
  };
}

function pressed(button, on) {
  button.setAttribute('aria-pressed', String(on));
}

// Multiplier slider on a log₂ track, so 1× sits in the middle. Tapping the
// value snaps back to 1×.
function slider(id, caption, { min, max }, onChange) {
  const input = el('input', {
    class: 'range',
    attrs: { id, type: 'range', min: Math.log2(min), max: Math.log2(max), step: 0.05 },
    on: { input: () => onChange(2 ** input.valueAsNumber) },
  });
  const value = el('button', {
    class: 'slider__value',
    attrs: { type: 'button', title: 'Back to 1×' },
    on: { click: () => onChange(1) },
  });
  const root = el('div', { class: 'slider' }, [
    el('div', { class: 'slider__head' }, [el('label', { class: 'slider__caption', text: caption, attrs: { for: id } }), value]),
    input,
  ]);
  return {
    el: root,
    update(multiplier) {
      const pos = Math.log2(multiplier);
      if (document.activeElement !== input) input.value = String(pos);
      input.style.setProperty('--fill', `${((pos - Math.log2(min)) / (Math.log2(max) - Math.log2(min))) * 100}%`);
      const text = `${Number(multiplier.toPrecision(2))}×`;
      if (value.textContent !== text) {
        value.textContent = text;
        value.setAttribute('aria-label', `${caption} ${text}. Reset to 1×`);
        input.setAttribute('aria-valuetext', text);
      }
    },
  };
}

function chip(caption, onClick) {
  const value = el('span', { class: 'chip__value' });
  const button = el('button', { class: 'chip', attrs: { type: 'button' }, on: { click: onClick } }, [
    el('span', { class: 'chip__caption', text: caption }),
    value,
  ]);
  return {
    el: button,
    update(text, on) {
      value.textContent = text;
      button.classList.toggle('is-off', !on);
      button.setAttribute('aria-label', `${caption}: ${text}. Change`);
    },
  };
}
