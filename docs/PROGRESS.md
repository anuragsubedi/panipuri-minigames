# Progress

## Current status

**Step 2 of 4 complete — core logic + tests.** 25 tests passing (`npm test`). No UI yet.

## Roadmap

- [x] **Step 1 · Harness** — `CLAUDE.md`, docs, launch config, git.
- [x] **Step 2 · Core logic + tests** — `config.js`, `color/*`, `scoring/score.js`, `state/game.js`, `tests/hue-recall/*`.
- [ ] **Step 3 · UI** — styles, `ui/dom.js`, components, screens, `main.js`, game `index.html`, hub `index.html`.
- [ ] **Step 4 · Playtest & polish** — browser run-through, tune timings and score curve, update docs.

## Next step

Step 3: build the UI against the screen contract in `docs/ARCHITECTURE.md`. Suggested order: tokens/base CSS → `ui/dom.js` → `slider.js` (hardest component) → screens → `main.js` wiring → hub page.

## Open questions

- Score curve constants — starting values in D-008; tune during Step 4 playtesting.
- Neutral starting position for sliders each round (mid-grey? random hue?) — decide in Step 3.

## Session log

### 2026-10-26 — Session 1
- Agreed on plan: vanilla JS, pure-core/thin-UI split, CIEDE2000 scoring, HSB sliders, 5 rounds.
- Created agent harness: `CLAUDE.md`, `docs/{PROJECT,ARCHITECTURE,DECISIONS,PROGRESS}.md`, `.claude/launch.json`, `.gitignore`, git repo.
- Step 2: implemented pure core (HSB→RGB→Lab conversion, CIEDE2000 verified against Sharma reference pairs, seeded RNG, score curve, game state machine). Added `package.json` (ESM + test script only). Decisions D-007…D-009.
