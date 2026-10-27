# Beatween — binaural beats generator (tool)

*Proposed as "Drift"; renamed Beatween when built (D-028).*

> **Status:** shipped v0.1 (`games/beatween/`) · **Rank:** 6 / 8 · **Effort:** < 1 session · **Type:** tool
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes (proposed → approved → in progress → shipped).

**As built (v0.1):** XY-scope Lissajous visual (morph speed slowed and capped to avoid flicker), per-ear frequency with typed entry, log slider and ½ / −1 / +1 / ×2 steps, link toggle (both ears move together, beat kept), beat nudges on the scope, 5 presets, volume, session timer, pink/brown noise, wake lock while playing, settings remembered in localStorage. One-screen layout on phones (portrait and landscape) and desktop.

**Pitch:** A calm, beautiful tone generator. Pick a mood, put on headphones, and let two slightly different tones create a gentle "beat" in your head.

**Core experience**
- Big play/stop button and a headphones reminder (binaural beats only work in stereo headphones).
- **Controls:**
  - base (carrier) frequency, 100–500 Hz
  - beat frequency, 1–30 Hz, with labelled bands (delta, theta, alpha, beta)
  - volume
  - optional pink/brown noise bed
  - session timer with fade-out
- Presets: "Wind down", "Focus", "Meditate".
- Visual: slow breathing circle or Lissajous figure driven by the beat frequency (canvas or SVG).

**Tech approach**
- Web Audio graph: two `OscillatorNode`s (left = f, right = f + beat) → `StereoPannerNode`s → master `GainNode`.
- Noise from an `AudioBuffer` (pink via the Paul Kellet filter).
- All parameter changes go through `setTargetAtTime` ramps (no clicks). Fade in and out over 2 s.
- Audio starts only on a user gesture (autoplay policy).
- **Modules:** pure `audio/params.js` (presets, clamping, band labels) and `audio/noise.js` (buffer fill, testable); `audio/engine.js` (graph); `ui/*`.

**Copy note:** no health or medical claims ("may help you relax", never "treats anxiety").

**Tests:** frequency math per channel, preset validity, clamping, noise buffer statistics (mean ≈ 0).

**Acceptance:** no clicks on start, stop or parameter change; works on iOS Safari after a tap; timer fades out.

**Out of scope:** isochronic tones, recording or export.

**Sanity check**
- ✅ The physics holds: left f, right f + Δ gives a perceived Δ Hz beat only in headphones. Carriers under about 1000 Hz work best (spec range 100–500 is fine).
- ⚠️ **iOS:** Web Audio is silent when the ring/silent switch is on silent unless `navigator.audioSession.type = 'playback'` is set (Safari 16.4+; feature-detect). Show a hint otherwise. Audio also stops on screen lock, so say so in the UI.
- ⚠️ For exact channel separation, a `ChannelMergerNode` (osc A → input 0, osc B → input 1) is simpler and more precise than two panners. Use it.
- ⚠️ Volume default must be low (e.g. 0.2), with a gentle fade-in. Headphone users.
- Novelty is modest (many such generators exist); the value is in a beautiful, calm UI.
