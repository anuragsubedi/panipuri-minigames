// Names the band a beat frequency falls in.

/**
 * @param {number} beat Hz (≥ 0)
 * @param {Array<{below: number, name: string, note: string}>} bands ascending by `below`
 * @returns {{name: string, note: string}}
 */
export function bandFor(beat, bands) {
  const band = bands.find((b) => beat < b.below) ?? bands.at(-1);
  return { name: band.name, note: band.note };
}
