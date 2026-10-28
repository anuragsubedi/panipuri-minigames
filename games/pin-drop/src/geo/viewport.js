// Pan/zoom math for the map's SVG viewBox. Pure: the map component feeds it
// pixel sizes and pointer positions and applies the viewBox it returns.
//
// A view is {cx, cy, zoom}: the map-unit point at the container's center and
// a zoom where 1 fits the whole map rect inside the container.

/**
 * Pixels per map unit at zoom 1 (whole map fits).
 * @param {{w: number, h: number}} rect map rect in map units
 * @param {{width: number, height: number}} size container in px
 * @returns {number}
 */
export function baseScale(rect, size) {
  return Math.min(size.width / rect.w, size.height / rect.h);
}

/**
 * The view showing the whole map.
 * @param {{x: number, y: number, w: number, h: number}} rect
 * @returns {{cx: number, cy: number, zoom: number}}
 */
export function fullView(rect) {
  return { cx: rect.x + rect.w / 2, cy: rect.y + rect.h / 2, zoom: 1 };
}

/**
 * SVG viewBox for a view.
 * @param {{cx: number, cy: number, zoom: number}} view
 * @param {{w: number, h: number}} rect
 * @param {{width: number, height: number}} size
 * @returns {{x: number, y: number, w: number, h: number}}
 */
export function viewBox(view, rect, size) {
  const scale = baseScale(rect, size) * view.zoom;
  const w = size.width / scale;
  const h = size.height / scale;
  return { x: view.cx - w / 2, y: view.cy - h / 2, w, h };
}

/**
 * Keep zoom in [1, maxZoom] and the map covering the screen where it can.
 * On an axis where the whole map fits, it stays centered.
 * @param {{cx: number, cy: number, zoom: number}} view
 * @param {{x: number, y: number, w: number, h: number}} rect
 * @param {{width: number, height: number}} size
 * @param {number} maxZoom
 * @returns {{cx: number, cy: number, zoom: number}}
 */
export function clampView(view, rect, size, maxZoom) {
  const zoom = Math.min(maxZoom, Math.max(1, view.zoom));
  const box = viewBox({ ...view, zoom }, rect, size);
  return { cx: clampAxis(view.cx, box.w, rect.x, rect.w), cy: clampAxis(view.cy, box.h, rect.y, rect.h), zoom };
}

/**
 * Zoom by a factor while keeping one map point under the same pixel.
 * @param {{cx: number, cy: number, zoom: number}} view
 * @param {number} factor > 1 zooms in
 * @param {{x: number, y: number}} anchor map units
 * @param {{x: number, y: number, w: number, h: number}} rect
 * @param {{width: number, height: number}} size
 * @param {number} maxZoom
 * @returns {{cx: number, cy: number, zoom: number}}
 */
export function zoomAt(view, factor, anchor, rect, size, maxZoom) {
  const zoom = Math.min(maxZoom, Math.max(1, view.zoom * factor));
  const k = view.zoom / zoom;
  return clampView(
    { cx: anchor.x - (anchor.x - view.cx) * k, cy: anchor.y - (anchor.y - view.cy) * k, zoom },
    rect,
    size,
    maxZoom,
  );
}

/**
 * Move the map by a pixel drag.
 * @param {{cx: number, cy: number, zoom: number}} view
 * @param {number} dxPx
 * @param {number} dyPx
 * @param {{x: number, y: number, w: number, h: number}} rect
 * @param {{width: number, height: number}} size
 * @param {number} maxZoom
 * @returns {{cx: number, cy: number, zoom: number}}
 */
export function panBy(view, dxPx, dyPx, rect, size, maxZoom) {
  const scale = baseScale(rect, size) * view.zoom;
  return clampView({ ...view, cx: view.cx - dxPx / scale, cy: view.cy - dyPx / scale }, rect, size, maxZoom);
}

/**
 * Container pixel → map units.
 * @param {{x: number, y: number}} px relative to the container's top-left
 * @param {{cx: number, cy: number, zoom: number}} view
 * @param {{w: number, h: number}} rect
 * @param {{width: number, height: number}} size
 * @returns {{x: number, y: number}}
 */
export function screenToMap(px, view, rect, size) {
  const box = viewBox(view, rect, size);
  return { x: box.x + (px.x / size.width) * box.w, y: box.y + (px.y / size.height) * box.h };
}

/**
 * Map units → container pixel.
 * @param {{x: number, y: number}} point
 * @param {{cx: number, cy: number, zoom: number}} view
 * @param {{w: number, h: number}} rect
 * @param {{width: number, height: number}} size
 * @returns {{x: number, y: number}}
 */
export function mapToScreen(point, view, rect, size) {
  const box = viewBox(view, rect, size);
  return { x: ((point.x - box.x) / box.w) * size.width, y: ((point.y - box.y) / box.h) * size.height };
}

/**
 * The view that frames some points with pixel padding, zoomed in no further than maxZoom.
 * @param {Array<{x: number, y: number}>} points map units
 * @param {{x: number, y: number, w: number, h: number}} rect
 * @param {{width: number, height: number}} size
 * @param {{paddingPx: number, maxZoom: number}} options
 * @returns {{cx: number, cy: number, zoom: number}}
 */
export function fitPoints(points, rect, size, { paddingPx, maxZoom }) {
  if (points.length === 0) return fullView(rect);
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const base = baseScale(rect, size);
  const room = (px) => Math.max(1, px - 2 * paddingPx);
  // A span of 0 (one point) would ask for infinite zoom; maxZoom caps it.
  const zoomX = x1 > x0 ? room(size.width) / ((x1 - x0) * base) : Infinity;
  const zoomY = y1 > y0 ? room(size.height) / ((y1 - y0) * base) : Infinity;
  const zoom = Math.min(zoomX, zoomY, maxZoom);
  return clampView({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, zoom }, rect, size, maxZoom);
}

function clampAxis(center, span, start, length) {
  if (span >= length) return start + length / 2;
  return Math.min(start + length - span / 2, Math.max(start + span / 2, center));
}
