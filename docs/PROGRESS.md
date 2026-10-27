# Progress

## Current status

**Step 1 of 4 complete — harness & docs.** No game code yet.

## Roadmap

- [x] **Step 1 · Harness** — `CLAUDE.md`, docs, launch config, git.
- [ ] **Step 2 · Core logic + tests** — `config.js`, `color/*`, `scoring/score.js`, `state/game.js`, `tests/hue-recall/*`.
- [ ] **Step 3 · UI** — styles, `ui/dom.js`, components, screens, `main.js`, game `index.html`, hub `index.html`.
- [ ] **Step 4 · Playtest & polish** — browser run-through, tune timings and score curve, update docs.

## Next step

Step 2: write the pure modules and their `node --test` suites. Start with `color/convert.js` (everything else depends on it).

## Open questions

- Score curve shape and constants — decide during Step 4 playtesting.
- Neutral starting position for sliders each round (mid-grey? random hue?) — decide in Step 3.

## Session log

### 2026-10-26 — Session 1
- Agreed on plan: vanilla JS, pure-core/thin-UI split, CIEDE2000 scoring, HSB sliders, 5 rounds.
- Created agent harness: `CLAUDE.md`, `docs/{PROJECT,ARCHITECTURE,DECISIONS,PROGRESS}.md`, `.claude/launch.json`, `.gitignore`, git repo.
