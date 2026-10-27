// Perceptual color difference.

const DEG = Math.PI / 180;
const POW25_7 = 25 ** 7;

/**
 * CIEDE2000 color difference between two CIELAB colors (kL = kC = kH = 1).
 * Follows Sharma, Wu & Dalal (2005), "The CIEDE2000 Color-Difference Formula".
 * @param {{L: number, a: number, b: number}} lab1
 * @param {{L: number, a: number, b: number}} lab2
 * @returns {number} ΔE00 (0 = identical; ~2.3 ≈ just noticeable)
 */
export function deltaE2000(lab1, lab2) {
  const { L: L1, a: a1, b: b1 } = lab1;
  const { L: L2, a: a2, b: b2 } = lab2;

  // Step 1: adjust a* to compensate for blue-region non-uniformity.
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cbar7 = ((C1 + C2) / 2) ** 7;
  const G = 0.5 * (1 - Math.sqrt(Cbar7 / (Cbar7 + POW25_7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const h1p = hueAngle(a1p, b1);
  const h2p = hueAngle(a2p, b2);

  // Step 2: differences in lightness, chroma and hue.
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp / 2) * DEG);

  // Step 3: weighting functions.
  const Lbarp = (L1 + L2) / 2;
  const Cbarp = (C1p + C2p) / 2;
  const hbarp = meanHue(h1p, h2p, C1p * C2p);

  const T =
    1 -
    0.17 * Math.cos((hbarp - 30) * DEG) +
    0.24 * Math.cos(2 * hbarp * DEG) +
    0.32 * Math.cos((3 * hbarp + 6) * DEG) -
    0.2 * Math.cos((4 * hbarp - 63) * DEG);
  const dTheta = 30 * Math.exp(-(((hbarp - 275) / 25) ** 2));
  const Cbarp7 = Cbarp ** 7;
  const RC = 2 * Math.sqrt(Cbarp7 / (Cbarp7 + POW25_7));
  const SL = 1 + (0.015 * (Lbarp - 50) ** 2) / Math.sqrt(20 + (Lbarp - 50) ** 2);
  const SC = 1 + 0.045 * Cbarp;
  const SH = 1 + 0.015 * Cbarp * T;
  const RT = -Math.sin(2 * dTheta * DEG) * RC;

  const l = dLp / SL;
  const c = dCp / SC;
  const h = dHp / SH;
  return Math.sqrt(l * l + c * c + h * h + RT * c * h);
}

// Hue angle in degrees, 0–360.
function hueAngle(a, b) {
  if (a === 0 && b === 0) return 0;
  const h = Math.atan2(b, a) / DEG;
  return h >= 0 ? h : h + 360;
}

// Mean of two hue angles, taking the short way around the circle.
function meanHue(h1, h2, chromaProduct) {
  if (chromaProduct === 0) return h1 + h2;
  if (Math.abs(h1 - h2) <= 180) return (h1 + h2) / 2;
  return h1 + h2 < 360 ? (h1 + h2 + 360) / 2 : (h1 + h2 - 360) / 2;
}
