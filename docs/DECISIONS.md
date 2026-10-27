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

## D-017 · Shared JS/CSS extracted ahead of Glimpse

- **Date:** 2026-10-26
- **Decision:** Moved `dom.js`, `format.js`, the countdown and round badge components, and the RNG (`createRng`, `randomInt`, new `seedFromQuery`) into `shared/js/`; moved card/screen/button/segmented/countdown CSS into `shared/styles/game-kit.css`. Countdown caption is now a parameter. Hue Recall imports from `shared/`; behaviour unchanged (same seed → same game).
- **Why:** Glimpse needs the same building blocks; one copy avoids drift. Moves used `git mv` to keep history.
- **Not moved:** Hue Recall's result/summary styles (`result__*`, `summary__*`) — revisit in Glimpse step 3 if Glimpse reuses them.

## D-018 · Glimpse v0.1 shipped; more shared code

- **Date:** 2026-10-26
- **Decision:** `score.js` and `verdict.js` moved to `shared/js/` (both games use the same decaying curve and verdict lookup). Result panel and summary list CSS moved into `game-kit.css`. Glimpse renders dots as SVG in a unit-square viewBox; guesses are typed (numeric keypad on phones) with −/+ steppers.
- **Why:** Avoid duplicate code; SVG scales crisply to any card size.
- **Note:** The user asked for faster, terser work, so steps 2–3 were finished back to back.

## D-019 · Future-game specs + AGENTS.md

- **Date:** 2026-10-26
- **Decision:** `docs/GAME-SPECS.md` holds ranked, self-contained proposals (not approved builds) for Orbit, Pin Drop, Keyfall, Breakbench, Drift, Lost Lens and Blockyard. Each has a sanity check. `AGENTS.md` points any agent tool at `CLAUDE.md`.
- **Why:** The user wants to build games independently in fresh sessions and in other tools (Cursor, Codex, Antigravity).
- **Notable calls:** a full street-imagery geo game is split into Pin Drop (map-only, first) and Lost Lens (a photo pack inside Pin Drop). Breakbench recommends its own engine over wrapping AGPL Strudel. Blockyard likely needs a dependency exception.

## D-020 · Proposed pipeline: GitHub Pages + Actions, PR-only flow (proposal)

- **Date:** 2026-10-26
- **Status:** proposed, not implemented.
- **Proposal:** `npm run verify` (zero-dep checks: tests, import graph, relative links, game registry, no deps, size) and `npm run build` (assemble `_site/`); CI on every PR; deploy `main` to GitHub Pages; agents work on branches and never merge their own PRs; Phase 2 adds Cloudflare Pages previews and CI-only Playwright smoke tests.
- **Why:** The site is static, so free hosting and sub-minute CI are enough. Previews let the user play a branch before merging.

## D-021 · Long-term hosting view (proposal)

- **Date:** 2026-10-26
- **Status:** proposed.
- **View:** GitHub Pages is fine for Phase 1. Longer term, Cloudflare (Pages or Workers static assets) is preferred: unmetered static traffic, previews, custom headers (COOP/COEP), commercial use on free tier, and Workers/Durable Objects for future server features. Vercel is preferred only if moving to Next.js (Hobby tier is non-commercial). Host-agnostic `_site/` keeps switching cheap. Details in `docs/PIPELINE-SPEC.md` → Hosting choice.

## D-022 · Host: GitHub Pages; server features on Cloudflare Workers

- **Date:** 2026-10-26
- **Decision (user):** Deploy the static site to GitHub Pages. When games need server compute (leaderboards, multiplayer, keeping API keys secret), add Cloudflare Workers as a separate backend; the site stays on Pages.
- **Supersedes:** the open hosting question in D-020/D-021.

## D-023 · Architect agent for PR review and merge (proposal)

- **Date:** 2026-10-26
- **Status:** proposed; depends on the pipeline (D-020).
- **Decision:** Authors never merge their own PRs. A separate Architect agent (its own GitHub App identity) reviews every CI-green PR. It auto-merges only **tier A** PRs (changes confined to one game + append-only hotspot edits + docs); tier B (`shared/`, multi-game) and tier C (`.github/`, `scripts/`, `package.json`, agent guides) need the user, enforced by CODEOWNERS. The tier comes from a deterministic path-classification script, not the model.
- **Why:** Lets builder agents ship routine work end-to-end while the user keeps control of shared code, pipeline and policy. Guards against PRs rewriting their own reviewer, the `GITHUB_TOKEN` no-trigger gotcha, and prompt injection via PR content.

## D-024 · Phone-first agent workflow is a design goal

- **Date:** 2026-10-26
- **Context (user):** The user wants to start agent sessions from a phone (cloud sessions) to add features and games ad hoc.
- **Decision:** Treat cloud/phone sessions as first-class. The build/verify must need only git, Node 22 and Python 3; results reach the user as PRs with preview links. PR previews (Cloudflare Pages, previews only, production still on GitHub Pages) and CI browser smoke tests move up to Phase 1.5; an issue-driven `@claude` mention flow comes in Phase 2.
- **Why:** On a phone, the user can't open an agent's localhost, and cloud agents may lack a browser, so previews and automated browser checks are the only practical way to see and trust changes.

## D-025 · Release branch `live`, served directly by GitHub Pages

- **Date:** 2026-10-26
- **Decision (user):** A new branch **`live`** is the release branch. GitHub Pages deploys it via "Deploy from a branch" (root, `.nojekyll`, no Actions) at https://anuragsubedi.github.io/panipuri-minigames/. Agents commit and push to `live` directly (after the user OKs a change in-session), with no PR or merge step. `main` stays as an older snapshot; a PR `live → main` records the harness overhaul.
- **Why:** The user wants agents (including phone-driven cloud sessions) to ship quickly without PR merge overhead. A static site with no build step can be served straight from the branch.
- **Trade-off:** No CI gate, so a bad push goes live (mitigated by `npm test` before pushing; fix by pushing a revert). The CI/PR flow in `docs/specs/pipeline.md` remains the long-term plan.

## D-026 · Specs folder; Architect agent is long-term

- **Date:** 2026-10-26
- **Decision:** `docs/GAME-SPECS.md` was split into `docs/specs/README.md` (rules, ranking, build order) plus one file per game in `docs/specs/games/`, each with a status header. `PIPELINE-SPEC.md` and `ARCHITECT-AGENT-SPEC.md` moved to `docs/specs/pipeline.md` and `docs/specs/architect-agent.md`. Earlier decision entries keep their old paths (append-only log).
- **Why:** Agents read and edit only the spec they need, which keeps context small and avoids conflicts between parallel edits.
- **Also (user):** The Architect PR-review/merge loop is a long-term goal for when panipuri scales massively, not near-term work.

## D-027 · `live` is the default branch

- **Date:** 2026-10-26
- **Decision (user):** GitHub default branch set to `live`, so fresh clones and cloud/phone agent sessions start on the release branch.

## D-028 · Beatween (binaural tool) design choices

- **Date:** 2026-10-27
- **Name:** spec "Drift" shipped as **Beatween** (the beat lives between the two tones). User asked for a fitting name.
- **Layout:** a one-screen instrument (not the game card): XY scope + control deck, stacked on phones, side by side on wide/landscape. Controls update in place instead of re-rendering.
- **Visual:** XY Lissajous of left vs right tone, phosphor afterglow; morph speed is the beat **slowed and capped (≤ 0.9 Hz)** to avoid 2–40 Hz flicker (photosensitivity). Scope is always dark; the rest follows the theme.
- **Controls:** per-ear typed value + log slider + ½ / −1 / +1 / ×2; link toggle keeps the beat when either ear moves; beat ± on the scope moves the right ear.
- **Audio:** ChannelMerger for exact L/R separation; `navigator.audioSession.type = 'playback'` (iOS silent switch) when available; screen wake lock while playing (phones stop audio on lock); context suspended after fade-out.
- **Copy:** no health claims ("Not medical advice", "keep the volume low").

## D-029 · Orbit (gravity sandbox) design choices

- **Date:** 2026-10-27
- **Scope:** v0.1 is the spec minus the "mission" stretch mode (candidate for v0.2). 2D only; a 3D take could be a separate spec later.
- **Physics:** leapfrog (kick-drift-kick) with fixed `DT = 0.05`, accumulator, real time clamped to 0.25 s, ≤ 400 steps/frame; Plummer softening 1.5; O(n²); cap 50 bodies; bodies > 2400 units from the center of mass are dropped. Energy drift < 1% over 20 000 steps (tested).
- **Units:** G = 1, Sun mass 1000, view radius 250, 20 sim time units per real second at 1×. Gravity and Sun mass are **multipliers** on a log₂ slider (0.25×–4×, 1× in the middle; tap the value to snap back to 1×).
- **Stars are flagged** (`star: true`), not inferred from mass, so the Sun-mass slider can scale them down and back. Merges keep the heavier body's id and colour.
- **Camera** eases toward the center of mass, so launched momentum doesn't carry the system off screen.
- **Launch:** drag from empty sky; arrow + predicted path (others frozen, 300 coarse steps, dots at equal time so spacing shows speed, ✕ on a hit). Tap selects. Launch size cycles Moon / Planet / Giant.
- **Look:** sky is night (canvas starfield) in dark mode and a pale daylight chart in light mode; planets lit from the brightest star; tapered fading trails; merge ring flash (off with reduced motion, which also starts at ½×). Deck uses the house tokens.
- **Hub:** new "Toys" section (Beatween + Orbit).
