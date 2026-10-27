import { el } from '../../../../shared/js/dom.js';

/**
 * One-tap preset chips. The chip matching the current tones is highlighted.
 * @param {{presets: Array<{id: string, label: string, beat: number}>,
 *          onApply: (preset: object) => void}} options
 * @returns {{el: HTMLElement, update: (isActive: (preset: object) => boolean) => void}}
 */
export function createPresets({ presets, onApply }) {
  const chips = presets.map((preset) => ({
    preset,
    button: el(
      'button',
      { class: 'preset', attrs: { type: 'button' }, on: { click: () => onApply(preset) } },
      [preset.label, el('small', { text: `${preset.beat} Hz` })],
    ),
  }));

  return {
    el: el('div', { class: 'presets', attrs: { role: 'group', 'aria-label': 'Presets' } }, chips.map((c) => c.button)),
    update(isActive) {
      for (const { preset, button } of chips) button.setAttribute('aria-pressed', String(isActive(preset)));
    },
  };
}
