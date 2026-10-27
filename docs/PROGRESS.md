# Progress

## Current status

- **Hue Recall v0.1 — shipped and playable.** 30 tests passing (all games + shared) (`npm test`). Verified in browser (desktop + 375px mobile, light + dark, Easy + Hard, keyboard-only play). Polish **parked** by user choice (D-014).
- **Glimpse — approved, in progress.** Spec in `docs/PROJECT.md` → "Game 2: Glimpse". Step 1/3 done (shared extraction). User wants a review stop after each step.
- **Docs for humans:** `README.md` + `start.command` (double-click launcher, tested: starts server, serves hub and game, second launch just reopens browser).

## Next step

Glimpse build, one step per review (stop after each):

1. [x] **Extract shared JS/CSS** — done (D-017). 30 tests pass; Hue Recall re-played with `?seed=42`: identical colors and scores, Menu → intro → new game works, no console errors.
2. [ ] **Glimpse core + tests** ← next — `config.js`, dot layout generator (seeded, min spacing), ratio scoring, state machine.
3. [ ] **Glimpse UI** — screens per spec, hub tile, README row; verify in browser; update docs.

## Backlog (not scheduled — ask the user before picking any up)

### Hue Recall polish (parked, D-014)
- Score curve may feel harsh in the ΔE 10–20 range — tune `SCORE_CURVE` with real attempts.
- Separate verdict words for whole-game summary (currently uses average round score).
- Brief "color hidden" transition between memorize and recreate.
- Per-channel hint on round result ("too dark", "hue off by 20°").

### Collection-wide ideas
- Best score per game saved in `localStorage` (shown on hub tiles).
- Share result as text/emoji grid with the `?seed=` link so friends can play the same game.
- Daily seed mode (seed derived from today's date).
- Sound effects toggle.
- Windows double-click launcher (`start.bat`) if a Windows user needs it.

## Open questions

- Hue Recall's result/summary CSS could become shared if Glimpse's result/summary look the same — decide in Glimpse step 3.
- Glimpse: final dot-count range and flash timings — starting values in its spec; adjust during build.

## Session log

### 2026-10-26 — Session 1
- Agreed on plan: vanilla JS, pure-core/thin-UI split, CIEDE2000 scoring, HSB sliders, 5 rounds.
- Step 1: agent harness (`CLAUDE.md`, docs, `.claude/launch.json`, `.gitignore`, git).
- Step 2: pure core (conversion, CIEDE2000 verified vs. Sharma data, seeded RNG, score curve, state machine) + 25 tests. D-007…D-009.
- Step 3: UI — helpers (contrast, gradient, verdict, +4 tests), shared styles, components, five screens, `main.js` render loop, game + hub pages. D-010…D-013.
- User played v0.1, chose to skip polish (D-014). Added `README.md` + `start.command` for non-technical users (D-015). Proposed game 2 "Glimpse" with spec (D-016). Rewrote `CLAUDE.md` (status table, who-reads-what, new-game pointer); added "Adding a new game" + shared-code plan to ARCHITECTURE.
- Glimpse approved. Step 1: extracted `shared/js/` (dom, format, rng + `seedFromQuery`, countdown with caption param, round badge) and `shared/styles/game-kit.css`; Hue Recall now imports them. Tests moved/added (`tests/shared/rng.test.js`, 30 total). D-017.
