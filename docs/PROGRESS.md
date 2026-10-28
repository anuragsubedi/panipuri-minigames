# Progress

## Current status

- **Hue Recall v0.1** — shipped. Polish parked (D-014).
- **Glimpse v0.1** — shipped. Verified in browser (full game, keyboard, no console errors).
- **Pin Drop v0.2** — World + **India** maps (D-032…D-034): India-view borders with state lines, 34 capitals, 164 cities, 61 landmarks with blurbs, Wikidata fame tiers. Verified headless at 375×667 and 1280×800, light + dark, no overflow; **needs a real-phone try**. Verified in headless Chromium at 375×667 (light) and 1280×800 (dark): full games incl. Hard · Mix · 10 rounds, no console errors, no page scroll, no network requests during play; pinch / tap / pin-drag / pan tested with synthetic touch events only: **needs a real-phone try**.
- **Pin Drop: Nepal map** (D-035) — Survey Department boundaries (official outline incl. Kalapani–Lipulekh–Limpiyadhura): 7 provinces, 77 districts, 753 palika lines fading in on zoom, 23 rivers. Topics Cities (all 753 palikas; rural on Hard), Landmarks (78), Nature (74: parks, lakes, rivers, peaks), Mix. Rivers, parks and lakes score as shapes. Verified headless at 375×667 and 1280×800, light + dark: full 10-round games in every topic, no console errors, no network during play, no page scroll or intro overflow. **Needs a real-phone try.** 9 places held back (`"todo"` in the source lists) until they have trustworthy coordinates: Kanchenjunga, Cho Oyu, Makalu, Ganesh Himal, Himalchuli, Marsyangdi and Arun III hydropower, Kakrebihar, Malikarjun Temple. Fame tiers for Nepal are hand-set so far (Wikidata counts not yet fetched).
- **Beatween v0.1** — shipped (binaural beats tool, was "Drift"). Audio graph verified via an AudioContext probe (oscillators match L/R; noise loop; suspend on pause); layout verified at 375×667, ~426×826, 740×360 landscape and desktop, light + dark. **Not verified by ear**: needs a headphone listen.
- **Orbit v0.2** — shipped and live (real units + clock, heaviest-bodies list, Solar system preset, zoom, saves; D-030). Gravity sandbox toy. Verified at 375×667, 740×360 landscape and 1280×800, light + dark; drag-launch, preview, select/delete, presets; 61 fps with 30 bodies (physics ≈ 0.3 ms/frame at 8×). Touch drag and pinch tested with synthetic pointer events only: **needs a real-phone try**.
- **How it works** pages for all four games (`games/<name>/how.html`, D-031).
- 141 tests passing (`npm test`).
- `README.md` + `start.command` for non-technical players.
- **Live site:** https://anuragsubedi.github.io/panipuri-minigames/. GitHub Pages serves the **`live`** branch (release branch, D-025); every push publishes.

## Next step

1. **Finish Nepal:** coordinates for the 9 held-back places (Wikidata or Wikipedia pages; the cloud IP is rate-limited, see `handover` idea in the session log), then `fetch-fame.py` → `nepal-cities.py` → `apply-fame.py` on the landmarks and nature packs.
2. **Nepal Atlas** (user's next goal): spec in `docs/specs/games/nepal-atlas.md`; confirm v0.1 scope and the offline-tool dependency question first.
3. Pin Drop NZ, then USA maps (user's order).

After that, the remaining specs in `docs/specs/README.md`: Keyfall → Breakbench → Lost Lens (reuses Pin Drop's map + clue types) → Blockyard.

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

### Pin Drop v0.2 data sources (checked reachable 2026-10-27)
- **Region maps:** Natural Earth 1:10m admin-1 states/provinces (public domain) for state borders; Natural Earth also ships *point-of-view* country files (e.g. `ne_10m_admin_0_countries_ind`) that draw disputed borders as a given country does, which matters for an India map. geoBoundaries ADM1/ADM2 (mostly CC BY 4.0, per-country simplified files; NZ from Stats NZ). US Census cartographic boundary files (public domain).
- **Places:** GeoNames `cities15000`/`cities5000` (CC BY 4.0: needs attribution) with population and admin codes, for regional city packs and state capitals. Natural Earth 1:10m populated places (public domain) as a lighter option.
- **Landmarks + fame:** Wikidata (CC0) has coordinates, country/state and sitelink counts (a good "fame tier" signal), but Wikimedia rate-limits this cloud IP; run that query from the user's machine or a fresh session. OpenStreetMap Nominatim (ODbL, attribution) works and is what the landmarks pack uses.

### Pin Drop ideas
- **v0.3 (user):** a small authoring page to add landmarks by hand: search/click on a map, write the blurb, set the tier, copy out the JSON line.
- Wikidata's query service was in an outage (1 request/min) on 2026-10-27; `fetch-fame.py` retries, but run it when it's healthy.
- Great-circle reveal arcs (and wrap across the antimeridian).
- Keyboard pin placement (arrow keys move a crosshair) for accessibility.
- 3D globe mode.
- Tune `scoreScaleKm`, tiers and verdicts with real plays.

### Orbit ideas
- "Mission" mode (spec stretch): keep a launched body in orbit for 30 s.
- Follow-selected-body camera; share a saved system as a link.
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
- **Orbit v0.2:** real units (0.01 AU / 0.001 M☉ / ≈1.84 d), clock + rate, speeds ¼–64×, heaviest-bodies list, inspector km/s + AU, Solar system preset from J2000 elements, zoom (pinch/wheel/buttons), distance-sampled smooth trails, saved systems via a System sheet. 10 new tests (99). Dropped backdrop blur over the canvas for phone perf. D-030.
- Added lean "How it works" pages for Hue Recall, Glimpse, Beatween and Orbit; numbers and charts read from each game's config. Top-bar link in each game; one line on the hub. D-031.

### 2026-10-27 — Pin Drop v0.1
- Scope agreed with the user: 2D equirectangular map with borders, no labels; pinch/scroll/drag zoom; 5 or 10 rounds; topic (Capitals / Cities / Landmarks / Mix) separate from difficulty via per-place fame tiers; regional maps deferred to v0.2. Work happens on `live` directly (user preference).
- Core + 30 tests: projection, haversine/bearing, viewport math, pack validation (bundled packs checked for size per topic × difficulty), seeded region/pack-spread picking, pluggable clue, state machine.
- Data: Natural Earth → `data/maps/world.json` and capitals/cities packs via committed scripts; 76 hand-picked landmarks.
- UI: intro with three choices, clue/reveal/summary screens, map component + gestures, `how.html`, hub tile, README row. D-032.
- Pushed v0.1. Then, on user feedback: landmark coordinates regenerated from OpenStreetMap via a committed tool (all 76 reviewed); intro redesigned with a preview map of the current pool and labelled choices; v0.2 data sources surveyed (see Backlog). D-033.

### 2026-10-27 — Pin Drop v0.2 (India)
- User decisions: India first, then Nepal, NZ, USA; India's official-view borders with a provenance note; topics capitals, cities, landmarks; blurbs for landmarks; no paid data; Google Maps API rejected.
- New tools: `build-region-map.py`, `region-packs.py`, `fetch-fame.py`, `apply-fame.py`; `geocode-landmarks.py` now takes a pack header, blurbs, and keeps Wikidata ids. Wikidata worked from the cloud session (no local run needed).
- Game: Map choice (World | India), per-map grid/scale/detail word, regional map layers (muted neighbours, focus country, dashed state lines, note), ⓘ landmark hints, compact two-row intro. 132 tests. D-034.

### 2026-10-27 — Pin Drop: Nepal map
- User wanted Nepal "as detailed as possible" (home country). Natural Earth turned out to have Nepal's old 14 zones and 17 places, so the map uses the Survey Department's 2024 boundaries from OCHA HDX: provinces, 77 districts and 753 palika lines from one admin-3 file (`build-region-map.py` "cod" mode); the outline already matches Nepal's official map.
- Topics (user OK): Cities · Landmarks · Nature · Mix; every palika is a target (rural ones on Hard). `nepal-palikas.py` places each palika at its OSM town node, only if inside the palika's polygon; `nepal-cities.py` builds the pack (77 HQs, spellings, tier list in `nepal-cities-source.json`).
- Landmarks (82) and Nature (79) lists drafted, user-approved; blurbs say what, not where. `geocode-nepal.py` checks every hit against the stated district polygon, skips businesses named after a place (a café "…Boudhanath", a dental clinic "Kakrebihar"), builds rivers and lakes from the HOT OSM waterways export (whole courses) and takes a few points from Wikidata. Every match reviewed by hand; 9 held back as `"todo"`.
- Engine: places may be shapes (`geo/shape.js`): score to the nearest point of a river, or 0 km inside a park; reveal highlights it. Faint rivers on the base map. "Right on it" now scales with the pack (7.5 km in Nepal).
- Wikimedia rate-limited this cloud IP to 1 request/min; Overpass, Geofabrik and Wikipedia were unreachable. A handover prompt for a local session was written (not used yet). The auto-mode safety check also failed for a while, blocking commands.
- Wrote the **Nepal Atlas** spec (user's next goal; ranked 2 / 8) with a feature ranking and verified data sources. D-035. 141 tests.

### 2026-10-28 — Light Speed Roads spec filed
- User supplied a spec for a new toy, **Light Speed Roads** (road networks light up area by area at a configurable speed; shared engine + standalone host + Nepal Atlas Roads view; Nepal v0.1, US v0.2, India/China v0.3). Filed verbatim as `docs/specs/games/light-speed-roads.md` and linked from `docs/specs/README.md` as an unranked proposal. Nothing implemented; no D-number yet (its §15 requires a critique and a residency decision first). The build happens in a separate session.
