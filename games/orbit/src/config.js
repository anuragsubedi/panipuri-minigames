// All tunable numbers for Orbit live here, in "sim units": distance, mass and
// time are arbitrary, picked so the default orbits look good on a phone.

/** Gravitational constant at the "1×" gravity setting. */
export const G_BASE = 1;

/** Plummer softening length; keeps close passes finite. */
export const SOFTENING = 1.5;

/** Fixed physics step (sim time). The accumulator feeds whole steps only. */
export const DT = 0.05;

/** Sim time that passes per real second at 1× speed. */
export const SIM_RATE = 20;

/** Time speed choices (× SIM_RATE). */
export const SPEEDS = [0.25, 0.5, 1, 2, 4, 8];
export const DEFAULT_SPEED = 1;

/** A hidden tab pauses rAF; on return, catch up at most this much real time. */
export const MAX_FRAME_SECONDS = 0.25;

/** Hard cap on physics steps in one frame, so a slow device never spirals. */
export const MAX_STEPS_PER_FRAME = 400;

/** Gravity and star mass sliders are multipliers on the preset values. */
export const GRAVITY_RANGE = { min: 0.25, max: 4, step: 0.05 };
export const STAR_MASS_RANGE = { min: 0.25, max: 4, step: 0.05 };

/** Mass of the default Sun. */
export const SUN_MASS = 1000;

/** Body radius = base + perCubeRoot · ∛mass (also the collision radius). */
export const RADIUS = { base: 2, perCubeRoot: 1.2 };

/** Names for non-star bodies by mass, smallest first (`below` is exclusive). Stars are flagged. */
export const KINDS = [
  { kind: 'moon', label: 'Moon', below: 1.5 },
  { kind: 'planet', label: 'Planet', below: 15 },
  { kind: 'giant', label: 'Giant', below: Infinity },
];

/** Bounce mode: how much normal speed survives a hit (1 = perfectly elastic). */
export const RESTITUTION = 0.8;

/** Bodies this far from the center of mass are gone for good. */
export const DROP_DISTANCE = 2400;
export const MAX_BODIES = 50;

/** Sizes offered for a launched body. */
export const LAUNCH_SIZES = [
  { id: 'moon', label: 'Moon', mass: 0.6 },
  { id: 'planet', label: 'Planet', mass: 4 },
  { id: 'giant', label: 'Giant', mass: 40 },
];
export const DEFAULT_LAUNCH_SIZE = 'planet';

/** Drag length (sim units) → launch speed, and the fastest allowed launch. */
export const LAUNCH = { speedPerUnit: 0.03, maxSpeed: 9, minDragPx: 8 };

/** Predicted path while aiming: other bodies frozen, coarse steps, capped. */
export const PREVIEW = { steps: 300, dt: 0.25, tickEvery: 12 };

/** Half the shorter side of the canvas shows this many sim units. */
export const VIEW_RADIUS = 250;

/** Trails: one sample per `every` sim time, `length` samples kept. */
export const TRAIL = { every: 1, length: 80 };

/** Planet colour slots; actual colours are theme tokens in app.css. */
export const PALETTE_SIZE = 6;
