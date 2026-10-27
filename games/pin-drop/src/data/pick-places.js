// Which places a game asks about: filtered by fame tier, shuffled with the
// game's seeded rng, and spread across regions so rounds don't cluster.

/**
 * Every place from some packs whose tier is allowed, tagged with its pack's id and score scale.
 * @param {Array<{id: string, scoreScaleKm: number, places: object[]}>} packs
 * @param {number[]} tiers
 * @returns {object[]}
 */
export function poolFor(packs, tiers) {
  return packs.flatMap((pack) =>
    pack.places.filter((p) => tiers.includes(p.tier)).map((p) => ({ ...p, packId: pack.id, scaleKm: pack.scoreScaleKm })),
  );
}

/**
 * Draw `count` distinct places. Each pick prefers a region not used since the
 * last time every region had a turn.
 * @param {object[]} pool places with a `region`
 * @param {number} count
 * @param {() => number} rng floats in [0, 1)
 * @returns {object[]}
 */
export function pickPlaces(pool, count, rng) {
  if (pool.length < count) throw new RangeError(`Need ${count} places, pack has ${pool.length}`);
  const remaining = shuffle(pool, rng);
  const regions = new Set(pool.map((p) => p.region));
  const used = new Set();
  const picks = [];
  while (picks.length < count) {
    if ([...regions].every((r) => used.has(r) || !remaining.some((p) => p.region === r))) used.clear();
    const index = remaining.findIndex((p) => !used.has(p.region));
    const [place] = remaining.splice(index, 1);
    used.add(place.region);
    picks.push(place);
  }
  return picks;
}

/**
 * Fisher–Yates shuffle into a new array.
 * @param {T[]} items
 * @param {() => number} rng
 * @returns {T[]}
 * @template T
 */
export function shuffle(items, rng) {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}
