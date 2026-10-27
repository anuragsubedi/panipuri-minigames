# Progress

## Current status

**Step 3 of 4 complete — v0.1 is playable.** 29 tests passing (`npm test`). Full game verified in the browser: hub, intro, memorize countdown, slider recreate (drag + keyboard), round result, summary; desktop + mobile (375px), light + dark; Easy and Hard timings; no console errors.

## Roadmap

- [x] **Step 1 · Harness** — `CLAUDE.md`, docs, launch config, git.
- [x] **Step 2 · Core logic + tests** — `config.js`, `color/*`, `scoring/score.js`, `state/game.js`, `tests/hue-recall/*`.
- [x] **Step 3 · UI** — shared styles, `ui/*`, five screens, `main.js`, game page, hub page.
- [ ] **Step 4 · Playtest & polish** — play several real games, tune timings and score curve, update docs.

## Next step

Step 4: playtest with real (human) attempts and tune `SCORE_CURVE` and `VERDICTS` in `config.js`. Candidate polish items below.

## Polish candidates (for Step 4, not yet agreed)

- Score curve may feel harsh in the 10–20 ΔE range — check against real attempts.
- Summary verdict uses the average round score; consider a separate set of words for the whole game.
- Brief "colors hidden" transition between memorize and recreate so the change doesn't feel abrupt.
- Show the ΔE or a per-channel hint ("too dark", "hue off by 20°") on the round result.
- Focus ring shows on the hue slider after a keyboard-started round — intended, but verify it doesn't distract.

## Open questions

- Score curve constants — starting values in D-008.

## Session log

### 2026-10-26 — Session 1
- Agreed on plan: vanilla JS, pure-core/thin-UI split, CIEDE2000 scoring, HSB sliders, 5 rounds.
- Step 1: agent harness (`CLAUDE.md`, docs, `.claude/launch.json`, `.gitignore`, git).
- Step 2: pure core (conversion, CIEDE2000 verified vs. Sharma data, seeded RNG, score curve, state machine) + 25 tests. Decisions D-007…D-009.
- Step 3: UI. Added pure helpers `color/contrast.js`, `color/gradient.js`, `scoring/verdict.js` (+4 tests); shared styles; DOM helpers, components (slider, countdown, swatch, round badge); five screens; `main.js` render loop; game and hub pages. Decisions D-010…D-013 (slider start, shared styles, re-render model, custom slider).
