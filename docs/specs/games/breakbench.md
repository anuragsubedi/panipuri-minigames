# Breakbench — modular DnB pattern player (toy)

> **Status:** proposed · **Rank:** 5 / 8 · **Effort:** 2–3 sessions · **Type:** toy ⚠️ needs a user decision before building
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes (proposed → approved → in progress → shipped).

**Pitch:** A tiny live-coding groovebox for drum & bass. Type short patterns, hear them loop at 174 BPM, and tweak them live without stopping the beat.

**Two build paths (the user must pick one):**
- **A. Wrap Strudel.** Fastest path to great sound, but adds a dependency (CDN or vendored).
  - **Strudel is AGPL-3.0**: embedding it brings AGPL obligations. The repo being public helps but doesn't settle them, so read the license before choosing.
  - Breaks the no-dependency rule (needs a D-0xx exception).
- **B. Own mini-engine (recommended for this repo).** A small pattern language inspired by Strudel's mini-notation, with drums and bass synthesized in Web Audio. More work, fully original, zero dependencies.

**Core experience (path B)**
- 4–6 tracks: kick, snare, hats, ghost snare, reese bass, pad.
- Each track has a one-line pattern, e.g. `kick: x . . . . . x . | . . x . . . . .` or mini-notation like `bd ~ ~ bd ~ ~ sd ~`.
- **Live reload:** edits apply at the next bar, never mid-bar. Syntax errors highlight the line and keep the last good pattern playing.
- Per-track mute/solo, volume and a filter knob; global BPM (160–180) and swing.
- Preset grooves: "Amen-ish two-step", "Halftime", "Rollers". These are **synthesized patterns, not sampled breaks** (the Amen break recording has unresolved copyright).
- Visual: step lights or a scrolling waveform.

**Tech approach**
- Lookahead scheduler: a `setInterval` of about 25 ms schedules notes about 100 ms ahead on the `AudioContext` clock ("A Tale of Two Clocks" pattern).
- Synth voices:
  - kick: sine with pitch envelope
  - snare: noise + tone
  - hats: high-passed noise
  - reese: two detuned saws → low-pass
- **Modules:** pure `pattern/{parse.js, sequence.js}` (heavily tested), `audio/{scheduler.js, voices/*.js, mixer.js}`, `ui/{editor.js, transport.js}`.

**Tests:** the parser (rests, subdivisions `[a b]`, repeats `a*2`, errors with positions) and sequence timing per bar/step.

**Acceptance:** rock-steady timing at 174 BPM for 5 minutes; a live edit never glitches the beat; bad syntax never stops playback.

**Out of scope:** sample upload, export to audio file, full Strudel/Tidal compatibility.

**Risks:** scope creep in the pattern language. Freeze the grammar in the spec before building.

**Sanity check**
- ✅ Strudel is AGPL-3.0, so path A's warning stands. Path B avoids it. The repo has no LICENSE yet either; decide that first if choosing A.
- ⚠️ **Background tabs throttle `setInterval` to about 1 s**, so the lookahead scheduler stutters when the tab is hidden. Run the scheduler tick in a **Web Worker** (a tiny inline worker that only posts "tick") and keep scheduling on the main-thread AudioContext.
- ⚠️ Synthesized drums can sound thin. Budget time for voice tuning (a short compressor via `DynamicsCompressorNode` on the master bus helps a lot).
- ⚠️ Freeze the v0.1 grammar: tokens, `~` rest, `[a b]` subdivision, `a*n` repeat, `|` bar separator. Nothing else.
- Novelty adjusted 5 → 4: browser live-coding exists (Strudel itself). A focused DnB groovebox is still fresh for this arcade.
