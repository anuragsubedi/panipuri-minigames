// Web Audio graph:
//   left sine  ─┐
//               ├─ merger (L/R) ─┐
//   right sine ─┘                ├─ master gain ─ speakers
//   noise loop ── noise gain ────┘   (mono noise plays in both ears)
// The context is created on the first Play (browsers require a user gesture)
// and suspended after each fade-out to save battery.

import { AUDIO } from '../config.js';
import { pinkNoise, brownNoise, makeLoopable } from './noise.js';

const NOISE_GENERATORS = { pink: pinkNoise, brown: brownNoise };

/**
 * @returns {{
 *   play: (settings: object) => Promise<void>,
 *   stop: (fadeSeconds?: number) => void,
 *   update: (settings: object) => void,
 *   isPlaying: () => boolean,
 * }}
 */
export function createEngine() {
  let ctx = null;
  let nodes = null;
  let playing = false;
  let noiseType = 'off';
  let noiseSource = null;
  let suspendTimer = 0;
  const noiseBuffers = {};

  function ensureGraph() {
    if (ctx) return;
    // iOS: play even when the ring/silent switch is on silent (Safari 16.4+).
    try {
      if (navigator.audioSession) navigator.audioSession.type = 'playback';
    } catch {
      // Not supported; the UI hint covers it.
    }
    ctx = new AudioContext();
    const left = ctx.createOscillator();
    const right = ctx.createOscillator();
    const merger = ctx.createChannelMerger(2);
    const master = ctx.createGain();
    const noiseGain = ctx.createGain();
    left.type = 'sine';
    right.type = 'sine';
    master.gain.value = 0;
    noiseGain.gain.value = AUDIO.noiseLevel;
    left.connect(merger, 0, 0);
    right.connect(merger, 0, 1);
    merger.connect(master);
    noiseGain.connect(master);
    master.connect(ctx.destination);
    left.start();
    right.start();
    nodes = { left, right, master, noiseGain };
  }

  function smooth(param, value) {
    param.setTargetAtTime(value, ctx.currentTime, AUDIO.paramSmoothing);
  }

  function ramp(param, value, seconds) {
    const now = ctx.currentTime;
    param.cancelScheduledValues(now);
    param.setValueAtTime(param.value, now);
    param.linearRampToValueAtTime(value, now + seconds);
  }

  function gainFor(volume) {
    return volume * volume * AUDIO.maxGain;
  }

  function noiseBuffer(type) {
    if (!noiseBuffers[type]) {
      const rate = ctx.sampleRate;
      const raw = NOISE_GENERATORS[type](Math.round(rate * AUDIO.noiseSeconds), Math.random);
      const samples = makeLoopable(raw, Math.round(rate * AUDIO.noiseCrossfadeSeconds));
      const buffer = ctx.createBuffer(1, samples.length, rate);
      buffer.copyToChannel(samples, 0);
      noiseBuffers[type] = buffer;
    }
    return noiseBuffers[type];
  }

  function setNoise(type) {
    if (type === noiseType) return;
    noiseType = type;
    if (noiseSource) {
      noiseSource.stop();
      noiseSource.disconnect();
      noiseSource = null;
    }
    if (type === 'off') return;
    noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer(type);
    noiseSource.loop = true;
    noiseSource.connect(nodes.noiseGain);
    noiseSource.start();
  }

  function update(settings) {
    if (!ctx) return;
    smooth(nodes.left.frequency, settings.left);
    smooth(nodes.right.frequency, settings.right);
    setNoise(settings.noise);
    if (playing) smooth(nodes.master.gain, gainFor(settings.volume));
  }

  async function play(settings) {
    ensureGraph();
    clearTimeout(suspendTimer);
    playing = true;
    nodes.left.frequency.value = settings.left;
    nodes.right.frequency.value = settings.right;
    setNoise(settings.noise);
    await ctx.resume();
    ramp(nodes.master.gain, gainFor(settings.volume), AUDIO.fadeInSeconds);
  }

  function stop(fadeSeconds = AUDIO.fadeOutSeconds) {
    if (!ctx || !playing) return;
    playing = false;
    ramp(nodes.master.gain, 0, fadeSeconds);
    clearTimeout(suspendTimer);
    suspendTimer = setTimeout(() => {
      if (!playing) ctx.suspend();
    }, fadeSeconds * 1000 + 100);
  }

  return { play, stop, update, isPlaying: () => playing };
}
