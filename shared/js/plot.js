// Tiny SVG plotting helper for the "How it works" pages. Pure.

/**
 * SVG path data for y = fn(x), mapped into a w × h box (y grows upward).
 * @param {(x: number) => number} fn
 * @param {{x0: number, x1: number, y0: number, y1: number, w: number, h: number, samples?: number}} box
 * @returns {string} e.g. "M0,100L1.5,98.2…"
 */
export function curvePath(fn, { x0, x1, y0, y1, w, h, samples = 200 }) {
  const parts = [];
  for (let i = 0; i <= samples; i++) {
    const x = x0 + ((x1 - x0) * i) / samples;
    const px = ((x - x0) / (x1 - x0)) * w;
    const py = h - ((fn(x) - y0) / (y1 - y0)) * h;
    parts.push(`${i ? 'L' : 'M'}${round(px)},${round(py)}`);
  }
  return parts.join('');
}

function round(n) {
  return Math.round(n * 10) / 10;
}
