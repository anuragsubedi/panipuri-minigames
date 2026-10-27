// Color space conversions.
// Shapes: HSB {h: 0–360, s: 0–100, b: 0–100}, RGB {r, g, b: 0–255 floats},
// Lab {L, a, b} (CIELAB, D65 white point).

// D65 reference white, Y normalized to 1.
const WHITE_D65 = { x: 0.95047, y: 1.0, z: 1.08883 };

/**
 * HSB (a.k.a. HSV) → sRGB. Channels are unrounded floats in 0–255.
 * @param {{h: number, s: number, b: number}} hsb
 * @returns {{r: number, g: number, b: number}}
 */
export function hsbToRgb({ h, s, b }) {
  const sat = s / 100;
  const val = b / 100;
  const channel = (n) => {
    const k = (n + h / 60) % 6;
    return 255 * (val - val * sat * Math.max(0, Math.min(k, 4 - k, 1)));
  };
  return { r: channel(5), g: channel(3), b: channel(1) };
}

/**
 * sRGB → "#rrggbb".
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {string}
 */
export function rgbToHex({ r, g, b }) {
  const hex = (v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

/**
 * sRGB → CIELAB (D65).
 * @param {{r: number, g: number, b: number}} rgb
 * @returns {{L: number, a: number, b: number}}
 */
export function rgbToLab({ r, g, b }) {
  const lr = srgbToLinear(r / 255);
  const lg = srgbToLinear(g / 255);
  const lb = srgbToLinear(b / 255);

  const x = 0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = 0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb;

  const fx = labF(x / WHITE_D65.x);
  const fy = labF(y / WHITE_D65.y);
  const fz = labF(z / WHITE_D65.z);

  return { L: 116 * fy - 16, a: 500 * (fx - fy), b: 200 * (fy - fz) };
}

/**
 * HSB → CSS hex string. Convenience for rendering.
 * @param {{h: number, s: number, b: number}} hsb
 * @returns {string}
 */
export function hsbToHex(hsb) {
  return rgbToHex(hsbToRgb(hsb));
}

/**
 * HSB → CIELAB. Convenience for scoring.
 * @param {{h: number, s: number, b: number}} hsb
 * @returns {{L: number, a: number, b: number}}
 */
export function hsbToLab(hsb) {
  return rgbToLab(hsbToRgb(hsb));
}

function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// CIE Lab companding function, with the linear segment near black.
function labF(t) {
  const EPSILON = 216 / 24389;
  const KAPPA = 24389 / 27;
  return t > EPSILON ? Math.cbrt(t) : (KAPPA * t + 16) / 116;
}

function clamp(v, min, max) {
  return Math.min(max, Math.max(min, v));
}
