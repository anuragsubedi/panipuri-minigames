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
