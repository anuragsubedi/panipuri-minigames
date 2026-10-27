# Progress

## Current status

- **Hue Recall v0.1** — shipped. Polish parked (D-014).
- **Glimpse v0.1** — shipped. Verified in browser (full game, keyboard, no console errors).
- **Beatween v0.1** — shipped (binaural beats tool, was "Drift"). Audio graph verified via an AudioContext probe (oscillators match L/R; noise loop; suspend on pause); layout verified at 375×667, ~426×826, 740×360 landscape and desktop, light + dark. **Not verified by ear**: needs a headphone listen.
- **Orbit v0.1** — shipped (gravity sandbox toy). Verified at 375×667, 740×360 landscape and 1280×800, light + dark; drag-launch, preview, select/delete, presets; 61 fps with 30 bodies (physics ≈ 0.3 ms/frame at 8×). Touch drag tested with synthetic pointer events only: **needs a real-phone try**.
- 89 tests passing (`npm test`).
- `README.md` + `start.command` for non-technical players.
- **Live site:** https://anuragsubedi.github.io/panipuri-minigames/. GitHub Pages serves the **`live`** branch (release branch, D-025); every push publishes.

## Next step

Nothing scheduled. Next games are specced and ranked in `docs/specs/README.md`, meant to be built independently in fresh sessions or other agent tools. Suggested order: ~~Beatween~~ → ~~Orbit~~ → Pin Drop → Keyfall → Breakbench → Lost Lens (after Pin Drop) → Blockyard. Ask the user which one.

Open repo-wide questions (user's call):
- **No LICENSE file** in the public repo.
- **Pipeline:** fast mode is live (push to `live` → Pages). Long-term CI/PR flow in `docs/specs/pipeline.md` (not implemented). Server features later via Cloudflare Workers (D-022).
- **Phone-first goal (user):** start agent sessions from iOS/Android; today that means a cloud agent pushes to `live` and the user plays the public URL. Previews, smoke tests and the issue-driven flow are in the long-term plan.
- **Architect agent:** long-term goal for when panipuri scales (`docs/specs/architect-agent.md`, D-026).
- **`main` vs `live`:** `main` is an older snapshot; a PR `live → main` was opened for the harness overhaul. `live` is the repo's **default branch** (cloud agents clone it by default).

## Backlog (not scheduled — ask the user before picking any up)

### Hue Recall polish (parked, D-014)
- Score curve may feel harsh in the ΔE 10–20 range — tune `SCORE_CURVE` with real attempts.
- Separate verdict words for whole-game summary (currently uses average round score).
- Brief "color hidden" transition between memorize and recreate.
- Per-channel hint on round result ("too dark", "hue off by 20°").

### Orbit ideas
- "Mission" mode (spec stretch): keep a launched body in orbit for 30 s.
- Pinch/wheel zoom; follow-selected-body camera.
- A 3D take as its own toy (would need its own spec).

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
- Wrote `docs/specs/README.md`: 7 ideas ranked (novelty / wow / feasibility) with self-contained specs and a per-spec sanity check; added `AGENTS.md` for other agent tools. D-019.
- Wrote `docs/specs/pipeline.md` (agent-first CI/CD proposal). D-020.
- Host decided: GitHub Pages (+ Workers later). Wrote `docs/specs/architect-agent.md`; harness updated with the no-self-merge rule. D-022, D-023.
- Recorded the phone-first goal; pipeline spec gained a "Phone-first workflow" section; agent guides note cloud sessions. D-024.
- Harness overhaul on new release branch `live`: specs split into `docs/specs/` (README + one file per game; pipeline + architect specs moved there); GitHub Pages enabled from `live` → https://anuragsubedi.github.io/panipuri-minigames/. Architect agent marked long-term. D-025, D-026.
- Built **Beatween** (spec "Drift"): pure core (settings/link logic, log scale, bands, noise, Lissajous) + 15 tests, Web Audio engine, scope/channel/transport UI, responsive one-screen layout. Hub tile + README row. D-028.
- Built **Orbit** (gravity sandbox): pure physics (leapfrog, softening, merge/bounce, path preview) + presets + world + camera/trails, 21 new tests (89 total); canvas renderer, launcher, deck, sky overlay; hub gained a "Toys" section. Mission mode deferred. D-029.
