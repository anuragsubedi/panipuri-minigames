// The map: an SVG of the bundled country shapes with pan/zoom via viewBox,
// plus pins drawn as HTML on top so they stay the same size at any zoom.

import { el } from '../../../../../shared/js/dom.js';
import { project, unproject, boundsRect, clampToBounds } from '../../geo/project.js';
import { fullView, viewBox, zoomAt, panBy, clampView, screenToMap, mapToScreen, fitPoints } from '../../geo/viewport.js';
import { attachMapGestures } from './map-gestures.js';

const SVG = 'http://www.w3.org/2000/svg';
let clipCount = 0;

/**
 * @param {{map: {bounds: object, countries: string}, view: object, gridStep: number,
 *          interactive?: boolean, pin?: {lat: number, lon: number} | null,
 *          onPin?: (pin: {lat: number, lon: number}) => void, label?: string}} options
 *   view: MAP_VIEW from config. interactive: taps place the pin (otherwise pan/zoom only).
 * @returns {{element: HTMLElement, setPin: (pin: object | null) => void,
 *            showResults: (pairs: Array<{guess: object, target: object, label?: string}>) => void,
 *            frame: (points: Array<{lat: number, lon: number}> | null) => void, destroy: () => void}}
 */
export function createWorldMap({ map, view: limits, gridStep, interactive = false, pin = null, onPin = () => {}, label = 'World map' }) {
  const rect = boundsRect(map.bounds);
  let size = null;
  let view = fullView(rect);
  let pinLatLon = pin;
  let pendingFrame = null;
  let results = [];

  // Land past the map's bounds (e.g. Antarctica) is clipped, matching where pins can go.
  const clipId = `map-clip-${++clipCount}`;
  const svg = svgEl('svg', { class: 'map__svg', preserveAspectRatio: 'none', 'aria-hidden': 'true' }, [
    svgEl('clipPath', { id: clipId }, [svgEl('rect', { x: rect.x, y: rect.y, width: rect.w, height: rect.h })]),
    svgEl('rect', { class: 'map__sea', x: rect.x, y: rect.y, width: rect.w, height: rect.h }),
    svgEl('path', { class: 'map__grid', d: graticule(map.bounds, gridStep) }),
    svgEl('path', { class: 'map__equator', d: `M${rect.x} 0H${rect.x + rect.w}` }),
    svgEl('path', { class: 'map__land', d: map.countries, 'clip-path': `url(#${clipId})` }),
  ]);
  const lines = svgEl('g', { class: 'map__lines' });
  svg.append(lines);
  const markers = el('div', { class: 'map__markers' });
  const pinEl = el('div', { class: 'map__pin', attrs: { hidden: '' } });
  markers.append(pinEl);

  const zoomButton = (text, aria, action) =>
    el('button', { class: 'map__zoom-btn', text, attrs: { type: 'button', 'aria-label': aria }, on: { click: action } });
  const center = () => ({ x: size.width / 2, y: size.height / 2 });
  const controls = el('div', { class: 'map__zoom' }, [
    zoomButton('+', 'Zoom in', () => size && zoomBy(limits.buttonZoomStep, center())),
    zoomButton('−', 'Zoom out', () => size && zoomBy(1 / limits.buttonZoomStep, center())),
    zoomButton('⤢', 'Show whole map', () => size && apply(fullView(rect))),
  ]);

  const surface = el('div', { class: 'map__surface', attrs: { role: 'application', 'aria-label': label } }, [svg, markers]);
  const element = el('div', { class: `map${interactive ? ' map--interactive' : ''}` }, [surface, controls]);

  const toLatLon = (px) => clampToBounds(unproject(screenToMap(px, view, rect, size)), map.bounds);

  const stopGestures = attachMapGestures(surface, {
    tapSlopPx: limits.tapSlopPx,
    wheelZoomPerPixel: limits.wheelZoomPerPixel,
    isOnPin: (px) => {
      if (!interactive || !pinLatLon || !size) return false;
      const at = mapToScreen(project(pinLatLon), view, rect, size);
      return Math.hypot(at.x - px.x, at.y - px.y) <= limits.pinGrabPx;
    },
    onTap: (px) => interactive && size && placePin(toLatLon(px)),
    onPinDrag: (px) => size && placePin(toLatLon(px)),
    onPan: (dx, dy) => size && apply(panBy(view, dx, dy, rect, size, limits.maxZoom)),
    onZoom: (factor, px) => size && zoomBy(factor, px),
  });

  const resize = new ResizeObserver(([entry]) => {
    const { width, height } = entry.contentRect;
    if (width < 1 || height < 1) return;
    size = { width, height };
    if (pendingFrame) {
      frame(pendingFrame);
      pendingFrame = null;
    } else {
      apply(clampView(view, rect, size, limits.maxZoom));
    }
  });
  resize.observe(surface);

  function zoomBy(factor, px) {
    apply(zoomAt(view, factor, screenToMap(px, view, rect, size), rect, size, limits.maxZoom));
  }

  function placePin(latLon) {
    pinLatLon = latLon;
    draw();
    onPin(latLon);
  }

  function apply(next) {
    view = next;
    const box = viewBox(view, rect, size);
    svg.setAttribute('viewBox', `${box.x} ${box.y} ${box.w} ${box.h}`);
    draw();
  }

  // Positions the HTML markers for the current view.
  function draw() {
    if (!size) return;
    const at = (latLon) => mapToScreen(project(latLon), view, rect, size);
    place(pinEl, pinLatLon && at(pinLatLon));
    for (const r of results) {
      place(r.guessEl, at(r.guess));
      place(r.targetEl, at(r.target));
    }
  }

  function frame(points) {
    if (!size) {
      pendingFrame = points ?? [];
      return;
    }
    const target = points?.length
      ? fitPoints(points.map(project), rect, size, { paddingPx: limits.fitPaddingPx, maxZoom: limits.fitMaxZoom })
      : fullView(rect);
    apply(clampView(target, rect, size, limits.maxZoom));
  }

  function showResults(pairs) {
    for (const r of results) {
      r.guessEl.remove();
      r.targetEl.remove();
    }
    lines.replaceChildren();
    results = pairs.map(({ guess, target, label: tag }) => {
      const a = project(guess);
      const b = project(target);
      lines.append(svgEl('line', { class: 'map__line', x1: a.x, y1: a.y, x2: b.x, y2: b.y, 'vector-effect': 'non-scaling-stroke' }));
      const guessEl = el('div', { class: 'map__dot map__dot--guess' }, [el('span', { class: 'map__dot-face' })]);
      const targetEl = el('div', { class: 'map__dot map__dot--target' }, [el('span', { class: 'map__dot-face', text: tag ?? '' })]);
      markers.append(guessEl, targetEl);
      return { guess, target, guessEl, targetEl };
    });
    draw();
  }

  return {
    element,
    setPin: (latLon) => {
      pinLatLon = latLon;
      draw();
    },
    showResults,
    frame,
    destroy: () => {
      stopGestures();
      resize.disconnect();
    },
  };
}

function place(node, px) {
  if (!px) {
    node.hidden = true;
    return;
  }
  node.hidden = false;
  node.style.transform = `translate(${px.x}px, ${px.y}px)`;
}

function graticule({ west, east, north, south }, step) {
  const parts = [];
  for (let lon = Math.ceil(west / step) * step; lon <= east; lon += step) parts.push(`M${lon} ${-north}V${-south}`);
  for (let lat = Math.ceil(south / step) * step; lat <= north; lat += step) {
    if (lat !== 0) parts.push(`M${west} ${-lat}H${east}`);
  }
  return parts.join('');
}

function svgEl(tag, attrs = {}, children = []) {
  const node = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, String(value));
  node.append(...children);
  return node;
}
