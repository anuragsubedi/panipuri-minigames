# Progress

## Current status

- **Hue Recall v0.1** — shipped. Polish parked (D-014).
- **Glimpse v0.1** — shipped. Verified in browser (full game, keyboard, no console errors).
- 53 tests passing (`npm test`).
- `README.md` + `start.command` for non-technical players.

## Next step

Nothing scheduled. Ask the user: another game, or something from the backlog.

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

- Glimpse score curve / flash timings untested with real players.

## Session log

### 2026-10-26 — Session 1
- Agreed on plan: vanilla JS, pure-core/thin-UI split, CIEDE2000 scoring, HSB sliders, 5 rounds.
- Step 1: agent harness (`CLAUDE.md`, docs, `.claude/launch.json`, `.gitignore`, git).
- Step 2: pure core (conversion, CIEDE2000 verified vs. Sharma data, seeded RNG, score curve, state machine) + 25 tests. D-007…D-009.
- Step 3: UI — helpers (contrast, gradient, verdict, +4 tests), shared styles, components, five screens, `main.js` render loop, game + hub pages. D-010…D-013.
- User played v0.1, chose to skip polish (D-014). Added `README.md` + `start.command` for non-technical users (D-015). Proposed game 2 "Glimpse" with spec (D-016). Rewrote `CLAUDE.md` (status table, who-reads-what, new-game pointer); added "Adding a new game" + shared-code plan to ARCHITECTURE.
- Glimpse approved. Step 1: extracted `shared/js/` (dom, format, rng + `seedFromQuery`, countdown with caption param, round badge) and `shared/styles/game-kit.css`; Hue Recall now imports them. Tests moved/added (`tests/shared/rng.test.js`, 30 total). D-017.
- Glimpse step 2: core + 23 tests; `score.js`/`verdict.js` moved to `shared/js`. User asked for speed and short replies → finished step 3 in the same turn: UI, hub tile, README row; result/summary CSS moved to `game-kit.css`. D-018.
