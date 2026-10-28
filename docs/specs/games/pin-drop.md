# Pin Drop — map geo-guessing (game)

> **Status:** v0.2 shipped (World, India, Nepal; D-032…D-035); 9 Nepal places pending coordinates; next: NZ, then USA · **Rank:** 3 / 8 · **Effort:** 1–1.5 sessions · **Type:** game
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes (proposed → approved → in progress → shipped).

**Pitch:** "Where is Timbuktu?" Drop a pin on a blank world map and see how far off you were.

**Core loop:** 5 rounds, each:
1. A clue appears (place name + country, or a landmark name).
2. Click or tap the map to drop a pin, adjust it, then press **Lock it in**.
3. The reveal draws a line from your pin to the true spot and shows the distance in km plus points.
4. A summary screen with all five arcs and the total.

**Difficulty / packs:** "World capitals" (easy), "World cities" (medium), "Landmarks" (hard). Packs are JSON files. A regional pack (e.g. one country's cities) is just another file, which keeps the game "localized" with zero code changes.

**Tech approach**
- **Map:** bundled **equirectangular SVG** world map generated once from Natural Earth 1:110m land/country data (public domain), simplified to roughly 100–250 KB. Equirectangular makes click → lat/lon a linear transform, so no projection library is needed.
  - Store as `games/pin-drop/assets/world.svg` or path data in JSON.
  - Commit the small standard-library-only conversion script (`games/pin-drop/tools/geojson-to-svg.py`) so the map can be regenerated. It runs by hand, not as a build step.
- **Zoom (required, not stretch):** on a phone the map is about 350 px wide, so 1 px ≈ 115 km. Add pinch / scroll zoom and drag-to-pan via SVG `viewBox`, and place the pin in map coordinates, not screen pixels.
- **Distance:** haversine great-circle distance (pure, tested).
- **Score:** reuse `shared/js/score.js` with error = distance in km, e.g. `scale ≈ 1500 km, shape ≈ 1` (tune). Verdicts via `shared/js/verdict.js`.
- **Data:** `data/packs/*.json` with `{ name, clue, lat, lon }`. Coordinates are facts; cross-check against GeoNames (CC BY 4.0, attribute in README if used).
- **Clue types (future-proofing for Lost Lens):** `clue: { type: 'text', text }`. Later `{ type: 'photo', src, credit }`. One renderer per type.

**Modules:** `geo/{project.js, haversine.js}`, `data/load-pack.js`, `state/game.js` (phases intro → clue → reveal → summary), `ui/components/world-map.js`, `ui/screens/*`.

**Tests:** project/unproject round-trip, haversine against known city pairs (London–Paris ≈ 344 km), pack schema validation, state transitions.

**Acceptance:** works on a phone (tap to place, drag to adjust); seeded (`?seed=`); pack selectable on the intro; no network requests after load.

**Out of scope:** street imagery, slippy tiles, multiplayer.

**Risks:** map data size and simplification quality; antimeridian lines (draw the shortest path, or clamp for v0.1).

**Sanity check**
- ✅ Haversine London (51.507, −0.128) → Paris (48.857, 2.352) ≈ 343.5 km: use as a test fixture.
- ✅ Natural Earth is public domain; GeoNames is CC BY 4.0 (attribution needed only if used).
- ⚠️ Distance-based scoring is unfair across packs: being 500 km off is great for "world" and terrible for a one-country pack. Put the score `scale` **per pack** in the pack JSON.
- ⚠️ Clues like "Timbuktu, Mali" give away the country. That's fine for Easy; Hard packs should omit it.
- ⚠️ v0.1 draws a straight reveal line on the flat map (not a great-circle arc); say so in the doc. Pacific crossings will look odd.
