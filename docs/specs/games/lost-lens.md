# Lost Lens — photo geo-guessing (game)

> **Status:** proposed · **Rank:** 6 / 7 · **Effort:** +1 session code, +1–2 curation · **Type:** game mode (inside Pin Drop) ⚠️ needs a user decision before building
> Shared rules for every spec: [`../README.md`](../README.md). Update this header when status changes (proposed → approved → in progress → shipped).

**Pitch:** Pin Drop with photographs. A street corner, a market or a mountain road: where in the world is it?

**Depends on:** [Pin Drop](pin-drop.md) (map, distance, scoring, clue types). Build Pin Drop first.

**Approach options**
- **A. Curated pack (recommended):** 40–100 geotagged photos from **Wikimedia Commons** with CC0, CC BY or CC BY-SA licenses.
  - Store resized (≤ 1200 px, WebP) in `games/pin-drop/assets/photos/` with a credits JSON (author, license, source URL).
  - Show credits on the reveal screen.
  - Rule out photos with obvious giveaway text (signs) per difficulty, or embrace them on Easy.
- **B. Mapillary API:** dynamic street-level imagery. Needs an access token (client-exposed), attribution and network access, and adds the Mapillary JS viewer if you want panoramas ⚠️ (a dependency).

**Core loop:** Pin Drop's, with `clue.type = 'photo'`. Optional "zoom into photo" interaction.

**Effort:** 1 session of code on top of Pin Drop, plus 1–2 sessions of asset curation and licensing checks.

**Acceptance:** every photo has license + attribution displayed; total asset size budget ≤ 15 MB; works offline after load.

**Sanity check**
- ✅ Build it **as a photo pack and clue type inside Pin Drop** (`games/pin-drop/`), not as a separate game folder. The hub can have its own tile linking to `games/pin-drop/?pack=photos`.
- ⚠️ CC BY-SA photos: resizing makes an adaptation, so keep the same license and credit the author. Store license + author + source per photo and display them.
- ⚠️ Commons "camera location" vs. "object location" geotags differ. Prefer camera location and spot-check every photo by hand.
- ⚠️ Curation is the real cost (finding non-trivial, non-giveaway, correctly geotagged photos). It's a human-in-the-loop task, and agents will need user review of the set.
