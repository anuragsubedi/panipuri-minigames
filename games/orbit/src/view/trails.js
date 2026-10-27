// Fading position history per body. A body adds a point each time it has
// moved `minStep` sim units, so trails keep the same on-screen length at any
// time speed or zoom, and nothing piles up while paused.

/**
 * @param {{length: number}} opts points kept per body
 * @returns {{record: (bodies: object[], minStep: number) => void, get: (id: number) => number[] | undefined, clear: () => void}}
 */
export function createTrails({ length }) {
  const byId = new Map();

  return {
    record(bodies, minStep) {
      const alive = new Set();
      const min2 = minStep * minStep;
      for (const b of bodies) {
        alive.add(b.id);
        let points = byId.get(b.id);
        if (!points) byId.set(b.id, (points = []));
        const n = points.length;
        if (n && (b.x - points[n - 2]) ** 2 + (b.y - points[n - 1]) ** 2 < min2) continue;
        points.push(b.x, b.y);
        if (points.length > length * 2) points.splice(0, points.length - length * 2);
      }
      for (const id of byId.keys()) if (!alive.has(id)) byId.delete(id);
    },
    /** Flat [x0, y0, x1, y1, …], oldest first. */
    get: (id) => byId.get(id),
    clear() {
      byId.clear();
    },
  };
}
