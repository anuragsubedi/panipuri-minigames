// All tunable numbers for Glimpse live here.

/** Rounds per game. Must equal COUNT_BANDS.length. */
export const ROUNDS = 5;

/** How long the dots stay on screen per difficulty. */
export const DIFFICULTIES = {
  easy: { label: 'Easy', flashMs: 1000 },
  hard: { label: 'Hard', flashMs: 400 },
};

export const DEFAULT_DIFFICULTY = 'easy';

/** "Get ready" pause before each flash, so the player is looking. */
export const READY_MS = 1500;

/**
 * Inclusive dot-count ranges, one round drawn from each band (order shuffled),
 * so every game mixes small and large clouds.
 */
export const COUNT_BANDS = [
  [8, 20],
  [21, 40],
  [41, 70],
  [71, 110],
  [111, 150],
];

/**
 * Dot layout in a unit square (UI scales it to the card). minDistance is
 * center-to-center, so dots never touch and can't hide behind each other.
 * maxAttempts caps rejection sampling for one whole cloud.
 */
export const DOT_LAYOUT = {
  radius: 0.018,
  minDistance: 0.055,
  maxAttempts: 50000,
};

/** Accepted guesses (integers). */
export const GUESS_LIMITS = { min: 1, max: 999 };

/**
 * Score curve over ratio error |ln(guess / actual)|:
 * points = MAX * exp(-(error / SCALE) ^ SHAPE).
 * Gives ≈ 9.5 at 10% off, ≈ 7.5 at 25% off, ≈ 4 at 50% over, ≈ 0.6 at 2×.
 */
export const SCORE_CURVE = {
  max: 10,
  scale: 0.42,
  shape: 2,
};

/** Verdict words by minimum points, highest first. */
export const VERDICTS = [
  { min: 9.5, label: 'Bang on' },
  { min: 8, label: 'Great eye' },
  { min: 6, label: 'Close' },
  { min: 3, label: 'Ballpark' },
  { min: 0, label: 'Way off' },
];
