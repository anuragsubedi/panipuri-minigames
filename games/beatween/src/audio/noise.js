// Background noise sample generation. Pure: arrays in, arrays out.

/**
 * Pink noise (−3 dB/octave) via Paul Kellet's economy filter, peak-normalized.
 * @param {number} length samples
 * @param {() => number} rng floats in [0, 1)
 * @returns {Float32Array}
 */
export function pinkNoise(length, rng) {
  const out = new Float32Array(length);
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  for (let i = 0; i < length; i++) {
    const white = rng() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    out[i] = b0 + b1 + b2 + white * 0.1848;
  }
  return normalize(out);
}

/**
 * Brown noise (−6 dB/octave): leaky-integrated white noise, peak-normalized.
 * @param {number} length samples
 * @param {() => number} rng floats in [0, 1)
 * @returns {Float32Array}
 */
export function brownNoise(length, rng) {
  const out = new Float32Array(length);
  let last = 0;
  for (let i = 0; i < length; i++) {
    last = (last + 0.02 * (rng() * 2 - 1)) / 1.02;
    out[i] = last;
  }
  return normalize(out);
}

/**
 * Make a buffer loop without a click: crossfade its last `fade` samples into
 * its first ones, then drop that tail. The result is `fade` samples shorter.
 * @param {Float32Array} samples
 * @param {number} fade samples (< samples.length / 2)
 * @returns {Float32Array}
 */
export function makeLoopable(samples, fade) {
  const length = samples.length - fade;
  const out = samples.slice(0, length);
  for (let i = 0; i < fade; i++) {
    const t = i / fade;
    out[i] = samples[i] * t + samples[length + i] * (1 - t);
  }
  return out;
}

// Remove DC offset and scale the peak to 0.9.
function normalize(samples, peak = 0.9) {
  let mean = 0;
  for (const s of samples) mean += s;
  mean /= samples.length || 1;
  let max = 0;
  for (let i = 0; i < samples.length; i++) {
    samples[i] -= mean;
    max = Math.max(max, Math.abs(samples[i]));
  }
  if (max > 0) {
    const k = peak / max;
    for (let i = 0; i < samples.length; i++) samples[i] *= k;
  }
  return samples;
}
