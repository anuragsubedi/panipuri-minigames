# Nepal Atlas — an interactive digital school atlas (tool)

> **Status:** proposed (user idea, 2026-10-27); next goal after Pin Drop's Nepal map ships · **Rank:** 2 / 8 (ties Orbit on score; lower feasibility) · **Effort:** v0.1 ≈ 2 sessions, full ≈ 5–6 · **Type:** tool
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes.

**Pitch:** the Grade 7–10 school atlas of Nepal, but alive. One map, many **views**, like the pages of a printed atlas: Political, Physical, Rivers & lakes, Forests & parks, People, Economy, Farming, Climate. Tap a district to read about it; drag a line from the Terai to the Himalaya to see the land rise. Made for school children in Nepal, so it must work on a cheap phone.

**Not a game.** No rounds or score. It goes in the hub's "Toys" section, and can link to Pin Drop's Nepal map as its quiz ("Find this district").

## What already exists (from Pin Drop v0.2, D-035)

- The **Survey Department of Nepal boundaries** (OCHA HDX, CC BY 3.0 IGO, version 2024, official outline incl. Kalapani–Lipulekh–Limpiyadhura): provinces, 77 districts, 753 palikas, as one SVG with shared vertices (`games/pin-drop/data/maps/nepal.json`, 113 KB gzipped).
- 753 palika points (OSM town centres), 77 district HQs, ~80 landmarks and ~80 nature places with one-line blurbs, river and park shapes (OSM).
- A pan/zoom SVG map component with pins, shapes, and zoom-dependent layers.

## Feature ranking

Scored 1–5 like the specs README (feasibility = vanilla JS, static site, free data reachable from a cloud session). **Score** is the sum.

| # | Feature (atlas "page") | Novelty | Wow | Feas. | Score | Data (licence) | Phase |
|---|---|---|---|---|---|---|---|
| 1 | **Physical view**: hypsometric colours (green Terai → brown hills → white Himal) + hillshade, peaks and passes labelled | 4 | 5 | 3 | **12** | AWS Terrain Tiles "Terrarium" (SRTM/GMTED, open; attribution) | v0.1 |
| 2 | **Cross-section tool**: drag a line, get the elevation profile (the classic textbook Terai–Hills–Himal diagram) | 5 | 5 | 3 | **13** | same DEM | v0.2 |
| 3 | **Rivers & lakes view**: every river drawn by size (stream order), blue lakes, glaciers, dams; tap a river → name, length, basin | 3 | 4 | 4 | **11** | HOT OSM waterways on HDX (ODbL, Oct 2026) or HydroRIVERS (CC BY 4.0, has stream order + discharge); Survey Dept watercourses on HDX (terms to check) | v0.1 |
| 4 | **Political view**: provinces / districts / palikas with names; tap → card (HQ, area, population, palikas) | 2 | 3 | 5 | **10** | have it + CoD-PS population (HDX, CC BY 3.0 IGO) | v0.1 |
| 5 | **People view**: population, density, growth; **mother tongues** and literacy by district (Census 2021) as choropleths | 3 | 4 | 4 | **11** | CoD-PS 2023 (HDX) ✓; Census 2021 tables (NSO; site not reachable from this cloud session, try from the user's machine) | v0.2 |
| 6 | **Forests & parks view**: forest cover raster + forest % per district; national parks, reserves, conservation areas, buffer zones | 3 | 4 | 3 | **10** | ESA WorldCover 10 m (CC BY 4.0) or Hansen tree cover (CC BY 4.0) ✓; parks from OSM ✓ | v0.2 |
| 7 | **Nepali / English toggle** (नेपाली labels), important for the school audience | 4 | 4 | 3 | **11** | OSM `name` tags are Nepali (seen in Nominatim); district/province names hand-checked | v0.2 |
| 8 | **Climate view**: rainfall and temperature (annual + monsoon month slider) | 3 | 4 | 3 | **10** | WorldClim 2.1 (CC BY 4.0) | v0.3 |
| 9 | **Economy view**: GDP by province, district HDI, hydropower plants, industrial areas, trade routes / border points | 2 | 3 | 3 | **8** | NSO provincial GDP; Nepal Human Development Report (district HDI, PDF tables); OSM | v0.3 |
| 10 | **Farming view**: main crop by district (rice, maize, wheat, millet, tea, cardamom, oranges…) | 3 | 3 | 2 | **8** | MoALD "Statistical Information on Nepalese Agriculture" (district tables in PDF, hand extraction); FAOSTAT national only | v0.3 |
| 11 | **Quiz link**: "Find this district/peak" opens Pin Drop's Nepal map with that pack | 3 | 3 | 5 | **11** | Pin Drop packs | v0.2 |
| 12 | 3D terrain fly-over (raw WebGL) | 4 | 5 | 2 | **11** ⚠️ | same DEM | later |

**Recommended v0.1 (≈ 2 sessions):** Political + Physical + Rivers & lakes, with a view switcher. These three are the heart of a school atlas, all data is verified reachable, and they reuse what Pin Drop built. **v0.2:** cross-section, People, Forests & parks, Nepali toggle, quiz link. **v0.3:** Climate, Economy, Farming.

## Design

- **Views as pages.** A view switcher (tabs on desktop, a bottom sheet on phones) changes layers, legend and the info card. URL hash keeps the view (`#physical`) so a teacher can share a link.
- **Map is landscape.** Nepal is ~5:1, so desktop is the primary layout: map across the top, legend + card at the side. On phones the map fills the width and the card slides up from below; rotating to landscape is encouraged, not required.
- **Legend is part of the page**, like a printed atlas: colour ramp with metres, or choropleth classes with ranges.
- **Tap anything → card.** District: HQ, province, area, population, palikas, highest peak, main rivers. River: length in Nepal, source, joins. Peak: height, first ascent. Cards reuse the blurbs.
- **Original identity (D-006):** no copying a published atlas's layout or colour scheme. Palette from `shared/styles/tokens.css` with a hypsometric ramp of our own; light + dark.

## Tech approach

- **Folder:** `games/nepal-atlas/` (same layout as the other games: `index.html`, `styles/`, `src/{main.js, config.js, views/, ui/, data/}`). Data in `games/nepal-atlas/data/`.
- **Shared map:** move Pin Drop's `world-map.js`, `map-gestures.js`, `geo/{project,viewport}.js` to `shared/js/map/` now that a second tool needs them (CLAUDE.md "Shared code"); re-check Pin Drop after the move.
- **Vectors** (boundaries, rivers, lakes, parks): SVG paths as in Pin Drop, with layers that fade in by zoom (palikas, small streams). Rivers get stroke width by stream order.
- **Rasters** (elevation, hillshade, forest, climate): pre-rendered **image tiles** in the map's equirectangular coordinates, made by a committed offline tool, loaded per view and zoom, drawn as SVG `<image>` under the vectors. Budget: ≤ 2 MB per view at the overview zoom; deeper zoom tiles lazy-load; whole atlas ≤ 40 MB in the repo.
- **Elevation values** for the cross-section and "height here": a small 16-bit grid (e.g. 1 km cells ≈ 900 × 250 values ≈ 450 KB, less gzipped) shipped as binary; the profile is a pure function (tested).
- **Choropleths:** pure `classify(values, classes)` (quantile / natural breaks) + palette; data joined by HDX pcodes (`NP01`, `NP0101`, `NP0101301`), which every HDX table shares.

## Data tools (offline, run by hand)

| Tool | Input | Output |
|---|---|---|
| `build-dem.py` | AWS Terrarium PNG tiles (z8–z10) over Nepal | elevation grid (binary) + hypsometric/hillshade tiles |
| `build-water.py` | HOT OSM waterways GeoJSON (HDX) or HydroRIVERS | rivers by order, lakes, glaciers (SVG paths), clipped to Nepal |
| `build-landcover.py` | ESA WorldCover tiles N27–N30, E080–E088 | forest tiles + forest % per district |
| `build-stats.py` | CoD-PS CSV, census tables | `stats.json` keyed by pcode |

⚠️ **Dependency decision (user):** Terrarium tiles are PNGs, so `build-dem.py` can stay standard-library Python (zlib + PNG unfiltering; verified idea, not yet built). WorldCover/Hansen/WorldClim are **GeoTIFFs**; reading them with only the standard library means writing a TIFF/deflate tile reader (doable, slow). The alternative is allowing `pip` packages (numpy, Pillow, rasterio) **for offline tools only**, never in the site. Either way the shipped site stays dependency-free (D-001). Needs a `D-0xx` either way.

## Attribution (on an "About this atlas" page and the map note)

Survey Department of Nepal / OCHA HDX (CC BY 3.0 IGO) · © OpenStreetMap contributors (ODbL) · Natural Earth (public domain) · AWS Terrain Tiles (SRTM, GMTED, ETOPO1 and others; credit per their README) · ESA WorldCover (CC BY 4.0) · WorldClim (CC BY 4.0) · population: NSO / OCHA CoD-PS (CC BY 3.0 IGO).

## Tests

Pure modules: elevation profile sampling (bilinear on the grid, distance along a great circle), choropleth classing, pcode joins (every district/palika has a value or an explicit "no data"), tile index math (lat/lon ↔ tile), legend ranges. Data checks: every stats row's pcode exists in the boundaries; raster tiles cover the map bounds.

## Acceptance (v0.1)

Political, Physical and Rivers & lakes views; tap cards for districts, rivers, peaks; legend per view; works at 375 px and desktop, light + dark; first view usable within 3 s on a 3G-class connection (≤ 1 MB before first paint); no network after the view's data loads; attribution page.

## Open questions for the user

1. Name: "Nepal Atlas"? "Mero Atlas"? (Original name, not a publisher's.)
2. v0.1 scope as recommended (Political + Physical + Rivers)?
3. Offline-tool dependency decision above.
4. Nepali labels in v0.1 or v0.2?
5. Should statistics show the latest single year, or a year slider (2011 vs 2021 census)?

## Sanity check

- **Verified reachable on 2026-10-27 from this cloud session:** HDX (boundaries, CoD-PS, HOT OSM waterways, land use), AWS Terrarium tiles, ESA WorldCover, Hansen GFC, HydroSHEDS. **Not reachable:** NSO census site, Overpass, Geofabrik, Wikipedia (Wikidata query service rate-limited to 1 request/min during an outage).
- **Riskiest part:** raster pipeline size and phone performance. Mitigate with the tile budget and by drawing rasters as images, not SVG.
- **Second risk:** statistics hidden in PDFs (farming, HDI). That's why they're v0.3, with hand extraction and source notes.
- **Changed from the user's list:** added the cross-section tool (highest score), the Nepali toggle and the quiz link; GDP is only official per province, so district economy uses HDI and other indicators instead.
