// Places that are lines or areas (rivers, parks, lakes): the target point for
// a guess is the nearest point of the shape, or the guess itself when it lands
// inside an area. Pure.
//
// A shape is {kind: 'line' | 'area', paths: Array<Array<[lon, lat]>>}; an
// area's paths are rings, combined even-odd so holes work.

/**
 * The point of the shape closest to a pin.
 * @param {{lat: number, lon: number}} point
 * @param {{kind: string, paths: number[][][]}} shape
 * @returns {{lat: number, lon: number}}
 */
export function nearestOnShape(point, shape) {
  if (shape.kind === 'area' && insideArea(point, shape.paths)) return { lat: point.lat, lon: point.lon };
  // Local flat projection around the pin (x scaled by cos lat): close enough for
  // picking the nearest segment at country scale; the distance itself is then haversine.
  const k = Math.cos((point.lat * Math.PI) / 180);
  let best = null;
  let bestD2 = Infinity;
  for (const path of shape.paths) {
    for (let i = 0; i < path.length; i++) {
      const [lon1, lat1] = path[i];
      const [lon2, lat2] = path[i + 1] ?? (shape.kind === 'area' ? path[0] : path[i]);
      const ax = (lon1 - point.lon) * k;
      const ay = lat1 - point.lat;
      const dx = (lon2 - lon1) * k;
      const dy = lat2 - lat1;
      const len2 = dx * dx + dy * dy;
      const t = len2 ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / len2)) : 0;
      const x = ax + t * dx;
      const y = ay + t * dy;
      const d2 = x * x + y * y;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = { lat: lat1 + t * dy, lon: lon1 + t * (lon2 - lon1) };
      }
    }
  }
  return best ?? { lat: point.lat, lon: point.lon };
}

/**
 * Even-odd point-in-polygon over all rings.
 * @param {{lat: number, lon: number}} point
 * @param {number[][][]} rings arrays of [lon, lat]
 * @returns {boolean}
 */
export function insideArea(point, rings) {
  let inside = false;
  for (const ring of rings) {
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > point.lat !== yj > point.lat && point.lon < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
  }
  return inside;
}
