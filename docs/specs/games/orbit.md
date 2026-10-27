# Orbit — solar system sandbox (toy)

> **Status:** shipped v0.1 (`games/orbit/`, D-029) · **Rank:** 1 / 7 · **Effort:** 1–2 sessions · **Type:** toy
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes (proposed → approved → in progress → shipped).

**Pitch:** A pocket solar system you can poke. Fling a planet, crank up the sun's mass, and watch orbits wobble, slingshot or fall apart.

**Core experience**
- Starts with a stylized Sun + 4–6 planets in stable-ish orbits, drawn on a full-card `<canvas>` with fading orbit trails.
- **Drag from empty space to launch a new body**: drag direction and length set its velocity, shown with a preview arrow and a predicted path.
- Click a body to select it; a side or bottom panel shows its mass and speed, with a delete button.
- **Global controls:**
  - time speed (pause, 0.25×–8×)
  - gravity strength G
  - Sun mass
  - trails on/off
  - collisions: merge or bounce
  - reset
  - presets: "Inner planets", "Binary star", "Chaos"
- Optional "mission" mode (stretch, **not in v0.1**; candidate for v0.2): keep a launched body in orbit for 30 s.

**Tech approach**
- Physics is pure: `src/physics/` uses velocity-Verlet / leapfrog integration with a fixed timestep, an accumulator, and softening ε to avoid singularities.
- O(n²) gravity is fine for ≤ 50 bodies.
- Collision: merge when distance < r₁ + r₂, conserving momentum and summing mass.
- `ui/canvas-renderer.js` draws from state with `requestAnimationFrame`. DPR-aware canvas and resize handling.
- Controls are plain `<input type="range">` and buttons. This is a toy, so it uses a continuous loop rather than the phase state machine (document that in ARCHITECTURE).

**Modules:** `physics/{integrate.js, gravity.js, collide.js}`, `sim/{bodies.js, presets.js}`, `ui/{canvas-renderer.js, controls.js, launcher.js}`, `main.js`.

**Tests:** energy roughly conserved over N steps for a 2-body circular orbit (drift < 1%), momentum conserved on merge, presets valid.

**Acceptance**
- 60 fps with 30 bodies on a laptop.
- Launch-by-drag works with mouse and touch.
- Pause, resize and theme switch don't break the simulation.
- Light and dark themes.

**Out of scope:** real ephemeris data, 3D, relativistic effects. A 3D version could be a separate future spec (user idea, 2026-10-27).

**Risks:** tuning units so default orbits look good. Keep everything in "sim units" in `config.js`.

**Sanity check**
- ✅ Leapfrog/Verlet is symplectic, so the energy-drift test is a fair bar with a fixed dt. A variable dt would break it, so use the accumulator.
- ⚠️ Trajectory preview while dragging = re-simulating ahead every frame. Cap it (e.g. 300 steps, current bodies frozen except the new one).
- ⚠️ Canvas drag on touch needs `touch-action: none`, or the page scrolls instead.
- ⚠️ When the tab is hidden, rAF stops; on return, clamp the accumulated time (e.g. max 0.25 s) so the sim doesn't explode.
- No licensing concerns (all procedural).
