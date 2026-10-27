// Draws one frame of the sky from what it is given: bodies, trails, the aim
// preview and merge flashes. Colours come from CSS custom properties on the
// canvas, so light/dark themes need no code here beyond `refreshTheme()`.

const TRAIL_CHUNKS = 8;
const MIN_BODY_PX = 3.5;
// Planets are drawn a bit larger than their collision radius so they read on a phone.
const PLANET_BOOST = 1.35;
const STARFIELD_DENSITY = 1 / 2600; // background stars per px²

/**
 * @param {HTMLCanvasElement} canvas
 * @returns {{resize: (w: number, h: number) => void, refreshTheme: () => void, draw: (frame: object) => void}}
 */
export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let theme = readTheme(canvas);
  let starfield = null;

  return {
    resize(w, h) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      width = w;
      height = h;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      starfield = theme.starfield ? paintStarfield(w, h, dpr) : null;
    },
    refreshTheme() {
      theme = readTheme(canvas);
      starfield = theme.starfield && width ? paintStarfield(width, height, Math.min(window.devicePixelRatio || 1, 2.5)) : null;
    },
    /**
     * @param {{bodies: object[], camera: object, trails: object | null, selectedId: number | null,
     *          aim: object | null, flashes: Array<{x: number, y: number, age: number}>, origin: [number, number]}} frame
     */
    draw({ bodies, camera, trails, selectedId, aim, flashes, origin }) {
      ctx.clearRect(0, 0, width, height);
      if (starfield) ctx.drawImage(starfield, 0, 0, width, height);
      drawRings(ctx, camera, origin, theme);
      if (trails) for (const b of bodies) drawTrail(ctx, camera, trails.get(b.id), b, theme);
      const light = brightestStar(bodies);
      for (const b of bodies) if (!b.star) drawPlanet(ctx, camera, b, light, theme);
      for (const b of bodies) if (b.star) drawStar(ctx, camera, b, theme);
      for (const f of flashes) drawFlash(ctx, camera, f, theme);
      const selected = bodies.find((b) => b.id === selectedId);
      if (selected) drawSelection(ctx, camera, selected, theme);
      if (aim) drawAim(ctx, camera, aim, theme);
    },
  };
}

function readTheme(canvas) {
  const css = getComputedStyle(canvas);
  const v = (name) => css.getPropertyValue(name).trim();
  return {
    planets: [0, 1, 2, 3, 4, 5].map((i) => v(`--planet-${i}`)),
    shade: v('--planet-shade'),
    starCore: v('--star-core'),
    starMid: v('--star-mid'),
    starGlow: v('--star-glow'),
    starGlowEdge: v('--star-glow-edge'),
    ink: v('--sky-ink'),
    dim: v('--sky-dim'),
    ring: v('--sky-ring'),
    aim: v('--aim'),
    trailAlpha: Number(v('--trail-alpha')) || 0.6,
    starfield: v('--starfield') === '1',
  };
}

// Background stars, painted once per resize. A fixed hash keeps them put.
function paintStarfield(w, h, dpr) {
  const layer = document.createElement('canvas');
  layer.width = Math.round(w * dpr);
  layer.height = Math.round(h * dpr);
  const g = layer.getContext('2d');
  g.scale(dpr, dpr);
  let seed = 12345;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const count = Math.round(w * h * STARFIELD_DENSITY);
  for (let i = 0; i < count; i++) {
    const bright = rand();
    g.globalAlpha = 0.25 + bright * bright * 0.6;
    g.fillStyle = rand() < 0.2 ? '#ffe2bf' : rand() < 0.3 ? '#c7d8ff' : '#ffffff';
    g.beginPath();
    g.arc(rand() * w, rand() * h, 0.4 + bright * 0.8, 0, Math.PI * 2);
    g.fill();
  }
  return layer;
}

const colorOf = (b, theme) => theme.planets[b.color % theme.planets.length];
const pxRadius = (b, camera) => Math.max(b.radius * camera.scale * (b.star ? 1 : PLANET_BOOST), MIN_BODY_PX);

function brightestStar(bodies) {
  let best = null;
  for (const b of bodies) if (b.star && (!best || b.mass > best.mass)) best = b;
  return best;
}

// Faint distance rings around the system's center: a sense of scale.
function drawRings(ctx, camera, [x, y], theme) {
  const [sx, sy] = camera.toScreen(x, y);
  ctx.strokeStyle = theme.ring;
  ctx.lineWidth = 1;
  for (const r of [60, 120, 180, 240, 300]) {
    ctx.beginPath();
    ctx.arc(sx, sy, r * camera.scale, 0, Math.PI * 2);
    ctx.stroke();
  }
}

// Tapered and fading: the trail is drawn in chunks, older chunks thinner and fainter.
function drawTrail(ctx, camera, points, body, theme) {
  if (!points || points.length < 4) return;
  const n = points.length / 2;
  const per = Math.max(1, Math.ceil(n / TRAIL_CHUNKS));
  const width = Math.min(pxRadius(body, camera) * 0.9, 3);
  ctx.strokeStyle = body.star ? theme.starMid : colorOf(body, theme);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (let c = 0; c * per < n - 1; c++) {
    const from = c * per;
    const to = Math.min(n - 1, from + per);
    const t = (c + 1) / TRAIL_CHUNKS;
    ctx.globalAlpha = theme.trailAlpha * t * t;
    ctx.lineWidth = Math.max(0.6, width * t);
    ctx.beginPath();
    let [sx, sy] = camera.toScreen(points[from * 2], points[from * 2 + 1]);
    ctx.moveTo(sx, sy);
    for (let i = from + 1; i <= to; i++) {
      [sx, sy] = camera.toScreen(points[i * 2], points[i * 2 + 1]);
      ctx.lineTo(sx, sy);
    }
    if (to === n - 1) {
      [sx, sy] = camera.toScreen(body.x, body.y);
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

// Lit from the brightest star: highlight on the near side, shade on the far side.
function drawPlanet(ctx, camera, b, light, theme) {
  const [sx, sy] = camera.toScreen(b.x, b.y);
  const r = pxRadius(b, camera);
  let lx = 0;
  let ly = 0;
  if (light) {
    const [tx, ty] = camera.toScreen(light.x, light.y);
    const d = Math.hypot(tx - sx, ty - sy) || 1;
    lx = ((tx - sx) / d) * r * 0.45;
    ly = ((ty - sy) / d) * r * 0.45;
  }
  const g = ctx.createRadialGradient(sx + lx, sy + ly, r * 0.1, sx, sy, r);
  g.addColorStop(0, colorOf(b, theme));
  g.addColorStop(0.7, colorOf(b, theme));
  g.addColorStop(1, theme.shade);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
}

function drawStar(ctx, camera, b, theme) {
  const [sx, sy] = camera.toScreen(b.x, b.y);
  const r = pxRadius(b, camera);
  const glow = ctx.createRadialGradient(sx, sy, r * 0.6, sx, sy, r * 5);
  glow.addColorStop(0, theme.starGlow);
  glow.addColorStop(1, theme.starGlowEdge);
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(sx, sy, r * 5, 0, Math.PI * 2);
  ctx.fill();
  const core = ctx.createRadialGradient(sx, sy, 0, sx, sy, r);
  core.addColorStop(0, theme.starCore);
  core.addColorStop(0.55, theme.starCore);
  core.addColorStop(1, theme.starMid);
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.fill();
}

// A ring that grows and fades where two bodies merged. `age` runs 0 → 1.
function drawFlash(ctx, camera, { x, y, age, radius }, theme) {
  const [sx, sy] = camera.toScreen(x, y);
  ctx.globalAlpha = (1 - age) * 0.8;
  ctx.strokeStyle = theme.starMid;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sx, sy, radius * camera.scale + 4 + age * 26, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawSelection(ctx, camera, b, theme) {
  const [sx, sy] = camera.toScreen(b.x, b.y);
  const r = pxRadius(b, camera) + 6;
  ctx.strokeStyle = theme.ink;
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 4]);
  ctx.beginPath();
  ctx.arc(sx, sy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  // Velocity, as a short arrow (10 time units ahead).
  const [ex, ey] = camera.toScreen(b.x + b.vx * 10, b.y + b.vy * 10);
  const len = Math.hypot(ex - sx, ey - sy);
  if (len > r + 4) arrow(ctx, sx + ((ex - sx) / len) * r, sy + ((ey - sy) / len) * r, ex, ey, theme.ink, 1.5);
}

function drawAim(ctx, camera, { start, end, path, hit, label }, theme) {
  const [x0, y0] = camera.toScreen(start[0], start[1]);
  const [x1, y1] = camera.toScreen(end[0], end[1]);

  if (path) {
    // Predicted path: a faint line plus dots at equal time steps, so their
    // spacing shows where the body speeds up and slows down.
    ctx.strokeStyle = theme.aim;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < path.count; i++) {
      const [sx, sy] = camera.toScreen(path.points[i * 2], path.points[i * 2 + 1]);
      if (i === 0) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = theme.aim;
    for (let i = path.tickEvery; i < path.count; i += path.tickEvery) {
      const [sx, sy] = camera.toScreen(path.points[i * 2], path.points[i * 2 + 1]);
      ctx.beginPath();
      ctx.arc(sx, sy, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    if (hit) {
      const i = path.count - 1;
      const [sx, sy] = camera.toScreen(path.points[i * 2], path.points[i * 2 + 1]);
      cross(ctx, sx, sy, theme.aim);
    }
  }

  arrow(ctx, x0, y0, x1, y1, theme.aim, 2.5);
  ctx.fillStyle = theme.aim;
  ctx.beginPath();
  ctx.arc(x0, y0, 4, 0, Math.PI * 2);
  ctx.fill();

  if (label) {
    ctx.font = '600 12px ui-rounded, system-ui, sans-serif';
    ctx.fillStyle = theme.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(label, x0, y0 - 10);
  }
}

function arrow(ctx, x0, y0, x1, y1, color, width) {
  const len = Math.hypot(x1 - x0, y1 - y0);
  if (len < 1) return;
  const ux = (x1 - x0) / len;
  const uy = (y1 - y0) / len;
  const head = Math.min(10, len * 0.4);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.moveTo(x1 - ux * head - uy * head * 0.6, y1 - uy * head + ux * head * 0.6);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x1 - ux * head + uy * head * 0.6, y1 - uy * head - ux * head * 0.6);
  ctx.stroke();
}

function cross(ctx, x, y, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 5, y - 5);
  ctx.lineTo(x + 5, y + 5);
  ctx.moveTo(x + 5, y - 5);
  ctx.lineTo(x - 5, y + 5);
  ctx.stroke();
}

