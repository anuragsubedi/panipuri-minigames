// Entry point: owns the world and the frame loop, turns pointer and control
// intents into world transitions, and hands each frame to the renderer.
// A toy, so there is no phase machine: one continuous loop.

import { el } from '../../../shared/js/dom.js';
import { createRng, seedFromQuery } from '../../../shared/js/rng.js';
import {
  SOFTENING,
  DT,
  SIM_RATE,
  SPEEDS,
  DEFAULT_SPEED,
  MAX_FRAME_SECONDS,
  MAX_STEPS_PER_FRAME,
  GRAVITY_RANGE,
  STAR_MASS_RANGE,
  MAX_BODIES,
  LAUNCH_SIZES,
  DEFAULT_LAUNCH_SIZE,
  LAUNCH,
  PREVIEW,
  VIEW_RADIUS,
  TRAIL,
  PALETTE_SIZE,
} from './config.js';
import { kindOf, centerOfMass, radiusOf } from './sim/bodies.js';
import { PRESETS } from './sim/presets.js';
import {
  createWorld,
  advance,
  launch,
  removeBody,
  setGravity,
  setStarMass,
  setCollisions,
  gravityOf,
  stepsFor,
  bodyById,
  aimVelocity,
} from './sim/world.js';
import { predictPath } from './physics/predict.js';
import { createCamera, approach, bodyAt } from './view/camera.js';
import { createTrails } from './view/trails.js';
import { createRenderer } from './ui/canvas-renderer.js';
import { createLauncher } from './ui/launcher.js';
import { createControls } from './ui/controls.js';
import { createSkyOverlay } from './ui/sky-overlay.js';

const FLASH_SECONDS = 0.6;
const CAMERA_HALF_LIFE = 0.35;
const MIN_HIT_PX = 22;

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const darkScheme = matchMedia('(prefers-color-scheme: dark)');
const rng = createRng(seedFromQuery(location.search));

let world = createWorld({ presetId: PRESETS[0].id, rng });
let speed = reducedMotion.matches ? 0.5 : DEFAULT_SPEED;
let paused = false;
let trailsOn = true;
let launchSize = DEFAULT_LAUNCH_SIZE;
let selectedId = null;
let aim = null;
let launchedOnce = false;
let flashes = [];
let carry = 0;
let center = [0, 0];
let size = { width: 1, height: 1 };
let dirty = true;

const trails = createTrails(TRAIL);

// DOM

const canvas = el('canvas', {
  class: 'sky__canvas',
  attrs: { role: 'img', 'aria-label': 'Solar system. Drag from empty space to launch a body; tap a body to select it.' },
});
const overlay = createSkyOverlay({
  onResume: () => setPaused(false),
  onDelete: deleteSelected,
  onDeselect: () => select(null),
});
const sky = el('div', { class: 'sky' }, [canvas, overlay.el]);
const controls = createControls(
  { speeds: SPEEDS, presets: PRESETS, launchSizes: LAUNCH_SIZES, gravityRange: GRAVITY_RANGE, starMassRange: STAR_MASS_RANGE },
  {
    onTogglePause: () => setPaused(!paused),
    onSpeed: (s) => {
      speed = s;
      setPaused(false);
    },
    onReset: () => loadPreset(world.presetId),
    onPreset: loadPreset,
    onGravity: (g) => commit(setGravity(world, g)),
    onStarMass: (m) => commit(setStarMass(world, m)),
    onToggleTrails: () => {
      trailsOn = !trailsOn;
      trails.clear();
      refresh();
    },
    onToggleCollisions: () => commit(setCollisions(world, world.collisions === 'merge' ? 'bounce' : 'merge')),
    onCycleLaunchSize: () => {
      const i = LAUNCH_SIZES.findIndex((s) => s.id === launchSize);
      launchSize = LAUNCH_SIZES[(i + 1) % LAUNCH_SIZES.length].id;
      refresh();
    },
  },
);
document.getElementById('app').append(sky, controls.el);

const renderer = createRenderer(canvas);
function measure() {
  const { width, height } = sky.getBoundingClientRect();
  if (width === size.width && height === size.height) return;
  size = { width: Math.max(1, width), height: Math.max(1, height) };
  renderer.resize(size.width, size.height);
  dirty = true;
}
new ResizeObserver(measure).observe(sky);
measure();
darkScheme.addEventListener('change', () => {
  renderer.refreshTheme();
  dirty = true;
});

const camera = () => createCamera({ ...size, cx: center[0], cy: center[1], viewRadius: VIEW_RADIUS });

createLauncher(canvas, {
  minDragPx: LAUNCH.minDragPx,
  toWorld: (sx, sy) => camera().toWorld(sx, sy),
  hitTest: (sx, sy) => {
    const cam = camera();
    return bodyAt(world.bodies, cam.toWorld(sx, sy), cam.scale, MIN_HIT_PX)?.id ?? null;
  },
  onSelect: select,
  onAim: (next) => {
    const toggled = !aim !== !next;
    aim = next;
    dirty = true;
    if (toggled) updateOverlay();
  },
  onLaunch: ({ start, end }) => {
    if (world.bodies.length >= MAX_BODIES) return;
    const [vx, vy] = aimVelocity(start, end, LAUNCH);
    const mass = LAUNCH_SIZES.find((s) => s.id === launchSize).mass;
    world = launch(world, { x: start[0], y: start[1], vx, vy, mass, color: world.nextId % PALETTE_SIZE });
    launchedOnce = true;
    refresh();
  },
});

// Transitions

function commit(next) {
  world = next;
  if (!bodyById(world, selectedId)) selectedId = null;
  refresh();
}

function loadPreset(presetId) {
  world = createWorld({ presetId, rng, gravity: world.gravity, starMass: world.starMass, collisions: world.collisions });
  selectedId = null;
  flashes = [];
  carry = 0;
  trails.clear();
  center = [0, 0];
  refresh();
}

function select(id) {
  selectedId = id;
  refresh();
}

function deleteSelected() {
  if (selectedId == null) return;
  commit(removeBody(world, selectedId));
}

function setPaused(next) {
  paused = next;
  carry = 0;
  refresh();
}

// Rendering

function refresh() {
  dirty = true;
  controls.update({
    paused,
    speed,
    presetId: world.presetId,
    gravity: world.gravity,
    starMass: world.starMass,
    trails: trailsOn,
    collisions: world.collisions,
    launchSize,
  });
  updateOverlay();
}

function updateOverlay() {
  const body = bodyById(world, selectedId);
  overlay.update({
    count: world.bodies.length,
    paused,
    hint: hintText(),
    selected: body && {
      name: `${kindOf(body).label} ${body.id}`,
      mass: formatNumber(body.mass),
      speed: Math.hypot(body.vx, body.vy).toFixed(2),
      slot: body.color,
      star: body.star,
    },
  });
}

function hintText() {
  if (aim || selectedId != null) return null;
  if (world.bodies.length >= MAX_BODIES) return `That's ${MAX_BODIES} bodies. Delete one to launch more.`;
  if (world.bodies.length === 0) return 'Empty sky. Drag to launch something, or pick a system.';
  if (!launchedOnce) return `Drag empty space to launch a ${LAUNCH_SIZES.find((s) => s.id === launchSize).label.toLowerCase()}`;
  return null;
}

function formatNumber(n) {
  return n >= 100 ? String(Math.round(n)) : String(Number(n.toPrecision(3)));
}

function aimFrame() {
  if (!aim) return null;
  const [vx, vy] = aimVelocity(aim.start, aim.end, LAUNCH);
  const mass = LAUNCH_SIZES.find((s) => s.id === launchSize).mass;
  const probe = { x: aim.start[0], y: aim.start[1], vx, vy, radius: radiusOf(mass) };
  const path = predictPath(world.bodies, probe, { G: gravityOf(world), eps: SOFTENING, dt: PREVIEW.dt, steps: PREVIEW.steps });
  return {
    start: aim.start,
    end: aim.end,
    path: { ...path, tickEvery: PREVIEW.tickEvery },
    hit: path.hitId != null,
    label: `speed ${Math.hypot(vx, vy).toFixed(1)}`,
  };
}

// Frame loop

let last = performance.now();
let lastOverlay = 0;

function frame(now) {
  const seconds = (now - last) / 1000;
  last = now;

  if (!paused) {
    const owed = stepsFor(carry, seconds, { rate: SIM_RATE, speed, dt: DT, maxFrame: MAX_FRAME_SECONDS, maxSteps: MAX_STEPS_PER_FRAME });
    carry = owed.carry;
    if (owed.steps > 0) {
      const result = advance(world, owed.steps);
      world = result.world;
      for (const m of result.merges) {
        if (selectedId === m.from) selectedId = m.into;
        if (!reducedMotion.matches) flashes.push({ x: m.x, y: m.y, radius: bodyById(world, m.into)?.radius ?? 4, born: now });
      }
      if (!bodyById(world, selectedId)) selectedId = null;
      if (trailsOn) trails.record(world.bodies, world.time);
      if (result.merges.length) refresh();
      dirty = true;
    }
  }

  if (world.bodies.length) {
    const c = centerOfMass(world.bodies);
    const next = [approach(center[0], c.x, seconds, CAMERA_HALF_LIFE), approach(center[1], c.y, seconds, CAMERA_HALF_LIFE)];
    if (Math.abs(next[0] - center[0]) + Math.abs(next[1] - center[1]) > 1e-3) dirty = true;
    center = next;
  }

  flashes = flashes.filter((f) => now - f.born < FLASH_SECONDS * 1000);
  if (dirty || flashes.length || aim) {
    renderer.draw({
      bodies: world.bodies,
      camera: camera(),
      trails: trailsOn ? trails : null,
      selectedId,
      aim: aimFrame(),
      flashes: flashes.map((f) => ({ ...f, age: (now - f.born) / (FLASH_SECONDS * 1000) })),
      origin: center,
    });
    dirty = false;
  }

  // The inspector's speed changes every frame; text updates 10× a second are plenty.
  if (now - lastOverlay > 100) {
    lastOverlay = now;
    updateOverlay();
  }
  requestAnimationFrame(frame);
}

// Keyboard: Space pauses, Delete removes the selected body, Escape deselects.
document.addEventListener('keydown', (event) => {
  if (event.target.closest('input, button')) return;
  if (event.key === ' ' && !event.repeat) {
    event.preventDefault();
    setPaused(!paused);
  } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId != null) {
    event.preventDefault();
    deleteSelected();
  } else if (event.key === 'Escape') {
    select(null);
  }
});

refresh();
requestAnimationFrame(frame);
