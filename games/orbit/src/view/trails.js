// Fading position history per body, sampled on sim time (so trails keep the
// same shape at every time speed).

/**
 * @param {{every: number, length: number}} opts
 * @returns {{record: (bodies: object[], time: number) => void, get: (id: number) => number[] | undefined, clear: () => void}}
 */
export function createTrails({ every, length }) {
  const byId = new Map();
  let lastSample = -Infinity;

  return {
    record(bodies, time) {
      if (time - lastSample < every && time >= lastSample) return;
      lastSample = time;
      const alive = new Set();
      for (const b of bodies) {
        alive.add(b.id);
        let points = byId.get(b.id);
        if (!points) byId.set(b.id, (points = []));
        points.push(b.x, b.y);
        if (points.length > length * 2) points.splice(0, points.length - length * 2);
      }
      for (const id of byId.keys()) if (!alive.has(id)) byId.delete(id);
    },
    /** Flat [x0, y0, x1, y1, …], oldest first. */
    get: (id) => byId.get(id),
    clear() {
      byId.clear();
      lastSample = -Infinity;
    },
  };
}
