// Place packs: JSON files of places to guess. Validation is pure; loading
// takes an injectable fetch so it also runs under Node.

const TIERS = [1, 2, 3];

/**
 * Check a parsed pack and return it, or throw naming the first problem.
 * @param {unknown} pack
 * @returns {{id: string, name: string, map: string, scoreScaleKm: number,
 *            places: Array<{name: string, detail?: string, lat: number, lon: number, tier: number, region: string, clue?: object}>}}
 */
export function validatePack(pack) {
  const fail = (message) => {
    throw new Error(`Invalid pack${pack?.id ? ` "${pack.id}"` : ''}: ${message}`);
  };
  if (!pack || typeof pack !== 'object') fail('not an object');
  for (const key of ['id', 'name', 'map']) {
    if (typeof pack[key] !== 'string' || !pack[key]) fail(`missing "${key}"`);
  }
  if (!(pack.scoreScaleKm > 0)) fail('"scoreScaleKm" must be a positive number');
  if (!Array.isArray(pack.places) || pack.places.length === 0) fail('"places" must be a non-empty array');
  pack.places.forEach((place, i) => {
    const where = `place ${i} (${place?.name ?? '?'})`;
    if (typeof place?.name !== 'string' || !place.name) fail(`${where}: missing name`);
    if (place.detail != null && typeof place.detail !== 'string') fail(`${where}: detail must be text`);
    if (!(Math.abs(place.lat) <= 90)) fail(`${where}: lat out of range`);
    if (!(Math.abs(place.lon) <= 180)) fail(`${where}: lon out of range`);
    if (!TIERS.includes(place.tier)) fail(`${where}: tier must be 1, 2 or 3`);
    if (typeof place.region !== 'string' || !place.region) fail(`${where}: missing region`);
    if (place.clue != null && typeof place.clue?.type !== 'string') fail(`${where}: clue needs a type`);
  });
  return pack;
}

/**
 * Fetch and validate a pack.
 * @param {string | URL} url
 * @param {typeof fetch} [fetchFn]
 * @returns {Promise<object>} validated pack
 */
export async function loadPack(url, fetchFn = fetch) {
  const response = await fetchFn(url);
  if (!response.ok) throw new Error(`Could not load ${url} (${response.status})`);
  return validatePack(await response.json());
}
