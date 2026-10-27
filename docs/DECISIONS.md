# Decision Log

Append-only. Each entry: context, decision, why, consequences. Supersede rather than edit.

---

## D-001 · Vanilla HTML/JS with native ES modules, no build step

- **Date:** 2026-10-26
- **Context:** Quick, iterative prototype that must stay readable and maintainable.
- **Decision:** Plain HTML/CSS/JS using `<script type="module">`. No npm, bundler or framework.
- **Why:** Zero setup, nothing to upgrade, any browser can run it. Modules give us real file-level separation.
- **Consequences:** Must be served over HTTP (`python3 -m http.server`), not `file://`.

## D-002 · Pure core separated from DOM

- **Date:** 2026-10-26
- **Decision:** `state/`, `color/`, `scoring/` contain only pure functions; `ui/` renders; `main.js` wires.
- **Why:** Logic is testable with `node --test` without a browser; UI can be restyled without touching rules.
- **Consequences:** Timers live in `main.js`/UI components, never in state.

## D-003 · Tests via Node's built-in test runner

- **Date:** 2026-10-26
- **Decision:** `node --test tests/` for pure modules. No test framework.
- **Why:** Keeps the zero-dependency promise.

## D-004 · CIEDE2000 for color distance

- **Date:** 2026-10-26
- **Context:** Scoring must feel fair; equal RGB distances are not perceptually equal.
- **Decision:** Compare colors in CIELAB using CIEDE2000.
- **Why:** Current standard for perceptual difference; ~60 lines of pure code.
- **Alternatives:** RGB Euclidean (unfair), ΔE76 (simpler but over-penalizes saturated colors).

## D-005 · HSB sliders as the input method

- **Date:** 2026-10-26
- **Decision:** Three vertical sliders: hue, saturation, brightness.
- **Why:** Maps to how people describe color ("a darker, duller blue"); easy to render live gradients.

## D-006 · Original identity

- **Date:** 2026-10-26
- **Decision:** The game is named **Hue Recall** with its own visual design and copy. The memorize-and-recreate mechanic is a common genre; we do not copy any existing product's branding, layout or text.

## D-007 · Minimal package.json for ESM + test script

- **Date:** 2026-10-26
- **Context:** Node treats `.js` as CommonJS unless told otherwise; tests import the browser ES modules directly.
- **Decision:** Root `package.json` with only `"type": "module"` and `"test": "node --test \"tests/**/*.test.js\""`. No dependencies, ever.
- **Why:** Same source files run in the browser and in Node without duplication or renaming to `.mjs`.

## D-008 · Score curve: max · exp(-(ΔE / scale) ^ shape)

- **Date:** 2026-10-26
- **Decision:** Starting values `scale = 22`, `shape = 1.6` (in `config.js`).
- **Resulting points:** ΔE 2.3 → 9.73 · 5 → 9.11 · 10 → 7.53 · 20 → 4.24 · 30 → 1.93 · 50 → 0.24.
- **Why:** `shape > 1` keeps barely-noticeable errors near-perfect; decay is smooth with no cliffs. To be tuned in Step 4.

## D-009 · Pure state transitions throw on invalid phase

- **Date:** 2026-10-26
- **Decision:** `state/game.js` transitions assert the current phase and throw otherwise.
- **Why:** Wiring bugs in `main.js` (e.g. double submit) fail loudly instead of corrupting state.

## D-010 · Slider start position: random hue, S 50, B 75

- **Date:** 2026-10-26
- **Decision:** Each round the hue slider starts at a random value; saturation and brightness start at 50 / 75 (`START_GUESS` in `config.js`).
- **Why:** A random hue stops the player anchoring to the same spot; mid-high S/B keeps every track's gradient readable (at S = 0 the hue track goes grey).

## D-011 · Shared styles across games

- **Date:** 2026-10-26
- **Decision:** `shared/styles/{tokens,base}.css` hold the design tokens, reset and top bar for the hub and every game; each game adds only its own stylesheet.
- **Why:** One visual identity for the collection without games importing from each other.

## D-012 · Whole-card re-render per phase; no virtual DOM

- **Date:** 2026-10-26
- **Decision:** On every state change `main.js` cleans up the current screen and renders the next from scratch. High-frequency input (slider drags) stays local to the screen.
- **Why:** Five small screens make full re-renders cheap and keep each screen a single function with no diffing logic.

## D-013 · Pointer capture + ARIA slider instead of `<input type="range">`

- **Date:** 2026-10-26
- **Decision:** Custom vertical slider (`role="slider"`, arrow / Shift / PageUp / Home / End keys, pointer capture for drag).
- **Why:** Native vertical range inputs are inconsistent across browsers and hard to style with live gradients and a color-filled thumb.

## D-014 · Hue Recall polish parked; prioritize new games

- **Date:** 2026-10-26
- **Context:** After playing v0.1 the user found it "pretty playable" and chose not to do the planned Step 4 (playtest & polish).
- **Decision:** Hue Recall stays at v0.1. Its polish ideas move to the backlog in `PROGRESS.md`. New effort goes to new games.
- **Consequences:** Don't tune or polish Hue Recall unless the user asks.

## D-015 · Non-technical README + macOS double-click launcher

- **Date:** 2026-10-26
- **Decision:** Root `README.md` written for non-coders; `start.command` starts `python3 -m http.server 5173` bound to 127.0.0.1 and opens the browser. If the port is already in use it just opens the browser.
- **Why:** Lowest-effort start for a layperson without adding tooling or dependencies. Python 3 ships with/is easily installed on macOS.
- **Consequences:** README must stay jargon-free; `CLAUDE.md` remains the technical entry point.

## D-016 · Second game: Glimpse (proposed)

- **Date:** 2026-10-26
- **Decision:** Proposed a dot-count estimation game ("Glimpse") as game 2; spec in `PROJECT.md`. Awaiting user approval.
- **Why:** Quick (≈1 min), tests a different perceptual skill (number sense) than Hue Recall, reuses the card / screen / render-loop architecture, and is a generic genre rather than a copy of a specific product.
- **Scoring:** ratio-based error `|ln(guess/actual)|` so being 10% off feels the same at 10 dots and 100 dots.
