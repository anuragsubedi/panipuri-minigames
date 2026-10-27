import { el, onKey } from '../../../../../shared/js/dom.js';

/**
 * Title screen with rules and the three choices: topic, difficulty, rounds.
 * @param {HTMLElement} root
 * @param {{topic: string, difficulty: string, roundCount: number,
 *          topics: object, difficulties: object, roundOptions: number[]}} props
 * @param {{onOptions: (changes: object) => void, onStart: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderIntro(root, props, { onOptions, onStart }) {
  const { topic, difficulty, roundCount, topics, difficulties, roundOptions } = props;
  const topicEntries = Object.entries(topics).map(([key, t]) => [key, t.label]);
  const difficultyEntries = Object.entries(difficulties).map(([key, d]) => [key, d.label]);
  const roundEntries = roundOptions.map((n) => [n, `${n} rounds`]);

  root.append(
    el('section', { class: 'screen screen--intro' }, [
      el('div', {}, [
        el('div', { class: 'intro__art', attrs: { 'aria-hidden': 'true' } }, [el('span', { class: 'intro__pin' })]),
        el('h1', { class: 'intro__title', text: 'Pin Drop' }),
        el('p', { class: 'intro__lede', text: 'Where in the world is it? Drop a pin and see how far off you were.' }),
        el('p', {
          class: 'intro__rules',
          text: 'Tap the map to place your pin, drag to move it, pinch or scroll to zoom. Closer pins score more. Hard hides the country.',
        }),
      ]),
      el('div', { class: 'intro__options' }, [
        segmented('Topic', topicEntries, topic, (key) => onOptions({ topic: key })),
        segmented('Difficulty', difficultyEntries, difficulty, (key) => onOptions({ difficulty: key })),
        el('div', { class: 'intro__footer' }, [
          segmented('Rounds', roundEntries, roundCount, (n) => onOptions({ roundCount: n })),
          el('button', { class: 'btn btn--primary', text: 'Start', attrs: { type: 'button' }, on: { click: onStart } }),
        ]),
      ]),
    ]),
  );
  return onKey('Enter', onStart);
}

// Toggles its own buttons so focus stays put; the parent only records the choice.
function segmented(label, entries, selected, onSelect) {
  const buttons = entries.map(([key, text]) =>
    el('button', {
      class: 'segmented__option',
      text,
      attrs: { type: 'button', 'aria-pressed': key === selected },
      on: {
        click: () => {
          buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(entries[i][0] === key)));
          onSelect(key);
        },
      },
    }),
  );
  return el('div', { class: 'segmented', attrs: { role: 'group', 'aria-label': label } }, buttons);
}
