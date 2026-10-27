// Equirectangular projection: map units are degrees, x = longitude, y = -latitude.
// Linear both ways, so a tap converts to lat/lon without a projection library.

/**
 * Lat/lon → map units.
 * @param {{lat: number, lon: number}} point
 * @returns {{x: number, y: number}}
 */
export function project({ lat, lon }) {
  return { x: lon, y: -lat };
}

/**
 * Map units → lat/lon.
 * @param {{x: number, y: number}} point
 * @returns {{lat: number, lon: number}}
 */
export function unproject({ x, y }) {
  return { lat: -y, lon: x };
}

/**
 * Map-unit rectangle covered by geographic bounds.
 * @param {{west: number, east: number, north: number, south: number}} bounds
 * @returns {{x: number, y: number, w: number, h: number}}
 */
export function boundsRect({ west, east, north, south }) {
  return { x: west, y: -north, w: east - west, h: north - south };
}

/**
 * Keep a lat/lon inside geographic bounds.
 * @param {{lat: number, lon: number}} point
 * @param {{west: number, east: number, north: number, south: number}} bounds
 * @returns {{lat: number, lon: number}}
 */
export function clampToBounds({ lat, lon }, { west, east, north, south }) {
  return { lat: clamp(lat, south, north), lon: clamp(lon, west, east) };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
