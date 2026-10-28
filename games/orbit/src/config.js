// All tunable numbers for Orbit live here, in "sim units". The units are
// real ones in disguise (see UNITS): with G = 1, a body at r = 100 around a
// mass of 1000 takes exactly one year, so Earth sits at r = 100.

/** Gravitational constant at the "1×" gravity setting. */
export const G_BASE = 1;

/**
 * 1 distance unit = 0.01 AU and 1 mass unit = 0.001 solar masses. With G = 1
 * that fixes 1 time unit = √(0.01³ / 0.001) / k days, k = Gauss's constant.
 */
export const UNITS = {
  auPerUnit: 0.01,
  sunsPerUnit: 0.001,
  gaussK: 0.01720209895,
  kmPerAu: 149_597_870.7,
  earthsPerSun: 332_946,
  jupitersPerSun: 1047.57,
};

/** Plummer softening length; keeps close passes finite. */
export const SOFTENING = 1.5;

/** Fixed physics step (sim time). The accumulator feeds whole steps only. */
export const DT = 0.05;

/** Sim time that passes per real second at 1× speed (≈ 37 days). */
export const SIM_RATE = 20;

/** Time speed choices (× SIM_RATE). 64× ≈ 6.4 years per second. */
export const SPEEDS = [0.25, 1, 4, 16, 64];
export const DEFAULT_SPEED = 1;

/** A hidden tab pauses rAF; on return, catch up at most this much real time. */
export const MAX_FRAME_SECONDS = 0.25;

/** Hard cap on physics steps in one frame, so a slow device never spirals. */
export const MAX_STEPS_PER_FRAME = 600;

/** Gravity and star mass sliders are multipliers on the preset values. */
export const GRAVITY_RANGE = { min: 0.25, max: 4, step: 0.05 };
export const STAR_MASS_RANGE = { min: 0.25, max: 4, step: 0.05 };

/** Mass of the default Sun (= 1 solar mass). */
export const SUN_MASS = 1000;

/** Body radius = base + perCubeRoot · ∛mass (also the collision radius). */
export const RADIUS = { base: 2, perCubeRoot: 1.2 };

/**
 * Names for unflagged bodies by mass, smallest first (`below` is exclusive,
 * in sim mass units): rocky < 10 Earths, gas giant < 13 Jupiters,
 * brown dwarf < 80 Jupiters, then it's a star by mass alone.
 */
export const KINDS = [
  { kind: 'rocky', label: 'Rocky planet', below: 0.03 },
  { kind: 'giant', label: 'Gas giant', below: 12.4 },
  { kind: 'dwarf', label: 'Brown dwarf', below: 76 },
  { kind: 'star', label: 'Star', below: Infinity },
];

/** Bounce mode: how much normal speed survives a hit (1 = perfectly elastic). */
export const RESTITUTION = 0.8;

/** Bodies this far from the center of mass are gone for good (Neptune is at ~3000). */
export const DROP_DISTANCE = 8000;
export const MAX_BODIES = 50;

/** Sizes offered for a launched body (masses in sim units). */
export const LAUNCH_SIZES = [
  { id: 'earth', label: 'Earth', noun: 'an Earth', mass: 0.003 },
  { id: 'jupiter', label: 'Jupiter', noun: 'a Jupiter', mass: 0.95 },
  { id: 'dwarf', label: 'Brown dwarf', noun: 'a brown dwarf', mass: 40 },
];
export const DEFAULT_LAUNCH_SIZE = 'jupiter';

/** Drag length (sim units) → launch speed, and the fastest allowed launch. */
export const LAUNCH = { speedPerUnit: 0.03, maxSpeed: 9, minDragPx: 8 };

/** Predicted path while aiming: other bodies frozen, coarse steps, capped. */
export const PREVIEW = { steps: 300, dt: 0.25, tickEvery: 12 };

/** View radius: half the canvas's shorter side shows this many sim units. */
export const VIEW_RADIUS = 250;
export const ZOOM = { min: 40, max: 8000, buttonFactor: 1.6, wheelPerPixel: 0.0015 };

/**
 * Trails: a sample whenever a body moved 1/`perView` of the view radius;
 * `length` kept. At high speed a frame runs hundreds of steps, so physics runs
 * in chunks of `stepsPerSample` with a sample after each, keeping fast orbits round.
 */
export const TRAIL = { perView: 120, length: 100, stepsPerSample: 8 };

/** Planet colour slots; actual colours are theme tokens in app.css. */
export const PALETTE_SIZE = 8;

/** Saved systems kept in this browser. */
export const MAX_SAVES = 12;
