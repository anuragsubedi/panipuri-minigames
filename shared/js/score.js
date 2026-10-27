// Turns an error measure (≥ 0) into points with a smooth decaying curve.

/**
 * Points for one round: max * exp(-(error / scale) ^ shape).
 * @param {number} error error measure (≥ 0), e.g. color ΔE or a log ratio
 * @param {{max: number, scale: number, shape: number}} curve
 * @returns {number} points in [0, curve.max], unrounded
 */
export function roundScore(error, { max, scale, shape }) {
  return max * Math.exp(-((Math.max(0, error) / scale) ** shape));
}

/**
 * Sum of round scores, ignoring rounds not yet scored (null).
 * @param {Array<number | null>} scores
 * @returns {number}
 */
export function totalScore(scores) {
  return scores.reduce((sum, s) => sum + (s ?? 0), 0);
}
