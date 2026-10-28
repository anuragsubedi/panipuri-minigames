// Pointer input on the sky: tap a body to select it, tap empty sky to
// deselect, drag from empty sky to aim and release to launch, pinch or
// scroll to zoom. Works the same for mouse, pen and touch (the canvas has
// `touch-action: none`).

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{minDragPx: number, wheelPerPixel: number,
 *          toWorld: (sx: number, sy: number) => [number, number],
 *          hitTest: (sx: number, sy: number) => number | null,
 *          onSelect: (id: number | null) => void,
 *          onAim: (aim: {start: [number, number], end: [number, number]} | null) => void,
 *          onLaunch: (aim: {start: [number, number], end: [number, number]}) => void,
 *          onZoom: (factor: number) => void}} opts onZoom multiplies the view radius
 * @returns {() => void} cleanup
 */
export function createLauncher(canvas, { minDragPx, wheelPerPixel, toWorld, hitTest, onSelect, onAim, onLaunch, onZoom }) {
  const pointers = new Map();
  let drag = null;
  let pinch = null;

  const local = (event) => {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };
  const spread = () => {
    const [a, b] = [...pointers.values()];
    return Math.hypot(a[0] - b[0], a[1] - b[1]);
  };
  const endDrag = () => {
    if (drag?.aiming) onAim(null);
    drag = null;
    canvas.classList.remove('is-aiming');
  };

  const down = (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointers.set(event.pointerId, local(event));
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already gone (e.g. released before this ran); the drag still works without capture.
    }
    if (pointers.size === 2) {
      // A second finger turns any drag into a pinch.
      endDrag();
      pinch = { last: spread() };
      return;
    }
    if (pointers.size > 2 || pinch) return;
    const [sx, sy] = pointers.get(event.pointerId);
    drag = { pointerId: event.pointerId, sx, sy, start: toWorld(sx, sy), bodyId: hitTest(sx, sy), aiming: false };
  };

  const move = (event) => {
    if (!pointers.has(event.pointerId)) return;
    const point = local(event);
    pointers.set(event.pointerId, point);
    if (pinch && pointers.size === 2) {
      const now = spread();
      if (now > 0 && pinch.last > 0) onZoom(pinch.last / now);
      pinch.last = now;
      return;
    }
    if (!drag || event.pointerId !== drag.pointerId || drag.bodyId != null) return;
    // Grabbing a body never launches; only drags that start in empty sky aim.
    const [sx, sy] = point;
    if (!drag.aiming && Math.hypot(sx - drag.sx, sy - drag.sy) < minDragPx) return;
    drag.aiming = true;
    drag.end = toWorld(sx, sy);
    canvas.classList.add('is-aiming');
    onAim({ start: drag.start, end: drag.end });
  };

  const up = (event) => {
    if (!pointers.delete(event.pointerId)) return;
    if (pinch) {
      if (pointers.size === 0) pinch = null;
      return;
    }
    if (!drag || event.pointerId !== drag.pointerId) return;
    const { aiming, start, end, bodyId } = drag;
    drag = null;
    canvas.classList.remove('is-aiming');
    if (aiming) {
      onAim(null);
      onLaunch({ start, end });
    } else {
      onSelect(bodyId);
    }
  };

  const cancel = (event) => {
    pointers.delete(event.pointerId);
    if (pointers.size === 0) pinch = null;
    if (drag && event.pointerId === drag.pointerId) endDrag();
  };

  const wheel = (event) => {
    event.preventDefault();
    // Trackpads send small pixel deltas, mouse wheels larger line deltas.
    const px = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
    onZoom(Math.exp(px * wheelPerPixel));
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  canvas.addEventListener('wheel', wheel, { passive: false });
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', cancel);
    canvas.removeEventListener('wheel', wheel);
  };
}
