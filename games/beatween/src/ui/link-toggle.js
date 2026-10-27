import { el } from '../../../../shared/js/dom.js';
import { icon } from './icons.js';

/**
 * Chain button between the ears: when linked, both ears move together.
 * @param {{onToggle: () => void}} handlers
 * @returns {{el: HTMLElement, update: (linked: boolean) => void}}
 */
export function createLinkToggle({ onToggle }) {
  const button = el('button', { class: 'link', attrs: { type: 'button' }, on: { click: onToggle } });
  return {
    el: button,
    update(linked) {
      button.setAttribute('aria-pressed', String(linked));
      button.setAttribute('aria-label', linked ? 'Ears linked: both move together. Unlink' : 'Ears unlinked: each moves alone. Link');
      button.title = linked ? 'Linked: both ears move together, the beat stays' : 'Unlinked: each ear moves on its own';
      button.innerHTML = icon(linked ? 'link' : 'unlink');
    },
  };
}
