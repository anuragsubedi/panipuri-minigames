import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FREQ_RANGE, BANDS, PRESETS, BEAT_MAX, VISUAL } from '../../games/beatween/src/config.js';
import { sliderToFreq, freqToSlider } from '../../games/beatween/src/tone/scale.js';
import { bandFor } from '../../games/beatween/src/tone/bands.js';
import {
  createSettings,
  setChannel,
  stepChannel,
  beatOf,
  setBeat,
  nudgeBeat,
  toggleLink,
  setVolume,
  cycleNoise,
  cycleTimer,
  applyPreset,
  matchesPreset,
} from '../../games/beatween/src/state/settings.js';
import { lissajousPoints, visualTempo } from '../../games/beatween/src/visual/lissajous.js';

const close = (a, b, tol = 1e-9) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('scale: endpoints, round trip, octaves get equal travel', () => {
  close(sliderToFreq(0, FREQ_RANGE), FREQ_RANGE.min);
  close(sliderToFreq(1, FREQ_RANGE), FREQ_RANGE.max);
  for (const f of [40, 100, 432, 1200]) close(sliderToFreq(freqToSlider(f, FREQ_RANGE), FREQ_RANGE), f, 1e-6);
  close(freqToSlider(200, FREQ_RANGE) - freqToSlider(100, FREQ_RANGE), freqToSlider(400, FREQ_RANGE) - freqToSlider(200, FREQ_RANGE));
});

test('bands: boundaries', () => {
  assert.equal(bandFor(0, BANDS).name, 'Unison');
  assert.equal(bandFor(2, BANDS).name, 'Delta');
  assert.equal(bandFor(4, BANDS).name, 'Theta');
  assert.equal(bandFor(10, BANDS).name, 'Alpha');
  assert.equal(bandFor(13, BANDS).name, 'Beta');
  assert.equal(bandFor(40, BANDS).name, 'Gamma');
  assert.equal(bandFor(300, BANDS).name, 'Wide');
});

test('createSettings: sanitizes untrusted input', () => {
  const s = createSettings({ left: 'abc', right: 99999, volume: 7, noise: 'purple', timerMin: 13, linked: 0 });
  assert.equal(s.left, 200);
  assert.equal(s.right, FREQ_RANGE.max);
  assert.equal(s.volume, 1);
  assert.equal(s.noise, 'off');
  assert.equal(s.timerMin, 0);
  assert.equal(s.linked, false);
});

test('linked: halving and doubling one ear keeps the beat', () => {
  const s = createSettings({ left: 200, right: 210, linked: true });
  const halved = stepChannel(s, 'left', 'half');
  assert.deepEqual([halved.left, halved.right], [100, 110]);
  const doubled = stepChannel(s, 'right', 'double');
  assert.deepEqual([doubled.left, doubled.right], [410, 420]);
  assert.equal(beatOf(doubled), 10);
});

test('linked: limits keep both ears in range and the beat intact', () => {
  const s = createSettings({ left: 1000, right: 1010, linked: true });
  const up = stepChannel(s, 'left', 'double');
  assert.deepEqual([up.left, up.right], [1190, 1200]);
  const low = setChannel(createSettings({ left: 50, right: 60, linked: true }), 'right', 10);
  assert.deepEqual([low.left, low.right], [40, 50]);
});

test('unlinked: only one ear moves and the beat changes', () => {
  const s = createSettings({ left: 200, right: 210, linked: false });
  const next = stepChannel(s, 'right', 'plus');
  assert.deepEqual([next.left, next.right], [200, 211]);
  assert.equal(beatOf(next), 11);
});

test('frequencies stay on the 0.1 Hz grid without float noise', () => {
  const s = setChannel(createSettings({ linked: true }), 'left', 123.456);
  assert.equal(s.left, 123.5);
  assert.equal(s.right, 133.5);
});

test('beat: set, nudge, clamp, keeps which ear is higher', () => {
  let s = createSettings({ left: 200, right: 210 });
  assert.equal(beatOf(setBeat(s, 6)), 6);
  assert.equal(beatOf(nudgeBeat(s, -0.5)), 9.5);
  assert.equal(beatOf(setBeat(s, 999)), BEAT_MAX);
  assert.equal(beatOf(setBeat(s, -3)), 0);
  s = createSettings({ left: 210, right: 200 });
  const flipped = setBeat(s, 4);
  assert.ok(flipped.right < flipped.left);
  assert.equal(beatOf(flipped), 4);
  const edge = setBeat(createSettings({ left: 1195, right: 1196 }), 20);
  assert.equal(edge.right, FREQ_RANGE.max);
  assert.equal(beatOf(edge), 20);
});

test('toggles and cycles', () => {
  const s = createSettings();
  assert.equal(toggleLink(s).linked, !s.linked);
  assert.equal(setVolume(s, 2).volume, 1);
  assert.equal(cycleNoise(s).noise, 'pink');
  assert.equal(cycleNoise(cycleNoise(cycleNoise(s))).noise, 'off');
  assert.equal(cycleTimer(s).timerMin, 10);
});

test('presets: apply and match', () => {
  for (const preset of PRESETS) {
    const s = applyPreset(createSettings(), preset);
    assert.ok(matchesPreset(s, preset), preset.id);
    assert.equal(beatOf(s), preset.beat);
  }
});

test('lissajous: bounded; equal tones give a circle at 90° and a line at 0°', () => {
  const circle = lissajousPoints({ ratio: 1, phase: Math.PI / 2, samples: 64, turns: 1 });
  for (let i = 0; i < 64; i++) close(circle[i * 2] ** 2 + circle[i * 2 + 1] ** 2, 1, 1e-6);
  const line = lissajousPoints({ ratio: 1, phase: 0, samples: 64, turns: 1 });
  for (let i = 0; i < 64; i++) close(line[i * 2], line[i * 2 + 1], 1e-6);
  const any = lissajousPoints({ ratio: 1.05, phase: 1, samples: 300, turns: 2 });
  assert.equal(any.length, 600);
  assert.ok(any.every((v) => v >= -1 && v <= 1));
});

test('visualTempo: grows with the beat but stays slow', () => {
  assert.ok(visualTempo(10, VISUAL) > visualTempo(2, VISUAL));
  assert.ok(visualTempo(1000, VISUAL) <= VISUAL.tempoMax);
  assert.ok(visualTempo(40, VISUAL) <= 3, 'well under flicker rates');
});
