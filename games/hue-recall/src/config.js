// All tunable numbers for Hue Recall live here.

/** Rounds per game. */
export const ROUNDS = 5;

/** Memorize duration per difficulty. */
export const DIFFICULTIES = {
  easy: { label: 'Easy', memorizeMs: 5000 },
  hard: { label: 'Hard', memorizeMs: 2000 },
};

export const DEFAULT_DIFFICULTY = 'easy';

/**
 * Inclusive HSB ranges for random targets. Saturation and brightness have
 * lower bounds so targets avoid near-black / near-grey colors that are
 * indistinguishable from each other.
 */
export const TARGET_RANGES = {
  h: [0, 359],
  s: [25, 100],
  b: [25, 100],
};

/**
 * Score curve: points = MAX * exp(-(deltaE / SCALE) ^ SHAPE).
 * SCALE sets where points fall off; SHAPE > 1 keeps tiny errors near-perfect.
 * Tuned in playtesting (see docs/PROGRESS.md).
 */
export const SCORE_CURVE = {
  max: 10,
  scale: 22,
  shape: 1.6,
};
