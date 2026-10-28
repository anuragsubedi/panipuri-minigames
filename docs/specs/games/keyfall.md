# Keyfall — keyboard rhythm game (game)

> **Status:** proposed · **Rank:** 4 / 8 · **Effort:** 1–2 sessions + chart prep · **Type:** game
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes (proposed → approved → in progress → shipped).

**Pitch:** Notes fall down four (or six) lanes. Hit the matching key as each one lands, and you're playing a classical piece.

**Core loop**
- Pick a piece → 3-2-1 → notes scroll toward a hit line.
- Keys `D F J K` (4 lanes) or `S D F J K L` (6 lanes); tap lanes on touch.
- Timing windows: Perfect ±40 ms, Good ±90 ms, otherwise Miss. Combo multiplier.
- Hitting a note plays it with a small Web Audio synth (triangle + envelope), so *you* make the music. Missed notes stay silent.
- Results screen: accuracy %, max combo, grade.

**Music & licensing**
- Use **public-domain compositions** (Bach, Beethoven, Satie, Joplin…). **Many MIDI files are separately copyrighted arrangements.**
- Safest options:
  - hand-encode short excerpts (16–32 bars) as JSON (`[{ t: beats, midi: 60, dur: 0.5 }]`), or
  - convert from **Mutopia Project** sources that are explicitly public domain or CC0, noting license per piece in `data/pieces/LICENSES.md`.
- Map pitches to lanes with a simple pitch-class or range bucketing (pure, tested).
- ⚠️ No MIDI parser dependency: either pre-convert offline to JSON (preferred), or write a minimal SMF parser (~150 lines) that only handles note on/off and tempo.

**Tech approach**
- **Audio clock is the source of truth** (`AudioContext.currentTime`), never `setTimeout`. Render with rAF from audio time.
- Calibration option: audio offset slider (ms).
- **Modules:**
  - pure: `chart/{lanes.js, timing.js, judge.js}`
  - `audio/synth.js`, `input/keys.js`, `ui/canvas-highway.js`, `state/game.js`

**Tests:** judge windows, lane mapping is deterministic, score/combo math, chart parsing.

**Acceptance:** no audible drift across a 90 s piece; key repeat ignored; works with touch; at least 3 pieces at varied difficulty.

**Out of scope:** user MIDI upload (stretch), hold notes (stretch), leaderboards.

**Sanity check**
- ⚠️ **Charts need reduction, not just mapping.** Real scores have chords and fast runs. Add a pure `chart/reduce.js`:
  - keep at most 2 simultaneous notes (melody + one), with a minimum gap per lane of about 120 ms
  - Easy: melody only
  - Hard: allow chords
  - Test it.
- ⚠️ **Input vs. audio clock:** keydown gives `event.timeStamp` (performance clock), but notes live on `AudioContext.currentTime`. Correlate them with `audioContext.getOutputTimestamp()` (fallback: sample the offset at start), or judging drifts.
- ⚠️ Mutopia pieces carry mixed licenses (Public Domain, CC BY, CC BY-SA). Record the license per piece; BY-SA chart JSON needs attribution under the same license. Hand-encoding a public-domain composition yourself avoids this entirely.
- ⚠️ Bluetooth headphones add 150–250 ms of latency. The offset slider is required, not optional.
- ✅ The Web Audio synth means no audio assets at all.
