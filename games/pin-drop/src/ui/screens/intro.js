import { el, onKey } from '../../../../../shared/js/dom.js';
import { createWorldMap } from '../components/world-map.js';

/**
 * Title screen: the three choices, and a map dotted with every place they can
 * draw from, so the empty space shows what you're signing up for.
 * @param {HTMLElement} root
 * @param {{topic: string, difficulty: string, roundCount: number, topics: object, difficulties: object,
 *          roundOptions: number[], placesFor: (choice: {topic: string, difficulty: string}) => object[],
 *          map: object, mapView: object, gridStep: number}} props
 * @param {{onOptions: (changes: object) => void, onStart: () => void}} handlers
 * @returns {() => void} cleanup
 */
export function renderIntro(root, props, { onOptions, onStart }) {
  const { topics, difficulties, roundOptions, placesFor } = props;
  const choice = { topic: props.topic, difficulty: props.difficulty };

  const preview = createWorldMap({ map: props.map, view: props.mapView, gridStep: props.gridStep, still: true, label: 'Where this game can send you' });
  const pool = el('p', { class: 'intro__pool' });

  // Updates in place so focus stays on the toggled button.
  function update(changes) {
    Object.assign(choice, changes);
    const places = placesFor(choice);
    preview.setDots(places);
    pool.textContent = `${difficulties[choice.difficulty].blurb} · ${places.length} places`;
    onOptions(changes);
  }

  root.append(
    el('section', { class: 'screen screen--intro' }, [
      el('div', { class: 'intro__head' }, [
        el('h1', { class: 'intro__title', text: 'Pin Drop' }),
        el('p', { class: 'intro__lede', text: 'Where in the world is it? Drop a pin, see how far off you were.' }),
      ]),
      el('div', { class: 'intro__preview' }, [preview.element]),
      el('div', { class: 'intro__options' }, [
        field('Topic', segmented('Topic', entries(topics), choice.topic, (key) => update({ topic: key }))),
        field('Difficulty', segmented('Difficulty', entries(difficulties), choice.difficulty, (key) => update({ difficulty: key }))),
        pool,
        el('div', { class: 'intro__footer' }, [
          field('Rounds', segmented('Rounds', roundOptions.map((n) => [n, String(n)]), props.roundCount, (n) => onOptions({ roundCount: n }))),
          el('button', { class: 'btn btn--primary', text: 'Start', attrs: { type: 'button' }, on: { click: onStart } }),
        ]),
      ]),
    ]),
  );
  update({});

  const stopKey = onKey('Enter', onStart);
  return () => {
    stopKey();
    preview.destroy();
  };
}

function entries(options) {
  return Object.entries(options).map(([key, o]) => [key, o.label]);
}

function field(label, control) {
  return el('div', { class: 'intro__field' }, [el('span', { class: 'intro__label', text: label }), control]);
}

// Toggles its own buttons so focus stays put; the parent only records the choice.
function segmented(label, options, selected, onSelect) {
  const buttons = options.map(([key, text]) =>
    el('button', {
      class: 'segmented__option',
      text,
      attrs: { type: 'button', 'aria-pressed': key === selected },
      on: {
        click: () => {
          buttons.forEach((b, i) => b.setAttribute('aria-pressed', String(options[i][0] === key)));
          onSelect(key);
        },
      },
    }),
  );
  return el('div', { class: 'segmented', attrs: { role: 'group', 'aria-label': label } }, buttons);
}
