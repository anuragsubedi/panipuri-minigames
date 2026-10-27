# Progress

## Current status

- **Hue Recall v0.1 — shipped and playable.** 29 tests passing (`npm test`). Verified in browser (desktop + 375px mobile, light + dark, Easy + Hard, keyboard-only play). Polish **parked** by user choice (D-014).
- **Glimpse — proposed.** Spec in `docs/PROJECT.md` → "Game 2: Glimpse". **Not built. Wait for the user's OK before implementing.**
- **Docs for humans:** `README.md` + `start.command` (double-click launcher, tested: starts server, serves hub and game, second launch just reopens browser).

## Next step

Once the user approves Glimpse, build it in reviewable steps (stop after each):

1. **Extract shared JS** — move generic helpers from Hue Recall into `shared/js/` and update Hue Recall's imports; re-run tests and re-play Hue Recall to confirm nothing broke. (See ARCHITECTURE → "Shared code".)
2. **Glimpse core + tests** — `config.js`, dot layout generator (seeded, min spacing), ratio scoring, state machine.
3. **Glimpse UI** — screens per spec, hub tile, README row; verify in browser; update docs.

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

- Glimpse: final dot-count range and flash timings — starting values in its spec; adjust during build.

## Session log

### 2026-10-26 — Session 1
- Agreed on plan: vanilla JS, pure-core/thin-UI split, CIEDE2000 scoring, HSB sliders, 5 rounds.
- Step 1: agent harness (`CLAUDE.md`, docs, `.claude/launch.json`, `.gitignore`, git).
- Step 2: pure core (conversion, CIEDE2000 verified vs. Sharma data, seeded RNG, score curve, state machine) + 25 tests. D-007…D-009.
- Step 3: UI — helpers (contrast, gradient, verdict, +4 tests), shared styles, components, five screens, `main.js` render loop, game + hub pages. D-010…D-013.
- User played v0.1, chose to skip polish (D-014). Added `README.md` + `start.command` for non-technical users (D-015). Proposed game 2 "Glimpse" with spec (D-016). Rewrote `CLAUDE.md` (status table, who-reads-what, new-game pointer); added "Adding a new game" + shared-code plan to ARCHITECTURE.
