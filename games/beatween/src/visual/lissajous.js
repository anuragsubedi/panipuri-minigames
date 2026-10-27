// Geometry for the XY scope: x follows the left ear, y the right.

/**
 * Points of x = sin(θ), y = sin(ratio·θ + phase) for θ over `turns` full turns.
 * Equal tones trace an ellipse that breathes between a line and a circle as
 * the phase moves; an octave (ratio 2) traces a figure-eight.
 * @param {{ratio: number, phase: number, samples: number, turns: number}} options
 * @returns {Float32Array} interleaved [x0, y0, x1, y1, …] in [-1, 1]
 */
export function lissajousPoints({ ratio, phase, samples, turns }) {
  const out = new Float32Array(samples * 2);
  const span = Math.PI * 2 * turns;
  for (let i = 0; i < samples; i++) {
    const theta = (span * i) / (samples - 1);
    out[i * 2] = Math.sin(theta);
    out[i * 2 + 1] = Math.sin(ratio * theta + phase);
  }
  return out;
}

/**
 * How fast (Hz) the figure morphs for a given beat: slowed and capped so it
 * never flickers.
 * @param {number} beat Hz
 * @param {{tempoBase: number, tempoPerHz: number, tempoMax: number}} visual
 * @returns {number}
 */
export function visualTempo(beat, { tempoBase, tempoPerHz, tempoMax }) {
  return Math.min(tempoMax, tempoBase + beat * tempoPerHz);
}
