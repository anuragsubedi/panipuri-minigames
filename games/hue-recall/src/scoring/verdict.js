// Turns points into a short verdict word.

/**
 * First verdict whose minimum the score reaches.
 * @param {number} score
 * @param {Array<{min: number, label: string}>} verdicts sorted by min, highest first
 * @returns {string}
 */
export function verdictFor(score, verdicts) {
  return (verdicts.find((v) => score >= v.min) ?? verdicts.at(-1)).label;
}
