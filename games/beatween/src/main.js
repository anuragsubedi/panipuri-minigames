// Entry point: holds the settings, drives the audio engine and updates every
// control in place (no re-render, so sliders keep working mid-drag).

import { el } from '../../../shared/js/dom.js';
import { FREQ_RANGE, BEAT_STEP, BANDS, PRESETS, AUDIO } from './config.js';
import { bandFor } from './tone/bands.js';
import {
  createSettings,
  setChannel,
  stepChannel,
  beatOf,
  nudgeBeat,
  toggleLink,
  setVolume,
  cycleNoise,
  cycleTimer,
  applyPreset,
  matchesPreset,
} from './state/settings.js';
import { createEngine } from './audio/engine.js';
import { loadSettings, saveSettings } from './storage.js';
import { createScope } from './ui/scope.js';
import { createBeatControl } from './ui/beat-control.js';
import { createChannelPanel } from './ui/channel-panel.js';
import { createLinkToggle } from './ui/link-toggle.js';
import { createPresets } from './ui/presets.js';
import { createTransport } from './ui/transport.js';

const engine = createEngine();
let settings = createSettings(loadSettings() ?? {});
let playing = false;
let sessionEndsAt = null;
let sessionTimeout = 0;
let wakeLock = null;

const scope = createScope({ onPlay: togglePlay });
const beat = createBeatControl({ step: BEAT_STEP, onNudge: (delta) => commit(nudgeBeat(settings, delta)) });
const channel = (side) =>
  createChannelPanel({
    side,
    range: FREQ_RANGE,
    onSet: (freq) => commit(setChannel(settings, side, freq)),
    onStep: (op) => commit(stepChannel(settings, side, op)),
  });
const left = channel('left');
const right = channel('right');
const link = createLinkToggle({ onToggle: () => commit(toggleLink(settings)) });
const presets = createPresets({ presets: PRESETS, onApply: (preset) => commit(applyPreset(settings, preset)) });
const transport = createTransport({
  onTogglePlay: togglePlay,
  onVolume: (v) => commit(setVolume(settings, v)),
  onCycleTimer: () => {
    commit(cycleTimer(settings));
    if (playing) startSessionTimer();
  },
  onCycleNoise: () => commit(cycleNoise(settings)),
});

scope.overlay.append(beat.el);
document.getElementById('app').append(
  scope.el,
  el('div', { class: 'deck' }, [
    el('div', { class: 'channels' }, [left.el, link.el, right.el]),
    presets.el,
    transport.el,
  ]),
);

function commit(next) {
  settings = next;
  engine.update(settings);
  saveSettings(settings);
  render();
}

function render() {
  const beatHz = beatOf(settings);
  scope.update({ left: settings.left, right: settings.right, beat: beatHz, band: bandFor(beatHz, BANDS), playing });
  beat.update(beatHz);
  left.update(settings.left);
  right.update(settings.right);
  link.update(settings.linked);
  presets.update((preset) => matchesPreset(settings, preset));
  transport.update({
    playing,
    volume: settings.volume,
    timerMin: settings.timerMin,
    remainingMs: playing && sessionEndsAt ? Math.max(0, sessionEndsAt - Date.now()) : null,
    noise: settings.noise,
  });
}

async function togglePlay() {
  if (playing) {
    stopPlayback();
    return;
  }
  playing = true;
  render();
  await engine.play(settings);
  startSessionTimer();
  keepScreenAwake();
}

function stopPlayback(fadeSeconds) {
  playing = false;
  engine.stop(fadeSeconds);
  clearTimeout(sessionTimeout);
  sessionEndsAt = null;
  wakeLock?.release().catch(() => {});
  wakeLock = null;
  render();
}

function startSessionTimer() {
  clearTimeout(sessionTimeout);
  sessionEndsAt = settings.timerMin ? Date.now() + settings.timerMin * 60_000 : null;
  if (sessionEndsAt) {
    sessionTimeout = setTimeout(() => stopPlayback(AUDIO.sessionEndFadeSeconds), settings.timerMin * 60_000);
  }
  render();
}

// Phones stop web audio when the screen locks; keep it on while playing.
async function keepScreenAwake() {
  try {
    wakeLock = await navigator.wakeLock?.request('screen');
  } catch {
    wakeLock = null;
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && playing && !wakeLock) keepScreenAwake();
});

// Space toggles play, except while typing or adjusting a control.
document.addEventListener('keydown', (event) => {
  if (event.key !== ' ' || event.repeat) return;
  if (event.target.closest('input, button')) return;
  event.preventDefault();
  togglePlay();
});

setInterval(() => {
  if (playing && sessionEndsAt) render();
}, 1000);

render();
