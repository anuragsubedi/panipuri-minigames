// All tunable numbers for Pin Drop live here.

/** Round counts offered on the intro; the first is the default. */
export const ROUND_OPTIONS = [5, 10];

/**
 * Topics are sets of packs (`data/packs/<id>.json`). Mix pools them all.
 * Every pack in one topic must share a map.
 */
export const TOPICS = {
  capitals: { label: 'Capitals', packs: ['capitals'] },
  cities: { label: 'Cities', packs: ['cities'] },
  landmarks: { label: 'Landmarks', packs: ['landmarks'] },
  mix: { label: 'Mix', packs: ['capitals', 'cities', 'landmarks'] },
};

export const DEFAULT_TOPIC = 'capitals';

/**
 * Difficulty picks which fame tiers are drawn (1 = famous, 3 = obscure) and
 * whether the clue names the country.
 */
export const DIFFICULTIES = {
  easy: { label: 'Easy', tiers: [1], showDetail: true, blurb: 'Famous places, country shown' },
  medium: { label: 'Medium', tiers: [1, 2], showDetail: true, blurb: 'Famous and well-known places, country shown' },
  hard: { label: 'Hard', tiers: [2, 3], showDetail: false, blurb: 'Lesser-known places, country hidden' },
};

export const DEFAULT_DIFFICULTY = 'easy';

/**
 * Score curve over distance: points = MAX * exp(-(km / scale) ^ SHAPE).
 * `scale` comes from each pack (`scoreScaleKm`), because 500 km off is great
 * for the world and poor inside one country. With 1500 km: ≈ 9.4 at 100 km,
 * ≈ 7.2 at 500 km, ≈ 5.1 at 1000 km, ≈ 1.4 at 3000 km.
 */
export const SCORE_CURVE = { max: 10, shape: 1 };

/** Verdict words by minimum points, highest first. */
export const VERDICTS = [
  { min: 9.5, label: 'Bullseye' },
  { min: 8, label: 'So close' },
  { min: 5, label: 'Right region' },
  { min: 2, label: 'Right continent-ish' },
  { min: 0, label: 'Way off' },
];

/** Map view limits. Zoom 1 shows the whole map width. */
export const MAP_VIEW = {
  maxZoom: 16,
  wheelZoomPerPixel: 0.002,
  buttonZoomStep: 2,
  // Pixels a pointer may move and still count as a tap (drops the pin).
  tapSlopPx: 8,
  // Grab radius around the pin, in pixels, for dragging it.
  pinGrabPx: 28,
  // Padding around the pins when the reveal frames them, in pixels.
  fitPaddingPx: 48,
  // Never zoom in further than this when framing a reveal.
  fitMaxZoom: 8,
};

/** Grid lines every N degrees. */
export const GRATICULE_STEP = 30;
