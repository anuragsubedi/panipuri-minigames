// What the player is shown. Clue types are pluggable: packs may carry their own
// `clue` (e.g. a future {type: 'photo', src, credit}); otherwise a text clue is
// built from the place's name, with its country only when the difficulty allows.

/**
 * The clue to show for a place.
 * @param {{name: string, detail?: string, clue?: object}} place
 * @param {{showDetail: boolean}} options
 * @returns {{type: string, text?: string, detail?: string | null}}
 */
export function clueFor(place, { showDetail }) {
  if (place.clue) return place.clue;
  return { type: 'text', text: place.name, detail: showDetail ? place.detail ?? null : null };
}

/**
 * Full name for the reveal, e.g. "Timbuktu, Mali".
 * @param {{name: string, detail?: string}} place
 * @returns {string}
 */
export function answerLabel({ name, detail }) {
  return detail ? `${name}, ${detail}` : name;
}
