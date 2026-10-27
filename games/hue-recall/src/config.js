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

/** Inclusive slider ranges for the player's guess. */
export const CHANNEL_RANGES = {
  h: [0, 359],
  s: [0, 100],
  b: [0, 100],
};

/**
 * Where the saturation and brightness sliders start each round. Hue starts
 * random so the player isn't anchored to the same spot every time.
 */
export const START_GUESS = { s: 50, b: 75 };

/** Verdict words by minimum points, highest first. */
export const VERDICTS = [
  { min: 9.5, label: 'Flawless' },
  { min: 8, label: 'Sharp eye' },
  { min: 6, label: 'Close' },
  { min: 3, label: 'Not quite' },
  { min: 0, label: 'Way off' },
];

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
