// Log-scale mapping between a 0–1 slider position and a frequency, so each
// octave gets the same slider travel (as pitch is heard).

/**
 * @param {number} t slider position 0–1
 * @param {{min: number, max: number}} range
 * @returns {number} frequency in Hz
 */
export function sliderToFreq(t, { min, max }) {
  const clamped = Math.min(1, Math.max(0, t));
  return min * (max / min) ** clamped;
}

/**
 * @param {number} freq Hz
 * @param {{min: number, max: number}} range
 * @returns {number} slider position 0–1
 */
export function freqToSlider(freq, { min, max }) {
  const clamped = Math.min(max, Math.max(min, freq));
  return Math.log(clamped / min) / Math.log(max / min);
}
