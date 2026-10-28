// The systems sheet: start a preset, load or delete a saved system, or save
// the current one. A native <dialog>, so Escape, focus trapping and the
// backdrop come for free.

import { el } from '../../../../shared/js/dom.js';
import { icon } from './icons.js';

/**
 * @param {{presets: Array<{id: string, label: string, note: string}>, maxNameLength: number}} options
 * @param {{onPick: (presetId: string) => void, onLoad: (index: number) => void,
 *          onDelete: (index: number) => void, onSave: (name: string) => boolean}} handlers
 *   onSave returns false when the browser refused to store it
 * @returns {{el: HTMLDialogElement, open: (view: object) => void, update: (view: object) => void}}
 */
export function createSystemsSheet({ presets, maxNameLength }, { onPick, onLoad, onDelete, onSave }) {
  const close = el('button', { class: 'sheet__close', attrs: { type: 'button', 'aria-label': 'Close' }, on: { click: () => dialog.close() } });
  close.innerHTML = icon('close');

  const presetList = el(
    'ul',
    { class: 'sheet__list' },
    presets.map((p) =>
      el('li', {}, [
        el('button', { class: 'sheet__item', attrs: { type: 'button' }, on: { click: () => pick(() => onPick(p.id)) } }, [
          el('span', { class: 'sheet__item-name', text: p.label }),
          el('span', { class: 'sheet__item-note', text: p.note }),
        ]),
      ]),
    ),
  );

  const savedList = el('ul', { class: 'sheet__list' });
  const empty = el('p', { class: 'sheet__empty', text: 'Nothing saved yet. Save a system to come back to it later.' });

  const nameInput = el('input', {
    class: 'sheet__input',
    attrs: { type: 'text', maxlength: maxNameLength, 'aria-label': 'Name for this system', placeholder: 'Name this system', enterkeyhint: 'done' },
  });
  const saveButton = el('button', { class: 'sheet__save', attrs: { type: 'submit' } });
  saveButton.innerHTML = `${icon('save')}<span>Save</span>`;
  const status = el('p', { class: 'sheet__status', attrs: { role: 'status' } });
  const form = el('form', { class: 'sheet__form', on: { submit: submit } }, [nameInput, saveButton]);

  const dialog = el('dialog', { class: 'sheet', attrs: { 'aria-labelledby': 'systems-title' } }, [
    el('div', { class: 'sheet__head' }, [el('h2', { class: 'sheet__title', text: 'Systems', attrs: { id: 'systems-title' } }), close]),
    el('div', { class: 'sheet__body' }, [
      presetList,
      el('h3', { class: 'sheet__section', text: 'Saved in this browser' }),
      savedList,
      empty,
      form,
      status,
    ]),
  ]);
  // Tapping the backdrop closes it.
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close();
  });

  function pick(action) {
    action();
    dialog.close();
  }

  function submit(event) {
    event.preventDefault();
    const name = nameInput.value.trim() || nameInput.placeholder;
    status.textContent = onSave(name) ? `Saved “${name}”.` : 'This browser won’t store saves (private mode?).';
  }

  function render(view) {
    savedList.replaceChildren(
      ...view.saves.map((save, i) =>
        el('li', { class: 'sheet__saved' }, [
          el('button', { class: 'sheet__item', attrs: { type: 'button' }, on: { click: () => pick(() => onLoad(i)) } }, [
            el('span', { class: 'sheet__item-name', text: save.name }),
            el('span', { class: 'sheet__item-note', text: save.detail }),
          ]),
          deleteButton(save.name, () => onDelete(i)),
        ]),
      ),
    );
    empty.hidden = view.saves.length > 0;
    nameInput.placeholder = view.defaultName;
  }

  return {
    el: dialog,
    open(view) {
      render(view);
      nameInput.value = '';
      status.textContent = '';
      dialog.showModal();
    },
    update: render,
  };
}

function deleteButton(name, onClick) {
  const button = el('button', { class: 'sheet__delete', attrs: { type: 'button', 'aria-label': `Delete ${name}`, title: 'Delete' }, on: { click: onClick } });
  button.innerHTML = icon('trash');
  return button;
}
