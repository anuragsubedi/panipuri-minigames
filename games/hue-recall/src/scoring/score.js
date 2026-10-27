// Turns color difference into points.

/**
 * Points for one round: max * exp(-(deltaE / scale) ^ shape).
 * @param {number} deltaE perceptual difference (≥ 0)
 * @param {{max: number, scale: number, shape: number}} curve
 * @returns {number} points in [0, curve.max], unrounded
 */
export function roundScore(deltaE, { max, scale, shape }) {
  return max * Math.exp(-((Math.max(0, deltaE) / scale) ** shape));
}

/**
 * Sum of round scores, ignoring rounds not yet scored (null).
 * @param {Array<number | null>} scores
 * @returns {number}
 */
export function totalScore(scores) {
  return scores.reduce((sum, s) => sum + (s ?? 0), 0);
}
