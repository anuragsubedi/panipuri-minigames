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
 * Draw `count` distinct places. Each pick prefers a place whose region (and
 * pack, so Mix rotates topics) hasn't been used since every value had a turn.
 * @param {object[]} pool places with `region` and `packId`
 * @param {number} count
 * @param {() => number} rng floats in [0, 1)
 * @returns {object[]}
 */
export function pickPlaces(pool, count, rng) {
  if (pool.length < count) throw new RangeError(`Need ${count} places, pack has ${pool.length}`);
  const remaining = shuffle(pool, rng);
  const spreads = ['region', 'packId'].map((key) => ({ key, used: new Set() }));
  const picks = [];
  while (picks.length < count) {
    for (const { key, used } of spreads) {
      if (remaining.every((p) => used.has(p[key]))) used.clear();
    }
    // First place in shuffled order that is fresh on the most keys.
    const fresh = (p) => spreads.filter(({ key, used }) => !used.has(p[key])).length;
    let index = 0;
    for (let i = 1; i < remaining.length && fresh(remaining[index]) < spreads.length; i++) {
      if (fresh(remaining[i]) > fresh(remaining[index])) index = i;
    }
    const [place] = remaining.splice(index, 1);
    for (const { key, used } of spreads) used.add(place[key]);
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
