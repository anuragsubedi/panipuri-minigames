# Game Specs — Backlog

Ranked, self-contained specs for future panipuri minigames and toys. Each spec is written so it can be built **independently in a fresh session**, by Claude Code or by another agent such as Cursor, Codex or Antigravity.

> **Repo-wide open question:** the public repo currently has **no LICENSE** (i.e. all rights reserved). Choosing one is the user's call. It also matters for Breakbench path A (AGPL).

> **Status: proposals.** Nothing here is approved to build. The agent picking one up still confirms scope with the user first (`CLAUDE.md` → working agreement).

## Before building any of these (all agents)

1. Read `AGENTS.md` → `CLAUDE.md` → `docs/ARCHITECTURE.md` ("Adding a new game", "Shared code").
2. Mirror Hue Recall / Glimpse's layout: `games/<name>/{index.html, styles/game.css, src/{main.js, config.js, state/, ui/}}`, pure logic tested in `tests/<name>/` with `npm test`.
3. Reuse `shared/js` (dom, rng, score, verdict, countdown, round badge) and `shared/styles/game-kit.css`. Don't copy them.
4. **No dependencies, no build step** (D-001). A spec marked ⚠️ *needs a dependency decision* means the user must approve an exception first, logged as a new `D-0xx`.
5. **Original identity** (D-006): genre-inspired, never a copy of a product's name, art, layout or copy.
6. Ship with a hub tile (`index.html` + `shared/styles/hub.css`), a README row, and doc updates (`PROGRESS.md`, `ARCHITECTURE.md`, `DECISIONS.md`).

**Effort unit:** a *session* is roughly one Hue Recall–sized build: spec → core + tests → UI → browser check. Hue Recall and Glimpse each took about one.

---

## Ranking

Each idea is scored 1–5 on three axes (feasibility means feasible as vanilla JS in this repo). **Score** is the sum of the three.

| Rank | Working name | Inspired by | Novelty | Wow | Feasibility | Score | Effort | Type |
|---|---|---|---|---|---|---|---|---|
| 1 | **Orbit** | solar system sandbox | 3 | 5 | 4 | **12** | 1–2 sessions | toy |
| 2 | **Pin Drop** | geo-guessing (map-only) | 3 | 3 | 5 | **11** | 1–1.5 sessions | game |
| 3 | **Keyfall** | falling-tile piano games | 3 | 4 | 4 | **11** | 1–2 sessions + chart prep | game |
| 4 | **Breakbench** | live-coded DnB (Strudel / "Switch Angel"-style) | 4 | 5 | 2 | **11** ⚠️ | 2–3 sessions | toy |
| 5 | **Drift** | binaural beats generator | 2 | 3 | 5 | **10** | < 1 session | tool |
| 6 | **Lost Lens** | photo geo-guessing (Pin Drop pack) | 3 | 5 | 2 | **10** ⚠️ | +1 session code, +1–2 asset curation | game mode |
| 7 | **Blockyard** | voxel sandbox ("mini Minecraft") | 2 | 5 | 1 | **8** ⚠️ | 2–3 (three.js) / 4–6 (raw WebGL) | toy |

**Ties are broken by feasibility.** Each spec ends with a **Sanity check**: a one-pass review of what's verified, what's risky, and what changed from the first draft. Read it before building.

**Suggested build order** (this differs from the rank, because it front-loads cheap wins):
1. Quick wins: Drift → Pin Drop.
2. Showpieces: Orbit → Keyfall.
3. Ambitious: Breakbench → Lost Lens (reusing Pin Drop's map) → Blockyard.

**Hub note:** Drift, Orbit and Breakbench are toys or tools, not scored games. When the first one ships, give the hub a "Toys" section (small `index.html` / `hub.css` change).

---

## On the full geo-guessing idea (why it's split into Pin Drop and Lost Lens)

A realistic street-imagery geo game is mostly not a code problem:
- **Imagery is the hard part.**
  - Google Street View needs a paid API key, which would be exposed client-side, and comes with restrictive terms.
  - Mapillary is free but needs an access token and attribution.
  - Either way the game depends on a network service and a key.
- **The map needs a dependency or real asset work.** A slippy map means Leaflet plus a tile server (a dependency and network). The vanilla alternative is a bundled vector world map.
- **Estimate for a "simple" photo version:** 3–5 sessions plus API or asset setup. The interactive core (click a map, measure distance, score) is only about 1 session.

**Recommendation:** build **Pin Drop** first (map-only, comparable to what we've built). Design its "clue" as a pluggable type, so **Lost Lens** can later add photo clues from a small curated, CC-licensed set without a street-imagery API.

---

## 1. Orbit — solar system sandbox (toy)

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
- Optional "mission" mode (stretch): keep a launched body in orbit for 30 s.

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

**Out of scope:** real ephemeris data, 3D, relativistic effects.

**Risks:** tuning units so default orbits look good. Keep everything in "sim units" in `config.js`.

**Sanity check**
- ✅ Leapfrog/Verlet is symplectic, so the energy-drift test is a fair bar with a fixed dt. A variable dt would break it, so use the accumulator.
- ⚠️ Trajectory preview while dragging = re-simulating ahead every frame. Cap it (e.g. 300 steps, current bodies frozen except the new one).
- ⚠️ Canvas drag on touch needs `touch-action: none`, or the page scrolls instead.
- ⚠️ When the tab is hidden, rAF stops; on return, clamp the accumulated time (e.g. max 0.25 s) so the sim doesn't explode.
- No licensing concerns (all procedural).

---

## 2. Pin Drop — map geo-guessing (game)

**Pitch:** "Where is Timbuktu?" Drop a pin on a blank world map and see how far off you were.

**Core loop:** 5 rounds, each:
1. A clue appears (place name + country, or a landmark name).
2. Click or tap the map to drop a pin, adjust it, then press **Lock it in**.
3. The reveal draws a line from your pin to the true spot and shows the distance in km plus points.
4. A summary screen with all five arcs and the total.

**Difficulty / packs:** "World capitals" (easy), "World cities" (medium), "Landmarks" (hard). Packs are JSON files. A regional pack (e.g. one country's cities) is just another file, which keeps the game "localized" with zero code changes.

**Tech approach**
- **Map:** bundled **equirectangular SVG** world map generated once from Natural Earth 1:110m land/country data (public domain), simplified to roughly 100–250 KB. Equirectangular makes click → lat/lon a linear transform, so no projection library is needed.
  - Store as `games/pin-drop/assets/world.svg` or path data in JSON.
  - Commit the small standard-library-only conversion script (`games/pin-drop/tools/geojson-to-svg.py`) so the map can be regenerated. It runs by hand, not as a build step.
- **Zoom (required, not stretch):** on a phone the map is about 350 px wide, so 1 px ≈ 115 km. Add pinch / scroll zoom and drag-to-pan via SVG `viewBox`, and place the pin in map coordinates, not screen pixels.
- **Distance:** haversine great-circle distance (pure, tested).
- **Score:** reuse `shared/js/score.js` with error = distance in km, e.g. `scale ≈ 1500 km, shape ≈ 1` (tune). Verdicts via `shared/js/verdict.js`.
- **Data:** `data/packs/*.json` with `{ name, clue, lat, lon }`. Coordinates are facts; cross-check against GeoNames (CC BY 4.0, attribute in README if used).
- **Clue types (future-proofing for Lost Lens):** `clue: { type: 'text', text }`. Later `{ type: 'photo', src, credit }`. One renderer per type.

**Modules:** `geo/{project.js, haversine.js}`, `data/load-pack.js`, `state/game.js` (phases intro → clue → reveal → summary), `ui/components/world-map.js`, `ui/screens/*`.

**Tests:** project/unproject round-trip, haversine against known city pairs (London–Paris ≈ 344 km), pack schema validation, state transitions.

**Acceptance:** works on a phone (tap to place, drag to adjust); seeded (`?seed=`); pack selectable on the intro; no network requests after load.

**Out of scope:** street imagery, slippy tiles, multiplayer.

**Risks:** map data size and simplification quality; antimeridian lines (draw the shortest path, or clamp for v0.1).

**Sanity check**
- ✅ Haversine London (51.507, −0.128) → Paris (48.857, 2.352) ≈ 343.5 km: use as a test fixture.
- ✅ Natural Earth is public domain; GeoNames is CC BY 4.0 (attribution needed only if used).
- ⚠️ Distance-based scoring is unfair across packs: being 500 km off is great for "world" and terrible for a one-country pack. Put the score `scale` **per pack** in the pack JSON.
- ⚠️ Clues like "Timbuktu, Mali" give away the country. That's fine for Easy; Hard packs should omit it.
- ⚠️ v0.1 draws a straight reveal line on the flat map (not a great-circle arc); say so in the doc. Pacific crossings will look odd.

---

## 3. Keyfall — keyboard rhythm game (game)

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

---

## 4. Drift — binaural beats generator (tool)

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

---

## 5. Breakbench — modular DnB pattern player (toy) ⚠️ *needs a dependency decision*

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

---

## 6. Lost Lens — photo geo-guessing (game) ⚠️ *needs an asset/licensing decision*

**Pitch:** Pin Drop with photographs. A street corner, a market or a mountain road: where in the world is it?

**Depends on:** Pin Drop (map, distance, scoring, clue types). Build Pin Drop first.

**Approach options**
- **A. Curated pack (recommended):** 40–100 geotagged photos from **Wikimedia Commons** with CC0, CC BY or CC BY-SA licenses.
  - Store resized (≤ 1200 px, WebP) in `games/pin-drop/assets/photos/` with a credits JSON (author, license, source URL).
  - Show credits on the reveal screen.
  - Rule out photos with obvious giveaway text (signs) per difficulty, or embrace them on Easy.
- **B. Mapillary API:** dynamic street-level imagery. Needs an access token (client-exposed), attribution and network access, and adds the Mapillary JS viewer if you want panoramas ⚠️ (a dependency).

**Core loop:** Pin Drop's, with `clue.type = 'photo'`. Optional "zoom into photo" interaction.

**Effort:** 1 session of code on top of Pin Drop, plus 1–2 sessions of asset curation and licensing checks.

**Acceptance:** every photo has license + attribution displayed; total asset size budget ≤ 15 MB; works offline after load.

**Sanity check**
- ✅ Build it **as a photo pack and clue type inside Pin Drop** (`games/pin-drop/`), not as a separate game folder. The hub can have its own tile linking to `games/pin-drop/?pack=photos`.
- ⚠️ CC BY-SA photos: resizing makes an adaptation, so keep the same license and credit the author. Store license + author + source per photo and display them.
- ⚠️ Commons "camera location" vs. "object location" geotags differ. Prefer camera location and spot-check every photo by hand.
- ⚠️ Curation is the real cost (finding non-trivial, non-giveaway, correctly geotagged photos). It's a human-in-the-loop task, and agents will need user review of the set.

---

## 7. Blockyard — tiny voxel sandbox (toy) ⚠️ *needs a dependency decision*

**Pitch:** A small floating island of blocks. Walk around, dig, build and pick from a handful of block colors. No survival, no crafting: just building.

**Reality check:** This is the largest idea by far.
- **Raw WebGL from scratch (no dependencies):** shaders, a camera, chunk meshing with face culling, ray-cast block picking, pointer-lock controls and collision. Realistically **4–6 sessions**, with a high risk of rough edges.
- **With three.js (a dependency):** about **2–3 sessions**.
- Either way it's the least "minigame-like" item here.

**Minimal scope (v0.1)**
- One 32×32×16 chunk with a generated island (seeded value noise).
- First-person: WASD + mouse look (pointer lock), jump, simple AABB collision.
- Left click breaks a block; right click places one; number keys choose from 6 flat-colored block types (no textures, so no assets).
- Optional: save the world to `localStorage`.

**Tech approach (path without dependencies):**
- Single VBO per chunk, rebuilt on edit (greedy meshing is a stretch).
- Ray march with the DDA voxel traversal algorithm (Amanatides & Woo).
- Pure modules, all testable: `world/{chunk.js, noise.js, mesh.js}`, `physics/{raycast.js, collide.js}`. Then `gfx/{gl.js, shaders.js, camera.js}`.

**Acceptance:** 60 fps on a laptop; break/place feels instant; no falling through the floor; touch is out of scope (desktop only, stated on the hub tile).

**Out of scope:** multiple chunks / infinite world, mobs, crafting, multiplayer, textures.

**Recommendation:** only after the others ship, and only with an explicit user decision on raw WebGL vs. three.js.

**Sanity check**
- ✅ Estimates hold: the "mini Minecraft" core loop needs meshing, picking, collision and controls before it's fun at all. There's no cheap partial version that wows.
- ⚠️ Pointer lock requires a user click and doesn't exist on mobile, so desktop only (as stated).
- ⚠️ Rebuilding a 32×32×16 chunk mesh on each edit is fine (about 16k voxels); don't over-engineer greedy meshing in v0.1.
- ⚠️ Name, art and copy must stay original: no blocky-grass texture look-alikes or familiar block names.
- This remains last in the order; it's the only idea that likely needs a dependency to stay pleasant to build.
