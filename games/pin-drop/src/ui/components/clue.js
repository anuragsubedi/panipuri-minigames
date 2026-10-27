import { el } from '../../../../../shared/js/dom.js';

// One renderer per clue type. Lost Lens can add 'photo' here later.
const RENDERERS = {
  text: ({ text, detail, hint }) =>
    el('div', { class: 'clue clue--text' }, [
      el('p', { class: 'clue__text' }, [text, hint && createHint(hint)]),
      el('p', { class: 'clue__detail', text: detail ?? 'Location hidden' }),
    ]),
};

// A small ⓘ that reveals what the place is. Hints describe, never locate.
function createHint(hint) {
  const tip = el('span', { class: 'clue__tip', text: hint, attrs: { role: 'note', hidden: '' } });
  const button = el('button', {
    class: 'clue__info',
    text: 'i',
    attrs: { type: 'button', 'aria-label': 'What is it?', 'aria-expanded': 'false' },
    on: {
      click: () => {
        tip.hidden = !tip.hidden;
        button.setAttribute('aria-expanded', String(!tip.hidden));
      },
    },
  });
  return el('span', { class: 'clue__hint' }, [button, tip]);
}

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
