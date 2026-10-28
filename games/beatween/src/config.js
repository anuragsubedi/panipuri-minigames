// All tunable numbers for Beatween live here.

/** Playable tone range per ear, in Hz. Binaural beats work best on carriers under ~1000 Hz. */
export const FREQ_RANGE = { min: 40, max: 1200 };

/** Frequencies are kept to 0.1 Hz. */
export const FREQ_STEP = 0.1;

/** Beat nudge step and upper limit, in Hz. */
export const BEAT_STEP = 0.5;
export const BEAT_MAX = 50;

/** Starting point on first visit: a calm alpha beat. */
export const DEFAULT_SETTINGS = {
  left: 200,
  right: 210,
  linked: true,
  volume: 0.4,
  noise: 'off',
  timerMin: 0,
};

/** One-tap starting points. `beat` is how far the right ear sits above the left. */
export const PRESETS = [
  { id: 'deep-rest', label: 'Deep rest', left: 100, beat: 2 },
  { id: 'dreamy', label: 'Dreamy', left: 150, beat: 6 },
  { id: 'calm', label: 'Calm', left: 200, beat: 10 },
  { id: 'alert', label: 'Alert', left: 220, beat: 16 },
  { id: 'sharp', label: 'Sharp', left: 250, beat: 40 },
];

/**
 * Conventional brainwave band names by beat frequency (upper bound exclusive).
 * Descriptions are moods, not claims.
 */
export const BANDS = [
  { below: 0.05, name: 'Unison', note: 'no beat' },
  { below: 4, name: 'Delta', note: 'deep rest' },
  { below: 8, name: 'Theta', note: 'dreamy' },
  { below: 13, name: 'Alpha', note: 'relaxed' },
  { below: 30, name: 'Beta', note: 'alert' },
  { below: 45, name: 'Gamma', note: 'sharp' },
  { below: Infinity, name: 'Wide', note: 'heard as two tones' },
];

export const NOISE_TYPES = ['off', 'pink', 'brown'];

/** Session timer choices in minutes (0 = no timer). */
export const TIMER_OPTIONS = [0, 10, 20, 30, 60];

/** Audio levels. Volume (0–1) maps to gain as volume² × MAX_GAIN for a natural feel. */
export const AUDIO = {
  maxGain: 0.35,
  noiseLevel: 0.3,
  noiseSeconds: 6,
  noiseCrossfadeSeconds: 0.25,
  fadeInSeconds: 1.5,
  fadeOutSeconds: 0.8,
  sessionEndFadeSeconds: 8,
  paramSmoothing: 0.03,
};

/**
 * Scope animation. The figure morphs at a slowed, capped version of the beat
 * rate: real 2–40 Hz shape changes would flicker (photosensitivity risk).
 */
export const VISUAL = {
  tempoBase: 0.04,
  tempoPerHz: 0.035,
  tempoMax: 0.9,
  samples: 900,
  turns: 2,
};
