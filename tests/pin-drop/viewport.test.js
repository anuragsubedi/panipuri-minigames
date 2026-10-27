import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  baseScale,
  fullView,
  viewBox,
  clampView,
  zoomAt,
  panBy,
  screenToMap,
  mapToScreen,
  fitPoints,
} from '../../games/pin-drop/src/geo/viewport.js';

const RECT = { x: -180, y: -84, w: 360, h: 144 };
const PHONE = { width: 360, height: 360 }; // taller than the map: letterboxed at zoom 1
const close = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≈ ${b}`);

test('zoom 1 shows the whole map width', () => {
  assert.equal(baseScale(RECT, PHONE), 1);
  const box = viewBox(fullView(RECT), RECT, PHONE);
  assert.deepEqual(box, { x: -180, y: -192, w: 360, h: 360 });
});

test('screenToMap and mapToScreen are inverses', () => {
  const view = { cx: 20, cy: -40, zoom: 3 };
  const p = { x: 25.5, y: -38.25 };
  const back = screenToMap(mapToScreen(p, view, RECT, PHONE), view, RECT, PHONE);
  close(back.x, p.x);
  close(back.y, p.y);
});

test('clampView keeps zoom in range and the map on screen', () => {
  assert.equal(clampView({ cx: 0, cy: 0, zoom: 0.2 }, RECT, PHONE, 16).zoom, 1);
  assert.equal(clampView({ cx: 0, cy: 0, zoom: 99 }, RECT, PHONE, 16).zoom, 16);
  // Zoomed in, the view can't slide past the map's west edge.
  const v = clampView({ cx: -500, cy: -12, zoom: 4 }, RECT, PHONE, 16);
  close(viewBox(v, RECT, PHONE).x, -180);
  // At zoom 1 the map is taller-than-wide container: vertical center is locked.
  close(clampView({ cx: 0, cy: 50, zoom: 1 }, RECT, PHONE, 16).cy, -12);
});

test('zoomAt keeps the anchor under the same pixel', () => {
  const view = { cx: 0, cy: -12, zoom: 2 };
  const anchor = { x: 30, y: -20 };
  const before = mapToScreen(anchor, view, RECT, PHONE);
  const after = mapToScreen(anchor, zoomAt(view, 2, anchor, RECT, PHONE, 16), RECT, PHONE);
  close(before.x, after.x, 1e-6);
  close(before.y, after.y, 1e-6);
});

test('panBy moves the map with the finger', () => {
  const view = { cx: 0, cy: -12, zoom: 4 };
  const moved = panBy(view, 40, 0, RECT, PHONE, 16);
  close(moved.cx, -10); // 40 px at 4 px/° = 10° to the west
});

test('fitPoints frames both pins and caps the zoom', () => {
  const pts = [{ x: -0.1, y: -51.5 }, { x: 2.35, y: -48.86 }];
  const v = fitPoints(pts, RECT, PHONE, { paddingPx: 40, maxZoom: 8 });
  assert.equal(v.zoom, 8);
  for (const p of pts) {
    const s = mapToScreen(p, v, RECT, PHONE);
    assert.ok(s.x >= 0 && s.x <= PHONE.width && s.y >= 0 && s.y <= PHONE.height);
  }
  const wide = fitPoints([{ x: -120, y: -40 }, { x: 140, y: 30 }], RECT, PHONE, { paddingPx: 40, maxZoom: 8 });
  assert.ok(wide.zoom >= 1 && wide.zoom < 1.2);
});
