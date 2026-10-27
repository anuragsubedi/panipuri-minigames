// Pointer input on the map, reported as intents: a short tap drops the pin,
// a drag that starts on the pin moves it, any other drag pans, two fingers
// pinch-zoom, the wheel zooms at the cursor. Mouse, pen and touch behave the
// same (the surface has `touch-action: none`).

/**
 * @param {HTMLElement} surface
 * @param {{tapSlopPx: number, wheelZoomPerPixel: number,
 *          isOnPin: (px: {x: number, y: number}) => boolean,
 *          onTap: (px: {x: number, y: number}) => void,
 *          onPinDrag: (px: {x: number, y: number}) => void,
 *          onPan: (dx: number, dy: number) => void,
 *          onZoom: (factor: number, anchorPx: {x: number, y: number}) => void}} options
 *   pixel points are relative to the surface's top-left
 * @returns {() => void} cleanup
 */
export function attachMapGestures(surface, { tapSlopPx, wheelZoomPerPixel, isOnPin, onTap, onPinDrag, onPan, onZoom }) {
  const pointers = new Map();
  // mode: 'press' (might still be a tap) | 'pan' | 'pin' | 'pinch'
  let gesture = null;

  const local = (event) => {
    const rect = surface.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const pair = () => {
    const [a, b] = [...pointers.values()];
    return { spread: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
  };

  const down = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    const point = local(event);
    pointers.set(event.pointerId, point);
    try {
      surface.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already released; the gesture still works without capture.
    }
    if (pointers.size === 2) {
      gesture = { mode: 'pinch', ...pair() };
    } else if (pointers.size === 1) {
      gesture = { mode: isOnPin(point) ? 'pin' : 'press', start: point, last: point };
    }
  };

  const move = (event) => {
    if (!pointers.has(event.pointerId) || !gesture) return;
    const point = local(event);
    pointers.set(event.pointerId, point);
    if (gesture.mode === 'pinch') {
      if (pointers.size < 2) return;
      const now = pair();
      if (gesture.spread > 0 && now.spread > 0) onZoom(now.spread / gesture.spread, now.mid);
      onPan(now.mid.x - gesture.mid.x, now.mid.y - gesture.mid.y);
      Object.assign(gesture, now);
      return;
    }
    if (gesture.mode === 'pin') {
      onPinDrag(point);
      return;
    }
    if (gesture.mode === 'press' && Math.hypot(point.x - gesture.start.x, point.y - gesture.start.y) > tapSlopPx) {
      gesture.mode = 'pan';
    }
    if (gesture.mode === 'pan') onPan(point.x - gesture.last.x, point.y - gesture.last.y);
    gesture.last = point;
  };

  const up = (event) => {
    if (!pointers.has(event.pointerId)) return;
    const point = local(event);
    pointers.delete(event.pointerId);
    if (gesture?.mode === 'press' && event.type === 'pointerup') onTap(point);
    if (pointers.size === 1 && gesture?.mode === 'pinch') {
      // One finger left after a pinch: keep panning with it, never a tap.
      const last = [...pointers.values()][0];
      gesture = { mode: 'pan', start: last, last };
    } else if (pointers.size === 0) {
      gesture = null;
    }
  };

  const wheel = (event) => {
    event.preventDefault();
    // Trackpads send small pixel deltas, mouse wheels larger line deltas.
    const px = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    onZoom(Math.exp(-px * wheelZoomPerPixel), local(event));
  };

  surface.addEventListener('pointerdown', down);
  surface.addEventListener('pointermove', move);
  surface.addEventListener('pointerup', up);
  surface.addEventListener('pointercancel', up);
  surface.addEventListener('wheel', wheel, { passive: false });
  return () => {
    surface.removeEventListener('pointerdown', down);
    surface.removeEventListener('pointermove', move);
    surface.removeEventListener('pointerup', up);
    surface.removeEventListener('pointercancel', up);
    surface.removeEventListener('wheel', wheel);
  };
}
