import { el } from '../../../../shared/js/dom.js';
import { VISUAL } from '../config.js';
import { lissajousPoints, visualTempo } from '../visual/lissajous.js';
import { icon } from './icons.js';

// Scope colors are fixed: the screen is always dark, whatever the page theme.
const INK = { left: '#ff8a5c', right: '#46d0de' };

/**
 * The XY scope: a phosphor-style Lissajous figure of the two tones, the band
 * label, and a start hint while stopped. Other controls can be placed in `overlay`.
 * @param {{onPlay: () => void}} handlers
 * @returns {{el: HTMLElement, overlay: HTMLElement, update: (view: object) => void}}
 */
export function createScope({ onPlay }) {
  const canvas = el('canvas', { class: 'scope__canvas', attrs: { 'aria-hidden': 'true' } });
  const band = el('span', { class: 'scope__band' });
  const tones = el('span', { class: 'scope__tones' });
  const hint = el('button', { class: 'scope__hint', attrs: { type: 'button' }, on: { click: onPlay } });
  hint.innerHTML = `${icon('headphones')}<span class="scope__hint-title">Headphones on, then play</span><span class="scope__hint-note">Each ear gets its own tone. Keep the volume low. Not medical advice.</span>`;
  const overlay = el('div', { class: 'scope__overlay' });
  const root = el(
    'section',
    { class: 'scope', attrs: { 'aria-label': 'Tone scope' } },
    [canvas, el('div', { class: 'scope__top' }, [band, tones]), hint, el('span', { class: 'scope__axis scope__axis--x', text: 'L' }), el('span', { class: 'scope__axis scope__axis--y', text: 'R' }), overlay],
  );

  const g = canvas.getContext('2d');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let view = { left: 200, right: 210, beat: 10, playing: false };
  let phase = 0;
  let amplitude = 0.55;
  let last = performance.now();
  let width = 0;
  let height = 0;
  let dpr = 1;

  new ResizeObserver(() => {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
  }).observe(canvas);

  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    const slow = reducedMotion.matches ? 0.25 : 1;
    const tempo = visualTempo(view.beat, VISUAL) * (view.playing ? 1 : 0.35) * slow;
    phase = (phase + Math.PI * 2 * tempo * dt) % (Math.PI * 2);
    amplitude += ((view.playing ? 0.92 : 0.55) - amplitude) * Math.min(1, dt * 3);
    draw();
    requestAnimationFrame(frame);
  }

  function draw() {
    if (!width || !height) return;
    const w = canvas.width;
    const h = canvas.height;
    // Fade the previous frame instead of clearing it: a phosphor afterglow.
    g.globalCompositeOperation = 'destination-out';
    g.fillStyle = `rgba(0, 0, 0, ${reducedMotion.matches ? 1 : view.playing ? 0.2 : 0.3})`;
    g.fillRect(0, 0, w, h);

    const points = lissajousPoints({ ratio: view.right / view.left, phase, samples: VISUAL.samples, turns: VISUAL.turns });
    const r = Math.min(w, h) * 0.36 * amplitude;
    const cx = w / 2;
    const cy = h / 2;
    const gradient = g.createLinearGradient(cx - r, cy + r, cx + r, cy - r);
    gradient.addColorStop(0, INK.left);
    gradient.addColorStop(1, INK.right);

    g.globalCompositeOperation = 'lighter';
    g.strokeStyle = gradient;
    g.lineJoin = 'round';
    g.beginPath();
    for (let i = 0; i < points.length; i += 2) {
      const x = cx + points[i] * r;
      const y = cy - points[i + 1] * r;
      if (i === 0) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
    const strength = view.playing ? 1 : 0.5;
    g.globalAlpha = 0.14 * strength;
    g.lineWidth = 7 * dpr;
    g.stroke();
    g.globalAlpha = 0.85 * strength;
    g.lineWidth = 1.6 * dpr;
    g.stroke();
    g.globalAlpha = 1;
  }

  requestAnimationFrame(frame);

  return {
    el: root,
    overlay,
    update(next) {
      view = next;
      band.textContent = `${next.band.name} · ${next.band.note}`;
      tones.textContent = `L ${next.left.toFixed(1)} · R ${next.right.toFixed(1)} Hz`;
      hint.hidden = next.playing;
      root.classList.toggle('is-playing', next.playing);
    },
  };
}
