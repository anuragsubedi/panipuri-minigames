import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRng } from '../../shared/js/rng.js';
import { pinkNoise, brownNoise, makeLoopable } from '../../games/beatween/src/audio/noise.js';

const stats = (samples) => {
  let sum = 0;
  let peak = 0;
  for (const s of samples) {
    sum += s;
    peak = Math.max(peak, Math.abs(s));
  }
  return { mean: sum / samples.length, peak };
};

for (const [name, generate] of [['pink', pinkNoise], ['brown', brownNoise]]) {
  test(`${name} noise: right length, finite, centered, peak 0.9`, () => {
    const samples = generate(48000, createRng(7));
    assert.equal(samples.length, 48000);
    assert.ok(samples.every(Number.isFinite));
    const { mean, peak } = stats(samples);
    assert.ok(Math.abs(mean) < 1e-3, `mean ${mean}`);
    assert.ok(Math.abs(peak - 0.9) < 1e-6, `peak ${peak}`);
  });
}

test('makeLoopable: shorter by the fade, and the seam is as smooth as the rest', () => {
  const samples = brownNoise(20000, createRng(3));
  const loop = makeLoopable(samples, 1000);
  assert.equal(loop.length, 19000);
  let maxStep = 0;
  for (let i = 1; i < loop.length; i++) maxStep = Math.max(maxStep, Math.abs(loop[i] - loop[i - 1]));
  const seam = Math.abs(loop[0] - loop[loop.length - 1]);
  assert.ok(seam <= maxStep, `seam ${seam} vs largest step ${maxStep}`);
});
