import { el, onKey } from '../../../../../shared/js/dom.js';
import { createRoundBadge } from '../../../../../shared/js/components/round-badge.js';

/**
 * Number entry with −/+ steppers. Submit is enabled only for valid guesses.
 * @param {HTMLElement} root
 * @param {{roundNumber: number, totalRounds: number, limits: {min: number, max: number},
 *          isValid: (guess: number | null) => boolean}} props
 * @param {{onSubmit: (guess: number) => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderGuess(root, { roundNumber, totalRounds, limits, isValid }, { onSubmit }) {
  const input = el('input', {
    class: 'guess__input',
    attrs: {
      type: 'text',
      inputmode: 'numeric',
      autocomplete: 'off',
      placeholder: '?',
      maxlength: String(limits.max).length,
      'aria-label': 'How many dots?',
    },
    on: { input: sync },
  });
  const submitButton = el('button', {
    class: 'btn btn--primary',
    text: 'Lock it in',
    attrs: { type: 'button', disabled: '' },
    on: { click: submit },
  });

  function read() {
    return input.value === '' ? null : Number(input.value);
  }

  // Keeps only digits and enables Submit when the value is acceptable.
  function sync() {
    input.value = input.value.replace(/\D/g, '');
    submitButton.disabled = !isValid(read());
  }

  function step(delta) {
    const next = Math.min(limits.max, Math.max(limits.min, (read() ?? 0) + delta));
    input.value = String(next);
    sync();
    input.focus();
  }

  function submit() {
    const guess = read();
    if (isValid(guess)) onSubmit(guess);
  }

  const stepper = (label, delta) =>
    el('button', {
      class: 'btn guess__step',
      text: label,
      attrs: { type: 'button', 'aria-label': delta > 0 ? 'Add one' : 'Subtract one' },
      on: { click: () => step(delta) },
    });

  root.append(
    el('section', { class: 'screen screen--guess' }, [
      el('div', {}, [
        el('div', { class: 'screen__meta' }, [createRoundBadge(roundNumber, totalRounds)]),
        el('h2', { class: 'guess__prompt', text: 'How many dots?' }),
      ]),
      el('div', { class: 'guess__controls' }, [stepper('−', -1), input, stepper('+', 1)]),
      el('div', { class: 'guess__actions' }, [submitButton]),
    ]),
  );

  input.focus({ preventScroll: true });
  return onKey('Enter', submit);
}
