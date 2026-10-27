// How wrong a count guess is.

/**
 * Ratio error |ln(guess / actual)|: symmetric for over/under-estimates and
 * scale-free, so 11 for 10 is as good as 110 for 100.
 * @param {number} guess positive integer
 * @param {number} actual positive integer
 * @returns {number} 0 for an exact guess
 */
export function ratioError(guess, actual) {
  return Math.abs(Math.log(guess / actual));
}

/**
 * Signed percentage off, for display: +25 means 25% too high.
 * @param {number} guess
 * @param {number} actual
 * @returns {number}
 */
export function percentOff(guess, actual) {
  return ((guess - actual) / actual) * 100;
}
