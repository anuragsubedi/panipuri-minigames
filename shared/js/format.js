// Number formatting for display.

/**
 * Points with two decimals, e.g. 7.5 → "7.50".
 * @param {number} points
 * @returns {string}
 */
export function formatPoints(points) {
  return points.toFixed(2);
}
