// All tunable numbers for Pin Drop live here.

/** Round counts offered on the intro; the first is the default. */
export const ROUND_OPTIONS = [5, 10];

/**
 * Each map (`data/maps/<id>.json`) has its own topics; a topic is a set of
 * packs (`data/packs/<id>.json`) drawn on that map, and Mix pools them all.
 * Topic keys are shared across maps so switching map keeps the topic.
 * gridStep: graticule spacing in degrees.
 */
export const MAPS = {
  world: {
    label: 'World',
    detailLabel: 'country',
    gridStep: 30,
    topics: {
      capitals: { label: 'Capitals', packs: ['capitals'] },
      cities: { label: 'Cities', packs: ['cities'] },
      landmarks: { label: 'Landmarks', packs: ['landmarks'] },
      mix: { label: 'Mix', packs: ['capitals', 'cities', 'landmarks'] },
    },
  },
  india: {
    label: 'India',
    detailLabel: 'state',
    gridStep: 5,
    topics: {
      capitals: { label: 'Capitals', packs: ['india-capitals'] },
      cities: { label: 'Cities', packs: ['india-cities'] },
      landmarks: { label: 'Landmarks', packs: ['india-landmarks'] },
      mix: { label: 'Mix', packs: ['india-capitals', 'india-cities', 'india-landmarks'] },
    },
  },
};

export const DEFAULT_MAP = 'world';
export const DEFAULT_TOPIC = 'capitals';

/**
 * Difficulty picks which fame tiers are drawn (1 = famous, 3 = obscure) and
 * whether the clue names the country.
 */
export const DIFFICULTIES = {
  easy: { label: 'Easy', tiers: [1], showDetail: true, blurb: 'Famous places, {detail} shown' },
  medium: { label: 'Medium', tiers: [1, 2], showDetail: true, blurb: 'Famous and well-known places, {detail} shown' },
  hard: { label: 'Hard', tiers: [2, 3], showDetail: false, blurb: 'Lesser-known places, {detail} hidden' },
};

export const DEFAULT_DIFFICULTY = 'easy';

/**
 * Score curve over distance: points = MAX * exp(-(km / scale) ^ SHAPE).
 * `scale` comes from each pack (`scoreScaleKm`), because 500 km off is great
 * for the world and poor inside one country. World packs use 1500 km (≈ 9.4 at
 * 100 km, ≈ 5.1 at 1000 km); India packs 250 km (≈ 8.2 at 50 km, ≈ 4.5 at 200 km).
 */
export const SCORE_CURVE = { max: 10, shape: 1 };

/** Verdict words by minimum points, highest first. */
export const VERDICTS = [
  { min: 9.5, label: 'Bullseye' },
  { min: 8, label: 'So close' },
  { min: 5, label: 'Getting warm' },
  { min: 2, label: 'Ballpark' },
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
  fitPaddingPx: 80,
  // Never zoom in further than this when framing a reveal.
  fitMaxZoom: 6,
};

