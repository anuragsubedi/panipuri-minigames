// Pointer input on the sky: tap a body to select it, tap empty sky to
// deselect, drag from empty sky to aim and release to launch. Works the same
// for mouse, pen and touch (the canvas has `touch-action: none`).

/**
 * @param {HTMLCanvasElement} canvas
 * @param {{minDragPx: number,
 *          toWorld: (sx: number, sy: number) => [number, number],
 *          hitTest: (sx: number, sy: number) => number | null,
 *          onSelect: (id: number | null) => void,
 *          onAim: (aim: {start: [number, number], end: [number, number]} | null) => void,
 *          onLaunch: (aim: {start: [number, number], end: [number, number]}) => void}} opts
 * @returns {() => void} cleanup
 */
export function createLauncher(canvas, { minDragPx, toWorld, hitTest, onSelect, onAim, onLaunch }) {
  let drag = null;

  const local = (event) => {
    const rect = canvas.getBoundingClientRect();
    return [event.clientX - rect.left, event.clientY - rect.top];
  };

  const down = (event) => {
    if (drag || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const [sx, sy] = local(event);
    drag = { pointerId: event.pointerId, sx, sy, start: toWorld(sx, sy), bodyId: hitTest(sx, sy), aiming: false };
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // Pointer already gone (e.g. released before this ran); the drag still works without capture.
    }
  };

  const move = (event) => {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const [sx, sy] = local(event);
    // Grabbing a body never launches; only drags that start in empty sky aim.
    if (drag.bodyId != null) return;
    if (!drag.aiming && Math.hypot(sx - drag.sx, sy - drag.sy) < minDragPx) return;
    drag.aiming = true;
    drag.end = toWorld(sx, sy);
    canvas.classList.add('is-aiming');
    onAim({ start: drag.start, end: drag.end });
  };

  const up = (event) => {
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
    if (!drag || event.pointerId !== drag.pointerId) return;
    drag = null;
    canvas.classList.remove('is-aiming');
    onAim(null);
  };

  canvas.addEventListener('pointerdown', down);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', cancel);
  return () => {
    canvas.removeEventListener('pointerdown', down);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('pointerup', up);
    canvas.removeEventListener('pointercancel', cancel);
  };
}
