# Light Speed Roads — Spec

**Status:** Proposal — not yet approved for build. Critique required before building (see §15).
**Spec path in repo:** `docs/specs/games/light-speed-roads.md` — this spec stays a separate file.
**Code residency:** Shared engine + two hosts — a proposal to critique, not a decree (see §4).
**Versions:** v0.1 — Nepal pilot · v0.2 — United States · v0.3 — India and China
**Decision owner for architecture:** The implementing agent (Claude Opus 5.5), after the critique and feasibility analysis in §15, with the final residency choice recorded in `docs/DECISIONS.md` before any build.

> This spec fixes the product goals, the data principles, and the questions that must be answered. It deliberately does **not** fix where every file lives, the rendering engine, the local client framework, or the browser delivery format. Where this spec leans toward an answer, it says so, gives its reasons, and names what evidence would overturn the lean.

---

## 1. How to read this spec — and how to argue with it

This is an open-ended proposal, not a build order.

- **Fixed** (§3) means: do not change it without going back to the user. Product goals, real data, official-view borders, attribution, and this repo's constraints live here.
- **Open** (§3) means: choose, justify with evidence, and record the choice. Rendering, formats, client stack, and final file layout live here.
- **Leans** are this spec's best current guess. A lean is meant to be overturned by a measurement, a prototype, or a better argument — not obeyed because it is written down.
- **Acceptance** (§18) is written as outcomes, not implementation. Meeting an outcome by a different method than the one sketched here is success, not deviation.
- Before building, the implementing agent must complete the critique in §15: challenge the residency model, the Nepal-first order, and the engine/host boundary, and propose revisions where the evidence points elsewhere. Building straight from this spec without that critique is a failure of the process, even if the code works.

---

## 2. Pitch

A map animation in which a country's road network lights up, admin area by admin area, at a **configurable speed** — light speed included, but not assumed.

Roads start dim. One area at a time turns gold, in a defined order. Counters track cumulative distance covered, elapsed time at the chosen speed, and how many areas are done. The effect should feel like a sweep travelling across the country: fast, legible at national scale, and satisfying to watch area by area.

Speed has to be configurable because the countries do not scale alike. At the speed of light, the United States reference run takes about 38 seconds — watchable. Nepal's whole road network, on the order of 64,500 km depending on what is counted, takes about 0.22 seconds at light speed — a flash, not an animation. The same toy therefore needs speed as a first-class parameter (§8), so a small country can run at a fraction of light speed, or at a car's or a plane's pace, and still be worth watching.

The reference is a short-form video of the United States in which California is shown at 636,465 miles / 3.42 seconds and the full run totals 7,123,403 miles / 11,464,006 km / 38.24 seconds. Those numbers are a **reference check only**. This project recomputes its own totals from real data (see §9.4), so its totals are expected to differ.

There are two ways to experience it, in two different places (§4):

- **Standalone toy** — pick a country, play / pause / scrub the animation, change speed, jump to an area. This is where every country lives.
- **Nepal Atlas, Roads view** — the same animation for Nepal, inside Nepal's digital atlas, surrounded by the atlas's other views and statistical layers. This is where Nepal gains context no standalone toy can give it.

A third experience may follow later, if feasibility supports it:

- **Configured video export** — set speed, level of detail, and zoom behaviour in a client, preview the result, and render a finished video file offline. Rendering does not have to be real-time.

---

## 3. Fixed vs open

### 3.1 Fixed — change only with the user's approval

| # | Principle |
|---|---|
| F1 | **Real data.** Boundaries and roads come from real sources, recomputed by this project. No hard-coded totals from the reference video, no generated or stylised road patterns presented as real. The earlier stylised US prototype is reference only for look, timing, and interaction. |
| F2 | **Country-agnostic product.** Nepal, the US, India, and China are data packs for one product, not separate games with separate codebases. |
| F3 | **Nepal is not trapped in the atlas, and the atlas is not a dependency of the toy.** The standalone toy must work without the atlas existing; the atlas host must be able to adopt the engine later without a rewrite of either side. |
| F4 | **Official-view borders.** Each country's map shows that country's official view, following the rule already used by Pin Drop in this repo, with a provenance note shown on the map. Boundary and road-clipping sources for a country must be the same view, or roads and borders will not line up. |
| F5 | **Speed is configurable.** Light speed is one preset, not the definition of the toy (§8). |
| F6 | **Measurement ≠ display.** Mileage is always computed from full-precision data. Display data may be simplified. Never compute mileage from simplified display geometry. |
| F7 | **Repo constraints.** Anything that ships in the browser follows this repo's conventions — vanilla HTML / CSS / JS, native ES modules, no dependencies, no build step — unless the feasibility analysis proposes an exception and a new decision is logged. Shared code moves to `shared/` only when a second game or tool actually needs it. |
| F8 | **Attribution is in the product**, not only in the data files, for every source used (§9, §15.2 item 9). |
| F9 | **Critique before build.** No build step starts until §15 is answered, acknowledged, and the residency decision is recorded in `docs/DECISIONS.md` with a new D-number. |

### 3.2 Open — the implementing agent decides, with evidence

| Question | This spec's lean | What could overturn it |
|---|---|---|
| Final residency and file layout | Shared engine + two hosts, phased (§4) | Evidence that the engine/host split costs more than the duplication it avoids at Nepal's scale, or that the atlas timetable makes a different order cheaper |
| Where the engine physically lives at each phase | Starts in the pilot host; moves to `shared/js/` only when the second host uses it | A second host arriving sooner than expected, or a local-client host needing the engine in a form `shared/js/` cannot serve |
| Rendering approach | Undecided — raster vs vector vs hybrid, per data pack if needed (§13) | Frame-time measurements on a cheap phone and on the MacBook |
| Browser vs local client, per version | Browser first for Nepal; local client becomes primary at US scale and for export | Measured payload and performance per country (§14) |
| Data source per country | OpenStreetMap leans more consistent across countries; test per country (§9.2) | Per-country comparisons of size, classification quality, completeness, and mileage |
| Reveal unit per country | Nepal: district (77). US: state. India: state / UT. China: province-level | Evidence that a unit is too coarse to animate or too fine to read at national scale |
| Speed defaults per country | Fix a watchable playback duration and derive the effective speed, rather than fixing light speed (§8) | User testing showing a fixed physical speed reads better for a given country |
| Configurator and video export phasing | In scope subject to feasibility; propose explicit phasing rather than dropping or guaranteeing | §15.2, item 6 |

---

## 4. Residency and integration — where this actually lives

The spec file is separate. The code is not one place. This section is the heart of the spec, and the section the critique in §15 must challenge hardest.

### 4.1 The three parts

**One shared engine.** Country-agnostic animation logic: manifest loading, timeline and scrubbing, configurable speed and duration, counters, camera and zoom, sweep reveal, partitioned loading with prefetch and eviction, and render caching. The engine must not know that the US has 48 contiguous states in v0.2 scope, that Nepal has 77 districts, or that China needs a datum fix. Those are data-pack facts, and putting them in the engine breaks F2.

**Data packs, one per country.** Each pack owns everything country-specific: boundaries, road partitions, reveal unit, reveal order, projection, road-class filter, recomputed totals, official view and provenance note, and language labels. Adding a country means adding a pack and registering it — not rewriting the timeline, counter, camera, or loader code. A pack also declares what its data can support (for example full vector in the browser, or hybrid / raster at national scale), so different packs may legitimately use different rendering strategies behind the same engine interface.

**Hosts.** Thin shells that give the engine a place to live, a map surface, and surrounding UI. Two hosts to start (§4.2, §4.3), a possible third later (§4.4). Host-specific UI stays in the host. The engine never imports host code.

### 4.2 Host 1 — standalone toy

- **Proposed location:** `games/light-speed-roads/`, with its own hub tile in the Toys section.
- **Role:** the global product. Country picker, full-screen animation, speed control, scrubber, counters, an area grid or list to jump to a state / district / province, and — subject to feasibility — configurator entry and video export.
- **Countries:** every pack lives here first: Nepal (v0.1), US (v0.2), India and China (v0.3).
- **Why it must exist:** a Nepal-only feature inside the atlas would strand the US, India, and China versions, which have no atlas to live in. The toy is what makes the product country-agnostic (F2, F3).

### 4.3 Host 2 — Nepal Atlas

- **Location:** inside `games/nepal-atlas/`, as a **Roads view** plus an **animation mode** on that view. The atlas spec is `docs/specs/games/nepal-atlas.md`; read it before designing this host. This spec does not change the atlas's scope, ranking, or v0.1 — it proposes an addition to it.
- **Role:** the Nepal product in context. Same engine, same Nepal pack, atlas chrome around it:
  - the atlas view switcher, with a shareable URL hash (the atlas pattern is `#physical`; this view would be `#roads`)
  - legend as part of the page, like the atlas's other views
  - tap a district for a card — HQ, province, area, population — extended with road facts for that district: road km, share of the national total, road density
  - statistical layers joined the atlas way: road km per district and road density per 100 km² as choropleths in a `stats.json` keyed by the same HDX pcodes (`NP01`, `NP0101`, …) every atlas table uses, classified by the atlas's pure `classify` approach — a new stats dataset, not new joining code
  - later, where the atlas data supports it: roads against terrain — for example a road view over the Physical view's elevation, or a district's roads in the cross-section tool. Named here as a direction, not v0.1 scope.
- **Shared, not copied:** Nepal boundaries, district pcodes, and district statistics come from the same sources as the atlas (Survey Department boundaries via OCHA HDX, as already used by Pin Drop). The atlas host must not carry a second, drifting copy of Nepal's boundaries.
- **Map component:** the atlas spec already plans to move Pin Drop's map, gestures, and geo projection / viewport code to `shared/js/map/` once a second tool needs them. A road host is exactly that kind of second need. The critique (§15) should say whether the roads work triggers that move, follows it, or should stay independent of it — and why.
- **Budget discipline:** as an atlas view, the Nepal road layer inherits the atlas's budgets: at most 2 MB per view at overview zoom, at most 40 MB for the whole atlas in the repo, lazy loading beyond the overview, and the atlas acceptance of at most 1 MB before first paint with the first view usable within 3 seconds on a 3G-class connection. A road layer that breaks those budgets does not ship as an atlas view until the budget question is resolved explicitly (§20).

### 4.4 Possible host 3 — local configurator / video renderer

A headless or desktop host that runs the same engine with no browser UI: config in, preview and frames out, encoded to a standard video file. This is the natural home for the US at full detail and for export quality that a browser cannot reach. It is **not** committed by this spec: §15.2, item 6 decides whether it exists, in which version, and on which OS-agnostic stack (§14.1). MacBook-first, but no Mac-only stack without explicit justification.

### 4.5 Alternatives considered — argue with these

| Option | For | Against |
|---|---|---|
| Standalone toy only | Simplest; follows the repo pattern exactly; ships alone | Nepal gets no atlas context; road statistics duplicate the atlas's pcode join and card patterns; two Nepals (toy boundaries, atlas boundaries) can drift apart |
| Atlas view only | Maximum reuse of boundaries, map, legend, and cards | Nepal waits for an unbuilt atlas; US / India / China have nowhere to live; the toy stops being country-agnostic, breaking F2 |
| **Shared engine + two hosts (this spec's lean)** | Both contexts served; a sweep or counter fix lands once, for every country and both hosts; countries are packs, not forks | An engine/host interface must be designed before either host is finished; a premature abstraction is a real risk at Nepal's small scale — mitigated by §4.6, not by ignoring it |

### 4.6 Phasing the split — do not pay for the abstraction before it is needed

Following this repo's shared-code rule (F7):

1. **Pilot phase:** the engine is built inside Host 1, for the Nepal pack, but behind an explicit host interface (§5.3) from the first commit — no atlas imports, no standalone-only assumptions baked into engine modules.
2. **Migration trigger:** the engine moves to `shared/js/` (exact subpath open) when — and only when — a second host actually consumes it: the atlas Roads view, or the local renderer, whichever comes first. After the move, re-check every existing host, per the repo rule.
3. **Until the trigger fires,** calling the engine "shared" is a design property (clean interface, no host leakage), not a folder location. The critique may propose a different trigger; it may not propose copying the engine into a second host.

---

## 5. The contracts: engine, data pack, host

Indicative, not final. §15 may revise these boundaries — that is what they are written down for.

### 5.1 Engine owns

- Manifest loading and validation; per-area metadata lookup.
- Timeline: given config and manifest, reveal order, per-area start / end times, camera keyframes, and counter values at any time `t`. Pure and fully testable.
- Speed model (§8): physical speed, playback duration, and the conversion between them.
- Partitioned loading: working set, prefetch in reveal order, cancellation on jumps, least-recently-used eviction (§11.3).
- Rendering abstraction: draw a frame for a given time, config, and loaded data, to a surface the host provides (§13). No timeline logic inside the renderer.
- Export stepping: the same timeline walked offline at full quality, if export is in the approved phase.

### 5.2 A data pack declares

- Country id, display name(s), and language labels.
- Reveal unit and the unit list: id, name, code (for Nepal, the HDX pcode), centroid or point-on-surface, bounding box.
- Reveal order (default rule plus any manual adjustments, stated in the pack).
- Projection, already baked into the geometry during preprocessing (§10).
- Boundaries and road partitions, in the formats the pack declares, with major / local splits where that matters (§11).
- Road definition actually used (§9.3), source, vintage, licence, and official-view provenance note.
- Recomputed totals per area and nationally (§9.4), from full-precision data (F6).
- Capabilities: which rendering strategies and zoom depths the pack's data sizes honestly support.

### 5.3 A host provides, and only a host provides

- The map surface and viewport (in the atlas host, the atlas's shared map component; in the standalone host, its own — until the shared-map move in §4.3 settles this).
- Chrome: navigation, view switcher, legend, cards, country picker, area grid, configurator UI.
- URL behaviour (for example the atlas's `#roads` hash), hub tile, and any host-level routing.
- Platform file access behind the loader's small interface, so the engine's loading logic stays platform-free.
- Attribution display, using the pack's provenance data (F8).

### 5.4 The boundary rule

If a piece of code needs to know a country's name, unit count, or language to work, it is not engine code. If a piece of UI would be identical, word for word, in the atlas and the standalone toy, it probably belongs to the engine's presentation layer or to `shared/` — flag it in the critique rather than duplicating it silently.

---

## 6. Versions and scope

### 6.1 v0.1 — Nepal pilot (standalone host)

- **Why Nepal first:** its road network is roughly two orders of magnitude smaller than the US network, its boundaries and district data already exist in this repo from Pin Drop, and it is the one country with a second host waiting for it. The pilot proves the pipeline, the speed model, and the engine/host interface end to end, cheaply — and its failures will be small, fast, and auditable district by district in a way a US-first failure would not be.
- 77 districts as the reveal unit (see the granularity note below), provinces and palikas present in the data where the pack design needs them, but not reveal steps in v0.1.
- Real district boundaries and real road geometry, starting fresh from real data.
- Interactive animation is the core deliverable, in Host 1, in the browser (§14.2), subject to the measured payload fitting an agreed budget.
- Configurable speed with the §8 presets and defaults is core, not a stretch goal — without it, Nepal at light speed is 0.22 seconds long.
- The atlas host is **designed for** in v0.1 (interface, shared sources, pcode-keyed stats) but **built** only when the atlas itself is ready to receive it, unless §15 proposes and the user approves a different order. v0.1 must not silently become "build the atlas".
- Configurator and video export: in scope **subject to feasibility** (§15.2, item 6). If they cannot sensibly land with the pilot, the implementing agent proposes explicit phasing (for example v0.1 interactive, v0.1.1 configurator, v0.1.2 export) with reasons — rather than silently dropping them or silently guaranteeing them.

**Granularity note (open):** 7 provinces is too few steps for a satisfying reveal; 753 palikas is too many for v0.1 and belongs, if anywhere, at zoom. 77 districts is the lean. The critique should test it against real per-district road totals — a district with almost no in-scope roads makes a dead step, and the pack may need a stated rule for that.

### 6.2 v0.2 — United States (standalone host)

- A new data pack, not a new product: same engine, same manifest schema, same hosts' code paths.
- 48 contiguous states. Alaska, Hawaii, and territories are out of scope unless the feasibility analysis shows they cost almost nothing to include.
- This is the scale test the Nepal pilot cannot provide: national payload, per-state partitioning, major / local level of detail, and — if the browser edition cannot carry it — the local client (§14.1) becoming primary for this pack.
- The reference video's numbers remain a check on order of magnitude only (Appendix).

### 6.3 v0.3 — India and China (standalone host)

- India: 28 states and 8 union territories, subject to the boundary source chosen. China: provincial-level divisions, subject to the boundary source chosen.
- Borders follow F4. This applies in particular to Jammu and Kashmir, Ladakh, and Arunachal Pradesh, and to China's boundaries.
- Known difficulties to plan for, not discover mid-build: disputed borders in India; spottier OpenStreetMap coverage and surveying restrictions in China; and China's GCJ-02 coordinate shift versus WGS84. Any datum handling happens offline, in preprocessing, per pack — never as a special case inside the engine. Road and boundary layers for a country must be in the same datum.

### 6.4 Later, unnamed

- Atlas host built out in full (§4.3), including road-density choropleths and road-against-terrain views, on the atlas's own timetable.
- Additional countries as packs, each needing its own source, official-view, and completeness audit before it is announced as scope.
- Palika-level (Nepal) or county-level (US) reveal at zoom, if a pack's data and the rendering measurements support it.

---

## 7. User experience

### 7.1 Interactive animation (both hosts)

- Controls: play / pause, restart, speed control (§8), a scrubbable timeline, and a way to jump directly to an area (tapping it in an area grid or list, or on the map where hit-testing is reliable).
- Counters, updated from the timeline: cumulative distance (km and miles), elapsed time at the chosen speed, effective speed, and areas completed / total.
- Labels: the current area is named as it lights up. Completed areas are clearly distinguishable from pending ones.
- Camera: the view may stay national or zoom toward the active area. The behaviour is configurable (§12), not hard-coded.
- Layout: follow this repo's established preference for a compact single screen with no unnecessary scrolling, visualiser / map on top, controls below. Judge the layout on a phone screen first for any browser version, and on a MacBook window for a local client. In the atlas host, the atlas's own layout rules win where they conflict (the atlas is landscape-first, with the card sliding up on phones).
- Accessibility where the platform allows it: areas reachable without relying only on canvas hit-testing (for example a DOM area grid in a browser version, or an equivalent list in a native client).

### 7.2 What differs between hosts

| | Standalone toy | Nepal Atlas host |
|---|---|---|
| Entry | Hub tile → country picker | Atlas view switcher → `#roads` |
| Framing | The animation is the page | Roads are one atlas page among Political, Physical, Rivers, People, and the rest |
| Tapping an area | Jump to / replay that area | Atlas card: district facts plus road facts (§4.3) |
| Extra layers | Country-level look and counters | Road choropleths on pcode-joined stats; later, terrain context |
| Language | Pack labels | Atlas's Nepali / English toggle, when the atlas has one |

### 7.3 Configurator (host-provided, engine-driven)

The user should be able to retune the animation **without changing code**. All tunables live in a config (§12). At minimum, where the approved phase includes a configurator, it exposes:

- playback: speed mode and value (§8), total duration, hold and transition timing, easing, reveal order, frames per second for export
- level of detail: which road classes are shown at national view versus at area zoom, simplification tolerance, line width
- camera / zoom: mode, padding around an area, minimum and maximum zoom
- look: dim and gold colours, glow strength, label style, counter units
- output: aspect ratio (for example 9:16 for Shorts, 16:9), resolution, output path

Changing a value updates a fast, low-resolution preview using the same config. Saved configs are profiles that can be reused across countries — a profile names speeds and looks, never country facts.

### 7.4 Video export (if in the approved phase)

- Export is offline and non-real-time. A frame may take far longer than a real-time frame budget if that buys quality: full vector drawing for the active area, large blur for glow, supersampling for anti-aliasing.
- The exporter reports progress and produces a standard video file (MP4 via ffmpeg or an equivalent the agent justifies).
- The same config drives preview and export. What the user previews is what they render, apart from resolution and effects quality.

---

## 8. The speed model

Speed is a model, not a slider glued to a timer. Two quantities must never be conflated:

- **Physical speed** — how fast the sweep is said to be travelling: a distance per unit of *journey time*. Examples: light speed (299,792 km/s; 186,282 miles/s), a fraction of it (0.01c, 0.001c), the speed of sound, a plane, a car, a walker. Journey time for an area is its road distance divided by the physical speed, and the counters report journey time.
- **Playback duration** — how long the animation itself lasts on screen, in *video time*. A 38-second light journey may be presented as a 30-second or a 90-second video, and the counters follow the timeline, not the wall clock.

Config therefore specifies one quantity and derives the other (§12): either *"run at 0.01c, however long that takes"*, or *"run for 60 seconds, at whatever effective speed that implies"*, with the derived value always displayed next to the chosen one. Silent divergence between the two is a bug.

**Defaults are per pack, and the lean is:** for a small country, fix a watchable playback duration and show the effective speed — Nepal at exactly light speed lasts about 0.22 seconds on the 64,500 km order-of-magnitude figure, and about 21 seconds at 0.01c, which is the kind of default the pilot should test. For the US, light speed is already watchable, so a physical-speed default is honest there. Presets should span human to light speeds so the same control teaches the scale in every country — the critique may propose the preset list.

Playback-rate controls (1× / 2× / 4×) multiply video time only. They never rewrite the physical speed shown in the counters.

---

## 9. Data

### 9.1 Nature of the data

The raw data is vector geometry with attributes attached to each shape. It is not a map image.

- **Boundaries are polygons** (often multipolygons — for example Michigan, Florida's keys, Louisiana's delta islands; in Nepal, districts split by rivers and ridges). Attributes include an area code, name, and abbreviation — in Nepal, the HDX pcode the atlas joins on.
- **Roads are polylines** made of many small segments. Each segment carries a type or class attribute, which is what makes filtering and level of detail possible.
- Both layers normally start in longitude / latitude. Length cannot be measured in degrees, and a flat map needs a projection. Each pack bakes in its own sensible projection during preprocessing — an Albers equal-area centred on the contiguous US (for example EPSG:5070) is the conventional US choice; Nepal's pack must state its choice and stay consistent with the atlas / Pin Drop geometry it will sit beside — so boundary and road layers align exactly.

Expect the raw data to be messy in predictable ways: road segments duplicated at district, county, or tile borders; roads crossing area borders that must be split; divided highways represented as two centre lines (with a double-counting risk); boundary polygons that include water where there are no roads; and vintage mismatches between a boundary file from one year and a road file from another. Pick one vintage per country and use it for both layers.

### 9.2 Sources — an open decision, per country

The implementing agent must explore and decide, with evidence, per pack. The working lean, not a decision, is that **OpenStreetMap may be more consistent across all four countries** — one model, one tooling chain — and the agent should test that lean rather than inherit it.

| Country | Candidates to compare | Country-specific cautions |
|---|---|---|
| Nepal | OpenStreetMap (including HDX-hosted extracts); Department of Roads data and statistics, where geometry is actually obtainable | Completeness is uneven: expect stronger coverage in the Terai and the Kathmandu Valley than in hill and mountain districts; published national totals differ by what is counted (see Appendix), so the road definition matters more than the headline figure |
| US | Census TIGER (clean US classification, public domain, smaller extract — but US-only, so later countries need a second pipeline) vs OpenStreetMap | Compare both on at least one dense state and one sparse state: file sizes, classification quality, resulting mileage |
| India | OpenStreetMap; GADM / Natural Earth / OSM admin relations for boundaries, subject to F4 and licence checks | Official-view boundaries are the constraint, not an afterthought (F4) |
| China | OpenStreetMap; GADM / Natural Earth / OSM admin relations for boundaries, subject to F4 and licence checks | Coverage, surveying restrictions, and the GCJ-02 datum shift (§6.3) |

Boundary sources for Nepal are not an open question in the same way: the atlas host requires the Survey Department boundaries already used by Pin Drop and the atlas (OCHA HDX), or the two hosts' Nepals will not align (§4.3).

### 9.3 What counts as a road

This definition must be stated in the manifest and in the product, because it moves every total substantially — in Nepal's case, it is the difference between a strategic-network figure on the order of 13,500 km, a Department of Roads figure on the order of 34,100 km, and an all-roads figure on the order of 64,500 km (Appendix).

- In OpenStreetMap terms this is a filter on `highway` tags: motorway through residential are the obvious inclusions; footway, path, and cycleway are the obvious exclusions to consider. Whether tracks and service roads are in is a per-pack decision that must be stated — in rural Nepal it changes the map's meaning, not just its total.
- In TIGER terms (US, if chosen) this is a filter on MTFCC codes: primary (S1100), secondary (S1200), and local (S1400) are the obvious inclusions; walkways (S1710), bike paths (S1820), alleys (S1730), and private drives (S1750) are the obvious exclusions to consider.
- The agent must state exactly which classes are in per pack, how divided highways are handled, and how border-crossing segments are allocated to exactly one area.
- The critique should specifically ask, for Nepal, whether the pilot should be strategic-network-only (smaller, cleaner, more official) or all in-scope OSM highways (denser, more honest as "the road network") — and what each choice does to per-district totals and dead steps (§6.1).

### 9.4 Mileage and counters

- Counters use **real data recomputed by this project**, per pack. Reference numbers are not truth and must not be hard-coded as results.
- Per area: sum road length in a projected, metre-based coordinate system after clipping roads to that area, then convert to kilometres and miles, derive journey time at any speed from §8, and check that the area values sum to the reported national total.
- Also record a visual centroid suitable for labels and camera work. An arithmetic centroid can fall in water or outside an irregular area, so use a point-on-surface or a hand-checked equivalent.

---

## 10. Preprocessing pipeline

Preprocessing is offline, scripted, and repeatable — never a manual, per-area editing process. It runs once per country and whenever the source vintage or the road definition changes. Following the Pin Drop and atlas precedents in this repo, tools are committed, documented, and run by hand; they are not a build step for the shipped page or client. Per-pack tools live with the pack's data work, not inside the engine (for example an atlas-style `build-roads.py` for Nepal, named by the agent).

Pipeline stages:

1. **Ingest and inspect** — download sources, record source, vintage, licence, and checksum; check coordinate reference system and fields; keep raw files untouched.
2. **Filter** — keep only the in-scope admin areas and the road classes defined in §9.3.
3. **Reproject** — project boundaries and roads together to the pack's projection, in metres.
4. **Clean** — fix invalid polygons, de-duplicate segments, split roads at area borders, apply the divided-highway rule.
5. **Simplify for display only** — generalise display geometry with a stated tolerance (coarser for boundaries, finer for roads). Simplify topologically, or use a shared-arc representation such as TopoJSON, so shared borders do not crack and simplified roads still meet at junctions. Independent per-feature simplification causes gaps, false crossings, collapsed parallel carriageways, and roads spilling across borders.
6. **Derive the table** — per area: mileage, kilometres, journey time at light speed, centroid, bounding box, reveal order, vertex counts, and the simplification tolerance used. For Nepal, also emit the pcode-keyed road statistics the atlas host will consume (§4.3).
7. **Partition and render or encode** — write the per-area outputs described in §11, plus any pre-rendered images the chosen renderer needs, plus — for Nepal — a check that output boundaries still match the atlas / Pin Drop boundaries they must align with.

Tooling is the agent's choice (for example GDAL / `ogr2ogr`, osmium, GeoPandas / Shapely, DuckDB Spatial, Mapshaper), subject to §14.2's constraints for anything that ships in the browser, and to the atlas's open offline-tool dependency question where a tool is shared with the atlas: offline-only `pip` packages are a decision to log, never a silent adoption.

---

## 11. Representation and loading

### 11.1 Area-wise partitioning

Do not ship or load a single national road file at runtime. Partition by reveal area, on disk, with a small manifest loaded first.

An illustrative layout — the agent may change the formats, but not the partitioning principle:

```text
manifest.json
data/<area>/boundary.<ext>
data/<area>/roads_major.<ext>
data/<area>/roads_local.<ext>
```

- The manifest is tiny and loads at startup: per area, name, code, centroid, bounding box, mileage from full-precision data, file paths, vertex counts, and level-of-detail information.
- Splitting each area into major roads and local roads matters where local roads are the bulk of the data — the US above all. Nepal's pilot may honestly not need the split; the manifest schema must not prevent it, and the pilot must not fake it.
- A very large area in a later pack may need a further tile split inside the area. The manifest schema should not prevent that.

### 11.2 Format

Raw GeoJSON is a poor runtime format at US scale: it is large text, slow to parse, and memory-hungry even from local disk. The agent should evaluate binary or indexed alternatives (for example FlatGeobuf, GeoParquet, PMTiles / vector tiles, TopoJSON, or a custom flat-array encoding) and justify the choice per platform — and may justify plain GeoJSON-like encodings for the Nepal pilot if measured sizes make the heavier formats pointless there. Format may differ per pack; the manifest contract may not.

In memory, at scale, roads should not be held as one object per segment. A flat representation — one Float32 array of coordinates, one index array marking where each polyline starts, and one small array for road class — is far smaller and is what canvas and GPU renderers actually consume.

### 11.3 Loading on demand into RAM

- Load only a working set: typically the current area, the previous area, and the next one or two areas. (For Nepal in a browser, the honest working set may be "everything, because it is small" — say so from measurements, do not perform a loader the data does not need.)
- Load in the background, never blocking the animation or UI thread.
- Prefetch in reveal order. Because the order is fixed, prefetching should be near-perfect in normal playback.
- Evict with a simple least-recently-used policy where memory requires it. Keep completed areas cheap to restore for scrubbing.
- Handle jumps explicitly: if the user scrubs or jumps across the country, cancel in-flight loads for skipped areas, show the best available fallback (for example major roads or a pre-rendered image), and swap in detail when it arrives. Fast scrubbing must not cause load thrashing.
- After an area is first drawn, cache its rendering (offscreen canvas, pixmap, or texture). Later frames should reuse the cache rather than re-drawing every line.

---

## 12. Config

Config is data, not code. The renderer is a function of config plus data partitions. The configurator only edits config and invokes preview or render.

The schema below is illustrative and grouped as the configurator should present it. The agent should finalise field names, defaults, validation, and versioning, and keep all tunables in one place following this repo's `config.js` convention for any browser code. Note what is **not** in it: no country facts. Country, unit, and order come from the pack (§5.2); config selects a pack and tunes behaviour.

```json
{
  "pack": "nepal",
  "speed": { "mode": "duration", "duration_sec": 45 },
  "playback": { "fps": 30, "order": "west_to_east" },
  "detail": {
    "national": ["primary", "secondary"],
    "area_zoom": ["primary", "secondary", "local"],
    "simplify_m": { "national": 100, "area_zoom": 20 }
  },
  "camera": { "mode": "zoom_per_area", "padding": 0.15, "max_zoom": 4 },
  "look": { "dim": "#1b3a5c", "gold": "#f5c542", "glow": 0.8 },
  "output": { "aspect": "9:16", "width": 1080, "height": 1920 }
}
```

`speed.mode` is `"physical"` (use the preset / explicit speed, derive the duration) or `"duration"` (use `duration_sec`, derive and display the effective speed), per §8. Camera zoom should normally be computed from each area's bounding box plus padding, capped at a minimum and maximum, so small areas automatically receive more zoom than large ones without hand-tuning every value.

---

## 13. Rendering — options to evaluate, not a pre-made choice

The roads-versus-boundaries distinction drives everything here. Boundaries are few (77 districts, 48 states) and cheap to keep as vectors everywhere. Roads are the performance problem — a modest one in Nepal, a severe one in the US. The engine's rendering interface (§5.1) must therefore allow the strategy to differ per pack, and the critique must not lock the US strategy in from Nepal measurements, or Nepal's from US fears.

The agent must compare, with a small prototype or measurements where a claim is load-bearing:

| Approach | How it works | Strengths | Weaknesses |
|---|---|---|---|
| Raster roads | Pre-render dim and gold road images offline; reveal gold clipped to vector area outlines | One image draw per layer; cost is independent of road count; cities bloom naturally | No per-road identity, styling, or order; blurs past image resolution; large images |
| Vector roads | Ship simplified per-area vectors; draw on demand, cull to viewport, filter by zoom level | Real roads, restylable, sharp at zoom, true per-road sweep possible | Needs partitioning, culling, and level of detail; far more code and data |
| Hybrid | Draw vectors once per area into an offscreen cache, then animate the cache like raster | Vector accuracy and sweep order on first reveal; raster speed afterwards | Most moving parts; cache invalidation on config change must be handled |

Rendering surfaces to compare on top of that choice:

- **Canvas 2D** — immediate-mode drawing. Good fit for a timeline, camera moves, and compositing cached area images. No free hit-testing, accessibility, or text layout, so labels and controls live in the DOM or native UI. Avoid live shadow blur except on the single active area; pre-bake glow where possible. Cap device pixel ratio (for example at 2) in any real-time preview.
- **SVG / DOM** — retained-mode shapes with free styling, events, and accessibility. This is the atlas's and Pin Drop's map idiom, which is an argument for it in the atlas host at Nepal scale. Good for area outlines and simple click-to-light interactions. A poor fit for very large segment counts or per-frame filter-based glow — measure where the crossover falls rather than assuming it.
- **WebGL / WebGPU** — GPU buffers and shaders; the only browser route to true vector roads with deep zoom, normally via a library such as MapLibre GL or deck.gl rather than raw WebGL. High setup cost, and a library is a dependency decision under F7, not a default. Only justified if deep, crisp zoom is a real requirement.

How a sweep works differs by representation, and the agent should prototype the chosen one:

- With raster, a sweep is a moving mask: clip gold to the area polygon intersected with a moving shape (a west-to-east wipe, an expanding circle, or a feathered gradient), or fade the area as a whole. All roads inside the swept area appear together.
- With vectors, a sweep can be ordered: sort segments by longitude, distance from an entry point, or another stated rule, and draw each segment when the front reaches it. This looks more organic at area zoom.

Offline video rendering may use a completely different surface from the interactive one (for example Pillow, Cairo, Mapnik, or headless capture of the interactive version, encoded with ffmpeg), as long as it consumes the same data and config.

---

## 14. Platforms in detail

Which platform is "primary" is per version now, not global — Nepal and the US are different products in scale, and the spec should say so plainly.

### 14.1 Local MacBook client — primary at US scale and for export

Local storage removes the network problem: no download time, no browser tab memory cap, direct file access, background parsing, and the ability to memory-map or index large files. It does not remove parsing or drawing costs, which is why §11 still applies. Candidate stacks for the agent to evaluate — none is pre-selected:

- **Tauri wrapping the browser implementation** — reuses the browser code in a small native shell using the system web view. Fastest path if a browser version also exists, and the natural shape for Host 3 (§4.4).
- **Python with Qt (PySide6), plus GeoPandas / Shapely** — strongest GIS ecosystem and a script-based workflow with no compile step; drawing performance and packaging need checking.
- **A Python offline renderer plus a lightweight preview** — the smallest option if video is the real end product and a full client proves unnecessary.
- Other OS-agnostic options the agent can justify. Electron should be justified against its size if proposed.

Whichever stack is chosen, the client must: read partitions from a local data folder, load on demand per §11.3, expose the configurator in §7.3, preview from config, and run export in the background with progress while the UI stays responsive.

### 14.2 Browser — primary for the Nepal pilot and the atlas host

A browser version should follow this repo's existing conventions unless the feasibility analysis explicitly proposes and justifies an exception (F7):

- Vanilla HTML / CSS / JS, native ES modules, no dependencies, no build step.
- Pure core separated from DOM code; `main.js` as the only wiring point; tunables in `config.js`; named exports only; single-responsibility modules.
- Shared code moves to `shared/` only when a second game or tool actually needs it (§4.6).
- Served locally with the repo's existing method and published via GitHub Pages from `live` only after the user's OK.

Two different size regimes apply, and must be reported separately in §15:

- **Standalone host:** this repo's long-term pipeline work assumes a small total site size (around 25 MB total, around 5 MB per file). A US pack may break that; a Nepal pack is expected not to. Measure each pack early and, for any pack that exceeds the budget, present clear options — a reduced-detail browser edition, lazy per-area loading from Pages, hosting data separately, or no browser edition for that pack — for the user to decide. Do not quietly exceed the budget and do not quietly drop a browser edition.
- **Atlas host:** the atlas's stricter budgets in §4.3 govern, because there the road layer shares a repo budget and a first-paint budget with every other atlas view.

---

## 15. Critique and feasibility analysis required before building

The implementing agent (Claude Opus 5.5) must complete this **first**, present it for acknowledgement, and only then build — one step at a time, one commit per step, following this repo's working agreement. Each answer needs evidence (a measurement, a prototype, or a cited source), not just an opinion. Disagreeing with this spec, with reasons and evidence, is a successful outcome of this section.

### 15.1 Critique — challenge the spec itself

1. **Residency.** Is shared engine + two hosts (§4) actually better for this repo than standalone-only or atlas-only, at Nepal's scale, in sessions and maintenance — or is it abstraction bought too early? If the answer is "not yet", propose the smallest revision that keeps F2 and F3 true.
2. **Nepal first.** Does the Nepal pilot actually de-risk the US, or does it mostly de-risk Nepal? Name what will *not* transfer (scale, format, renderer, loader) and whether the version order should change because of it.
3. **Engine / pack / host boundary.** Attack §5 with concrete cases: the atlas card, the country picker, Nepali labels, the US local client, a GCJ-02 fix. Does each land on exactly one side of the boundary? Revise the boundary where it does not.
4. **Speed model.** Is §8's physical-speed / playback-duration split the right model, and are the per-pack default leans right? Propose the preset list.
5. **Atlas coupling.** Should the atlas host be a Roads *view*, an animation *mode* on an existing view, or a layer several views can show? What does each do to the atlas spec's own v0.1 and budgets?
6. **Granularity.** Test §6.1's district lean against real per-district road totals, including dead or near-dead steps, and propose the rule for them.

### 15.2 Feasibility — measure, per pack where it matters

1. **Data source, per country in the version being built:** for Nepal, OSM-based geometry vs any obtainable official geometry, plus completeness by region (§9.2); for the US (when its version starts), TIGER vs OSM on a dense and a sparse state. Sizes, classification quality, and mileage under the §9.3 definition.
2. **Data volume:** raw, partitioned, simplified, and shipped sizes per area and in total, for raster and for vector representations — Nepal first, with an honest extrapolation to the US that is labelled as extrapolation.
3. **Browser feasibility, per host:** can a good-looking, smooth version ship on GitHub Pages within the applicable budget (§14.2)? For the atlas host, also against the atlas's per-view and first-paint budgets (§4.3). If not, what reduced edition is possible, and what exactly is lost?
4. **Rendering choice:** Canvas 2D vs SVG vs WebGL, and raster vs vector vs hybrid (§13), for preview, interactive use, and export — with a prototype or frame-time measurements on a cheap phone and on the MacBook. Include the atlas host explicitly: its incumbent idiom is SVG.
5. **Local client choice** (when a version needs it): which OS-agnostic stack (§14.1), and why? Include binary / app size, GIS tooling, drawing performance, and how much code it shares with the browser hosts.
6. **Configurator and export feasibility:** can configurator plus offline video export land in the version under discussion with the interactive animation? If not, what is the proposed phasing, and what is the smallest useful export for that version?
7. **Sweep design:** which sweep (§13) matches the reference feel at national scale and at area zoom, for the chosen representation?
8. **Later-pack readiness:** does the chosen manifest, partitioning, and border approach extend to the US, then to India and China, including the official-view rule, datum handling, and internal tiling for large areas?
9. **Licensing and attribution:** what licences and attributions apply to each chosen boundary and road source, and where do they appear in each host? Note that this repo currently has no LICENSE file; flag it, do not resolve it silently.
10. **Shared-map interaction:** does this work trigger, follow, or ignore the atlas spec's planned move of Pin Drop's map code to `shared/js/map/` (§4.3)? State the order of operations and what gets re-checked afterwards.

The output of this section is a short decision record: a recommendation per item, phasing if needed, any size-budget exception request, and **an explicit residency decision** — added to `docs/DECISIONS.md` with a new D-number and summarised in `docs/PROGRESS.md` once approved. No D-number, no build.

---

## 16. Proposed modules and layout

A starting sketch, to be revised by §15 — names and locations are indicative, and the engine's first location follows §4.6, not this list.

**Engine** (in the pilot host at first; `shared/js/` after the migration trigger):

- `config` — schema, defaults, validation, and profiles for §12. Pure.
- `manifest` — load and validate a pack manifest; per-area metadata lookup. Pure apart from file reading at the edge.
- `timeline` — given config and manifest, compute reveal order, per-area start / end times, camera keyframes, speed conversions (§8), and counter values at any time `t`. Pure and fully testable.
- `loader` — partitioned, on-demand loading with prefetch, cancellation, and LRU eviction (§11.3). Platform-specific file access behind a small interface.
- `renderer` — draw a frame for a given time, config, and loaded data, to the chosen surface (§13). No timeline logic inside.
- `exporter` — step the timeline offline, render frames at full quality, encode video, report progress. Present only in phases that include export.

**Host 1 — `games/light-speed-roads/`:** `index.html`, styles, `src/{main.js, config.js, ui/}` following the repo layout; `main.js` is the only wiring point. Country picker, area grid, counters, configurator UI live here. Nepal pack data lives with the host during the pilot phase, in a per-pack folder the manifest points at.

**Host 2 — `games/nepal-atlas/`:** a Roads view module inside the atlas's own `src/views/` layout, per the atlas spec, consuming the engine and the Nepal pack through the same interfaces as Host 1, plus atlas-only pieces: the card extension, the pcode-keyed road stats, and the view's legend. No engine code is copied into the atlas folder.

**Tools:** `tools/` (or the atlas's tool naming, for Nepal) — the offline preprocessing pipeline (§10), committed and documented, run by hand. One pipeline, parameterised per pack; per-country quirks live in pack configuration, not in forked scripts where that can be avoided.

---

## 17. Tests

Follow the repo convention: tests for pure modules with Node's built-in test runner for any JavaScript core, or the equivalent standard test runner for the chosen local stack. No test framework dependency without justification. Engine tests are written once and run against fixture packs for at least two differently-shaped countries (for example a Nepal-shaped fixture and a US-shaped fixture), so country-agnosticism (F2) is tested, not asserted.

At minimum, test:

- timeline maths: area boundaries in the timeline, counter values at known times, speed conversions in both modes (§8), and that area mileages sum to the national total
- config validation: defaults, invalid values rejected, profiles round-trip unchanged, and profiles containing no country facts
- loader logic with fixture partitions: prefetch order, cancellation on jump, and LRU eviction (logic tested without real road files)
- host-interface contract: a fixture host can drive the engine end to end (load pack → run timeline → render calls) with no real map, proving a second host needs no engine changes
- data pipeline on a small fixture area: clipping allocates each segment to exactly one area, and mileage from full-precision data is unchanged by display simplification
- manifest validation: every area has a boundary, the partitions its pack declares, mileage, centroid, and bounding box
- Nepal pack ↔ atlas consistency: every district pcode in the road stats exists in the atlas boundaries, and every district has a road value or an explicit "no data"

---

## 18. Acceptance criteria

Written as outcomes. The method is the agent's, per §1.

**v0.1 — Nepal pilot, standalone host:**

- All 77 districts light up in the defined order, with counters driven by recomputed real data, and the district values sum to the displayed total.
- Boundaries and roads align: no visible gold spill across district borders at national scale or at the maximum configured zoom, and district boundaries match the Pin Drop / atlas boundaries for the same districts.
- Play, pause, restart, speed change (both §8 modes), scrub, and jump-to-district all work without freezing the UI during loads.
- Changing speed, level of detail, or zoom in config changes the preview without any code change.
- It loads and animates smoothly on a phone within the agreed size budget, or an explicitly approved exception (§14.2).
- The data definition (§9.3), sources, vintage, and attribution are stated in the product and in the manifest.
- The engine passes the fixture-host contract test (§17): nothing in the engine knows it is running Nepal.
- `npm test` (or the chosen stack's equivalent) passes before any push, and nothing is pushed to `live` without the user's OK.

**Atlas host (when built):**

- The Roads view is reachable in the view switcher at `#roads`, with a legend, and tapping a district shows the atlas card extended with road facts (§4.3).
- Road choropleths classify and join on pcodes with no missing-district gaps unaccounted for (§17).
- The atlas's own acceptance still holds with the Roads view included: first view usable within 3 seconds on a 3G-class connection, at most 1 MB before first paint, per-view and whole-atlas budgets respected or explicitly re-decided.

**Later versions:**

- US (v0.2): the same acceptance shape as v0.1, per state, plus whichever platform decision §15 made for that pack — a browser edition within budget or an approved exception, and/or a local client meeting §14.1.
- If video export is in an approved phase: a rendered MP4 plays correctly, matches the preview's timing and order, and shows the required attribution.
- India and China (v0.3): per-area acceptance as above, plus the official-view provenance note visible on the map and road / boundary datum consistency demonstrated (§6.3).

---

## 19. Out of scope

- Any country other than Nepal in v0.1, the US in v0.2, and India and China in v0.3
- Alaska, Hawaii, and US territories until a version explicitly includes them
- Building the Nepal Atlas itself from this spec — the atlas has its own spec and timetable; this spec only defines how the Roads view joins it
- A third host, or packaging any local client for distribution, installers, or an app store, until a version explicitly includes it
- Live / real-time road data, traffic, routing, navigation, or address search (geocoding)
- Drawing every road as an individually interactive element, or street-level exploration beyond the configured area zoom
- Accounts, cloud rendering, or a backend service

---

## 20. Risks and revision triggers

**Risks**

- **Data size surprises everything at US scale.** A format or source that looks fine for Nepal can fail nationally. Measure early, per pack (§15), and do not extrapolate silently.
- **Premature abstraction.** An engine designed for four countries before the second host exists can cost more than the duplication it prevents. §4.6 is the mitigation; §15.1, item 1 is the check.
- **Two Nepals.** If the standalone and atlas hosts ever carry different Nepal boundaries or district totals, users will find it before the maintainers do. Shared sources and the §17 consistency test are the mitigation.
- **Alignment is the fiddliest part.** Projection, datum, vintage, or simplification mismatches show up as spills and gaps at borders.
- **Simplification artefacts.** Non-topological simplification breaks junctions and borders (§10, stage 5).
- **Mileage disputes.** Any total is defensible only with its road definition attached. Divided highways, tracks, and service roads are the largest swing factors — in Nepal, they are the difference between the Appendix's three national figures.
- **Uneven source completeness.** A sweep that is dense in the Terai and sparse in the mountains may be showing data coverage, not roads. The product should not claim more than the pack's audit (§15.2, item 1) supports.
- **Glow and large images are the performance traps** in real-time preview — pre-bake or cache rather than computing per frame.
- **Licensing.** Boundary views, OpenStreetMap's ODbL attribution, and the repo's missing LICENSE file all need explicit handling (§15.2, item 9).
- **Atlas timetable coupling.** If the atlas slips, Host 1 must still ship (F3); if roads slip, the atlas must still ship without a Roads view. Neither host is the other's blocker.

**Revision triggers — revisit the named decision instead of forcing the plan through**

| If this proves true… | …then revisit |
|---|---|
| Nepal's in-scope road payload breaks the atlas per-view or first-paint budget | Atlas residency of the road layer: lazy-loaded sub-view, reduced-detail atlas edition, or standalone-only Nepal roads (§4.3, §14.2) |
| Vector drawing fails the frame-time bar on a cheap phone for the Nepal pack | Rendering choice for that pack (§13) — not the whole project's |
| The engine/host interface needs Nepal-specific or atlas-specific exceptions in more than a trivial number of places | The §5 boundary itself; the split may be drawn in the wrong place |
| The atlas's v0.1 scope or timetable changes materially | Host order and the §4.6 migration trigger |
| The US pack breaks the standalone browser budget at every honest level of detail | Platform primacy for that pack (§14) — local client first, browser reduced or none, by explicit decision |
| Per-district totals show the district reveal is mostly dead steps under the chosen road definition | Granularity and/or the §9.3 definition for Nepal (§15.1, item 6) |

---

## 21. Sanity check

- This spec starts fresh from real data and treats the stylised prototype as reference only.
- Nepal is the pilot because it is small, already half-built in this repo, and the only country with a second host — and the spec says plainly which US problems the pilot does **not** solve (§15.1, item 2).
- It fixes product goals, data principles, and the engine / pack / host boundary as a *proposal* — and leaves residency detail, engine, framework, format, and source choices open, with a required critique, feasibility analysis, and decision record before building.
- The atlas tie-in is shared sources, shared pcodes, and a shared engine — not shared ownership: each project keeps its own spec, timetable, and acceptance.
- Nothing in this spec requires sending a whole country's road data over the network or holding it all in RAM at once — and for Nepal it explicitly allows the honest answer that, measured, the data may be small enough not to need the heavy machinery (§11.3).

---

## Appendix — reference numbers, for checking only

Provided so the implementing agent can sanity-check the order of magnitude of its recomputed totals. These are **not targets**, and none of them may be hard-coded as results (F1, §9.4).

**United States — from the reference video:**

| Check | Miles | Kilometres | Light-time |
|---|---:|---:|---:|
| California | 636,465 | — | 3.42 s |
| Full US run (48 states) | 7,123,403 | 11,464,006 | 38.24 s |

**Nepal — order-of-magnitude figures that differ by road definition (§9.3):**

| Definition | Kilometres (approx.) | Light-time (approx.) |
|---|---:|---:|
| Strategic road network | 13,500 | 0.05 s |
| Department of Roads roads | 34,100 | 0.11 s |
| All roads | 64,500 | 0.22 s |

The pilot's first data task is to replace this table's Nepal rows with sourced, dated figures under a stated definition — or to correct them, in the decision record, if the sources say otherwise.

Speed of light used: 299,792 kilometres per second / 186,282 miles per second.
