import { el, onKey } from '../../../../../shared/js/dom.js';
import { hsbToHex } from '../../color/convert.js';

// Decorative dots on the title screen.
const DOT_COLORS = [
  { h: 12, s: 80, b: 92 },
  { h: 40, s: 78, b: 95 },
  { h: 145, s: 62, b: 68 },
  { h: 214, s: 76, b: 90 },
  { h: 275, s: 60, b: 86 },
];

/**
 * Title screen with rules and difficulty choice.
 * @param {HTMLElement} root
 * @param {{difficulty: string, difficulties: object, rounds: number}} props
 * @param {{onDifficulty: (key: string) => void, onStart: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderIntro(root, { difficulty, difficulties, rounds }, { onDifficulty, onStart }) {
  const options = Object.entries(difficulties).map(([key, { label, memorizeMs }]) => {
    const button = el('button', {
      class: 'segmented__option',
      text: `${label} · ${memorizeMs / 1000}s`,
      attrs: { type: 'button', 'aria-pressed': key === difficulty },
      on: { click: () => select(key) },
    });
    return { key, button };
  });

  // Toggles locally so focus stays put; the parent only records the choice.
  function select(key) {
    for (const option of options) option.button.setAttribute('aria-pressed', String(option.key === key));
    onDifficulty(key);
  }

  const screen = el('section', { class: 'screen screen--intro' }, [
    el('div', {}, [
      el(
        'div',
        { class: 'intro__dots', attrs: { 'aria-hidden': 'true' } },
        DOT_COLORS.map((hsb) => el('span', { class: 'intro__dot', style: { background: hsbToHex(hsb) } })),
      ),
      el('h1', { class: 'intro__title', text: 'Hue Recall' }),
      el('p', { class: 'intro__lede', text: 'Colors slip out of memory fast. How much of one can you hold on to?' }),
      el('p', {
        class: 'intro__rules',
        text: `You'll see ${rounds} colors, one at a time. When each one disappears, rebuild it with three sliders.`,
      }),
    ]),
    el('div', { class: 'intro__footer' }, [
      el(
        'div',
        { class: 'segmented', attrs: { role: 'group', 'aria-label': 'Difficulty' } },
        options.map((o) => o.button),
      ),
      el('button', { class: 'btn btn--primary', text: 'Start', attrs: { type: 'button' }, on: { click: onStart } }),
    ]),
  ]);

  root.append(screen);
  return onKey('Enter', onStart);
}
