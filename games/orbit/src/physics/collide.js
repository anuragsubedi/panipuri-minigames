// Collisions between overlapping bodies: merge (inelastic, mass adds up) or
// bounce (impulse along the contact normal). Both conserve momentum.

/**
 * Merge two bodies into one at their center of mass. The heavier one keeps
 * its id and colour; swallowing a star makes a star.
 * @param {object} a
 * @param {object} b
 * @param {(mass: number) => number} radiusOf
 * @returns {object}
 */
export function mergeBodies(a, b, radiusOf) {
  const big = a.mass >= b.mass ? a : b;
  const mass = a.mass + b.mass;
  return {
    ...big,
    mass,
    radius: radiusOf(mass),
    x: (a.x * a.mass + b.x * b.mass) / mass,
    y: (a.y * a.mass + b.y * b.mass) / mass,
    vx: (a.vx * a.mass + b.vx * b.mass) / mass,
    vy: (a.vy * a.mass + b.vy * b.mass) / mass,
    star: a.star || b.star,
  };
}

/**
 * Bounce two overlapping bodies apart. Mutates both.
 * @param {object} a
 * @param {object} b
 * @param {number} restitution 0..1
 * @returns {boolean} true if they were pushed apart
 */
export function bounceBodies(a, b, restitution) {
  let dx = b.x - a.x;
  let dy = b.y - a.y;
  let dist = Math.hypot(dx, dy);
  if (dist === 0) {
    dx = 1;
    dy = 0;
    dist = 1e-9;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  const invA = 1 / a.mass;
  const invB = 1 / b.mass;

  // Separate along the normal, weighted so the center of mass stays put.
  const overlap = a.radius + b.radius - dist;
  const shift = overlap / (invA + invB);
  a.x -= nx * shift * invA;
  a.y -= ny * shift * invA;
  b.x += nx * shift * invB;
  b.y += ny * shift * invB;

  const approach = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
  if (approach >= 0) return true;
  const j = (-(1 + restitution) * approach) / (invA + invB);
  a.vx -= j * nx * invA;
  a.vy -= j * ny * invA;
  b.vx += j * nx * invB;
  b.vy += j * ny * invB;
  return true;
}

/**
 * Resolve every overlapping pair once.
 * @param {object[]} bodies mutable copies
 * @param {'merge' | 'bounce'} mode
 * @param {{restitution: number, radiusOf: (mass: number) => number}} opts
 * @returns {{bodies: object[], changed: boolean, merges: Array<{from: number, into: number, x: number, y: number}>}}
 */
export function resolveCollisions(bodies, mode, { restitution, radiusOf }) {
  let list = bodies;
  let changed = false;
  const merges = [];
  for (let i = 0; i < list.length; i++) {
    for (let j = i + 1; j < list.length; j++) {
      const a = list[i];
      const b = list[j];
      const reach = a.radius + b.radius;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      if (dx * dx + dy * dy >= reach * reach) continue;
      changed = true;
      if (mode === 'bounce') {
        bounceBodies(a, b, restitution);
        continue;
      }
      const merged = mergeBodies(a, b, radiusOf);
      const lost = merged.id === a.id ? b : a;
      merges.push({ from: lost.id, into: merged.id, x: merged.x, y: merged.y });
      list = list.slice();
      list[i] = merged;
      list.splice(j, 1);
      j = i; // the merged body may now touch an earlier-skipped neighbour
    }
  }
  return { bodies: list, changed, merges };
}
