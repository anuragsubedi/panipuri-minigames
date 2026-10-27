import { el, onKey } from '../../../../../shared/js/dom.js';
import { createField } from '../components/field.js';

// Decorative cluster on the title screen.
const ART_DOTS = [
  { x: 0.2, y: 0.3 }, { x: 0.45, y: 0.15 }, { x: 0.75, y: 0.28 }, { x: 0.3, y: 0.62 },
  { x: 0.6, y: 0.55 }, { x: 0.85, y: 0.7 }, { x: 0.15, y: 0.85 }, { x: 0.52, y: 0.86 },
];

/**
 * Title screen with rules and difficulty choice.
 * @param {HTMLElement} root
 * @param {{difficulty: string, difficulties: object, rounds: number}} props
 * @param {{onDifficulty: (key: string) => void, onStart: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderIntro(root, { difficulty, difficulties, rounds }, { onDifficulty, onStart }) {
  const options = Object.entries(difficulties).map(([key, { label, flashMs }]) => ({
    key,
    button: el('button', {
      class: 'segmented__option',
      text: `${label} · ${flashMs / 1000}s`,
      attrs: { type: 'button', 'aria-pressed': key === difficulty },
      on: { click: () => select(key) },
    }),
  }));

  // Toggles locally so focus stays put; the parent only records the choice.
  function select(key) {
    for (const option of options) option.button.setAttribute('aria-pressed', String(option.key === key));
    onDifficulty(key);
  }

  const screen = el('section', { class: 'screen screen--intro' }, [
    el('div', {}, [
      el('div', { class: 'intro__art' }, [createField({ dots: ART_DOTS, radius: 0.07 })]),
      el('h1', { class: 'intro__title', text: 'Glimpse' }),
      el('p', { class: 'intro__lede', text: 'How many dots was that? No time to count — trust your gut.' }),
      el('p', {
        class: 'intro__rules',
        text: `${rounds} rounds. A cloud of dots flashes for a moment, then you guess how many there were. Being 10% off is equally good at any size.`,
      }),
    ]),
    el('div', { class: 'intro__footer' }, [
      el('div', { class: 'segmented', attrs: { role: 'group', 'aria-label': 'Difficulty' } }, options.map((o) => o.button)),
      el('button', { class: 'btn btn--primary', text: 'Start', attrs: { type: 'button' }, on: { click: onStart } }),
    ]),
  ]);

  root.append(screen);
  return onKey('Enter', onStart);
}
