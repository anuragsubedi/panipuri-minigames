import { el } from '../../../../../shared/js/dom.js';

// One renderer per clue type. Lost Lens can add 'photo' here later.
const RENDERERS = {
  text: ({ text, detail }) =>
    el('div', { class: 'clue clue--text' }, [
      el('p', { class: 'clue__text', text }),
      el('p', { class: 'clue__detail', text: detail ?? 'Country hidden' }),
    ]),
};

/**
 * The clue block for a round.
 * @param {{type: string, text?: string, detail?: string | null}} clue
 * @returns {HTMLElement}
 */
export function createClue(clue) {
  const render = RENDERERS[clue.type];
  if (!render) return el('div', { class: 'clue', text: `Unsupported clue type "${clue.type}"` });
  return render(clue);
}
