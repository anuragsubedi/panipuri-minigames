// Entry point: owns the world and the frame loop, turns pointer and control
// intents into world transitions, and hands each frame to the renderer.
// A toy, so there is no phase machine: one continuous loop.

import { createRng, seedFromQuery } from '../../../shared/js/rng.js';
import { el } from '../../../shared/js/dom.js';
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
  ZOOM,
  TRAIL,
  PALETTE_SIZE,
  MAX_SAVES,
} from './config.js';
import { centerOfMass, radiusOf, nameOf } from './sim/bodies.js';
import { PRESETS, presetById } from './sim/presets.js';
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
import { toSnapshot, fromSnapshot } from './sim/snapshot.js';
import { predictPath } from './physics/predict.js';
import { createCamera, approach, bodyAt } from './view/camera.js';
import { createTrails } from './view/trails.js';
import { formatElapsed, formatDate, formatRate, formatMass, formatSpeed, formatDistance } from './view/format.js';
import { loadSaves, storeSaves } from './storage.js';
import { createRenderer } from './ui/canvas-renderer.js';
import { createLauncher } from './ui/launcher.js';
import { createControls } from './ui/controls.js';
import { createSkyOverlay } from './ui/sky-overlay.js';
import { createSystemsSheet } from './ui/systems-sheet.js';

const FLASH_SECONDS = 0.6;
const CAMERA_HALF_LIFE = 0.35;
const MIN_HIT_PX = 22;
const MAX_NAME_LENGTH = 40;

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const darkScheme = matchMedia('(prefers-color-scheme: dark)');
const rng = createRng(seedFromQuery(location.search));

let world = createWorld({ presetId: PRESETS[0].id, rng });
// Where the current system came from, so Reset can restart it.
let source = { label: PRESETS[0].label, presetId: PRESETS[0].id, snapshot: null };
let viewRadius = PRESETS[0].view;
let speed = reducedMotion.matches ? 0.25 : DEFAULT_SPEED;
let paused = false;
let trailsOn = true;
let launchSize = DEFAULT_LAUNCH_SIZE;
let selectedId = null;
let aim = null;
let listOpen = false;
let launchedOnce = false;
let zoomedOnce = false;
let flashes = [];
let carry = 0;
let center = [0, 0];
let size = { width: 1, height: 1 };
let dirty = true;
let saves = loadSaves();

const trails = createTrails(TRAIL);

// DOM

const canvas = el('canvas', {
  class: 'sky__canvas',
  attrs: { role: 'img', 'aria-label': 'Solar system. Drag from empty space to launch a body, tap a body to select it, pinch or scroll to zoom.' },
});
const overlay = createSkyOverlay({
  onResume: () => setPaused(false),
  onDelete: deleteSelected,
  onDeselect: () => select(null),
  onSelect: select,
  onToggleList: () => {
    listOpen = !listOpen;
    updateOverlay();
  },
  onZoom: (steps) => zoomBy(ZOOM.buttonFactor ** steps),
});
const sky = el('div', { class: 'sky' }, [canvas, overlay.el]);
const sheet = createSystemsSheet(
  { presets: PRESETS, maxNameLength: MAX_NAME_LENGTH },
  {
    onPick: (presetId) => loadPreset(presetId),
    onLoad: (i) => {
      const restored = fromSnapshot(saves[i]);
      if (restored) loadSnapshot(saves[i], restored);
    },
    onDelete: (i) => {
      saves = saves.filter((_, j) => j !== i);
      storeSaves(saves);
      sheet.update(sheetView());
    },
    onSave: (name) => {
      const snapshot = toSnapshot(world, { name, view: viewRadius, savedAt: Date.now() });
      const next = [snapshot, ...saves.filter((s) => s.name !== name)].slice(0, MAX_SAVES);
      if (!storeSaves(next)) return false;
      saves = next;
      source = { label: name, presetId: null, snapshot };
      sheet.update(sheetView());
      refresh();
      return true;
    },
  },
);
const controls = createControls(
  { speeds: SPEEDS, launchSizes: LAUNCH_SIZES, gravityRange: GRAVITY_RANGE, starMassRange: STAR_MASS_RANGE },
  {
    onTogglePause: () => setPaused(!paused),
    onSpeed: (s) => {
      speed = s;
      setPaused(false);
    },
    onReset: restart,
    onOpenSystems: () => sheet.open(sheetView()),
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
document.getElementById('app').append(sky, controls.el, sheet.el);

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

const camera = () => createCamera({ ...size, cx: center[0], cy: center[1], viewRadius });

createLauncher(canvas, {
  minDragPx: LAUNCH.minDragPx,
  wheelPerPixel: ZOOM.wheelPerPixel,
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
    const [vx, vy] = aimVelocity(start, end, launchTuning());
    const { mass } = LAUNCH_SIZES.find((s) => s.id === launchSize);
    world = launch(world, { x: start[0], y: start[1], vx, vy, mass, color: world.nextId % PALETTE_SIZE });
    launchedOnce = true;
    refresh();
  },
  onZoom: zoomBy,
});

// Zoomed out, the same drag covers more sky; scale launch speed like orbital
// speed (∝ 1/√r) so a drag feels the same at every zoom.
function launchTuning() {
  return { ...LAUNCH, speedPerUnit: LAUNCH.speedPerUnit * (VIEW_RADIUS / viewRadius) ** 1.5 };
}

// Transitions

function commit(next) {
  world = next;
  if (!bodyById(world, selectedId)) selectedId = null;
  refresh();
}

function startFresh(next, view) {
  world = next;
  viewRadius = view;
  selectedId = null;
  flashes = [];
  carry = 0;
  trails.clear();
  const c = centerOfMass(world.bodies);
  center = [c.x, c.y];
  refresh();
}

function loadPreset(presetId) {
  const preset = presetById(presetId);
  source = { label: preset.label, presetId, snapshot: null };
  startFresh(createWorld({ presetId, rng, gravity: world.gravity, starMass: world.starMass, collisions: world.collisions }), preset.view);
}

function loadSnapshot(snapshot, restored) {
  source = { label: restored.name, presetId: null, snapshot };
  startFresh(restored.world, restored.view ?? VIEW_RADIUS);
}

function restart() {
  if (source.snapshot) {
    const restored = fromSnapshot(source.snapshot);
    if (restored) return loadSnapshot(source.snapshot, restored);
  }
  loadPreset(source.presetId ?? PRESETS[0].id);
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

function zoomBy(factor) {
  viewRadius = Math.min(ZOOM.max, Math.max(ZOOM.min, viewRadius * factor));
  if (!zoomedOnce) {
    zoomedOnce = true;
    updateOverlay();
  }
  dirty = true;
}

// Views

function sheetView() {
  return {
    saves: saves.map((s) => ({
      name: typeof s.name === 'string' ? s.name : 'Saved system',
      detail: `${s.bodies?.length ?? 0} bodies, ${clockText(s.epoch, s.time ?? 0)}`,
    })),
    defaultName: `${PRESETS.find((p) => p.id === world.presetId)?.label ?? 'My system'}, ${clockText(world.epoch, world.time)}`.slice(0, MAX_NAME_LENGTH),
  };
}

function clockText(epoch, time) {
  return epoch != null ? formatDate(epoch, time) : formatElapsed(time);
}

function slotOf(body) {
  return body.star ? 'star' : String(body.color);
}

function refresh() {
  dirty = true;
  controls.update({
    paused,
    speed,
    systemLabel: source.label,
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
  const star = heaviestStar();
  overlay.update({
    time: clockText(world.epoch, world.time),
    rate: paused ? 'Paused' : formatRate(SIM_RATE * speed),
    count: world.bodies.length,
    paused,
    listOpen,
    selectedId,
    heaviest: listOpen
      ? [...world.bodies].sort((a, b) => b.mass - a.mass).map((b) => ({ id: b.id, name: nameOf(b), mass: formatMass(b.mass, b.star), slot: slotOf(b) }))
      : [],
    hint: hint(),
    selected: body && {
      name: nameOf(body),
      mass: formatMass(body.mass, body.star),
      speed: formatSpeed(Math.hypot(body.vx, body.vy)),
      distance: star && star !== body ? formatDistance(Math.hypot(body.x - star.x, body.y - star.y)) : null,
      slot: slotOf(body),
    },
  });
}

function heaviestStar() {
  let best = null;
  for (const b of world.bodies) if (b.star && (!best || b.mass > best.mass)) best = b;
  return best;
}

function hint() {
  if (aim || selectedId != null || listOpen) return null;
  if (world.bodies.length >= MAX_BODIES) return { icon: 'fling', text: `That's ${MAX_BODIES} bodies. Delete one to launch more.` };
  if (world.bodies.length === 0) return { icon: 'fling', text: 'Empty sky. Drag to launch something, or pick a system.' };
  if (!zoomedOnce && source.presetId === 'solar') return { icon: 'pinch', text: 'Pinch or scroll to zoom out' };
  if (!launchedOnce) return { icon: 'fling', text: `Drag empty space to launch ${LAUNCH_SIZES.find((s) => s.id === launchSize).noun}` };
  return null;
}

function aimFrame() {
  if (!aim) return null;
  const [vx, vy] = aimVelocity(aim.start, aim.end, launchTuning());
  const { mass } = LAUNCH_SIZES.find((s) => s.id === launchSize);
  const probe = { x: aim.start[0], y: aim.start[1], vx, vy, radius: radiusOf(mass) };
  // Preview step scales with zoom so the path reaches across the view.
  const dt = PREVIEW.dt * Math.max(1, (viewRadius / VIEW_RADIUS) ** 1.5);
  const path = predictPath(world.bodies, probe, { G: gravityOf(world), eps: SOFTENING, dt, steps: PREVIEW.steps });
  return {
    start: aim.start,
    end: aim.end,
    path: { ...path, tickEvery: PREVIEW.tickEvery },
    hit: path.hitId != null,
    label: `${formatSpeed(Math.hypot(vx, vy))} km/s`,
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
      if (result.merges.length) refresh();
      dirty = true;
    }
  }
  if (trailsOn && dirty) trails.record(world.bodies, viewRadius / TRAIL.perView);

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
      viewRadius,
    });
    dirty = false;
  }

  // The clock, inspector and list change every frame; 10 text updates a second are plenty.
  if (now - lastOverlay > 100) {
    lastOverlay = now;
    updateOverlay();
  }
  requestAnimationFrame(frame);
}

// Keyboard: Space pauses, Delete removes the selected body, Escape deselects, +/− zoom.
document.addEventListener('keydown', (event) => {
  if (sheet.el.open || event.target.closest('input, button')) return;
  if (event.key === ' ' && !event.repeat) {
    event.preventDefault();
    setPaused(!paused);
  } else if ((event.key === 'Delete' || event.key === 'Backspace') && selectedId != null) {
    event.preventDefault();
    deleteSelected();
  } else if (event.key === 'Escape') {
    select(null);
  } else if (event.key === '+' || event.key === '=') {
    zoomBy(1 / ZOOM.buttonFactor);
  } else if (event.key === '-') {
    zoomBy(ZOOM.buttonFactor);
  }
});

refresh();
requestAnimationFrame(frame);
