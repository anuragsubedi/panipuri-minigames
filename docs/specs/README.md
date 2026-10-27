# Specs

Proposals and plans for panipuri. **Read only what you need:** this README (rules + ranking), then the one spec you're working on.

```
docs/specs/
├── README.md            # this file: shared rules, ranking, build order
├── games/<name>.md      # one self-contained spec per planned game/toy
├── pipeline.md          # build & release pipeline (current: Pages from `live`)
└── architect-agent.md   # long-term automated PR review/merge
```

Game specs are ranked, self-contained proposals. Each one is written so it can be built **independently in a fresh session**, by Claude Code or by another agent such as Cursor, Codex or Antigravity.

> **Repo-wide open question:** the public repo currently has **no LICENSE** (i.e. all rights reserved). Choosing one is the user's call. It also matters for Breakbench path A (AGPL).

> **Status: proposals.** Nothing here is approved to build. The agent picking one up still confirms scope with the user first (`CLAUDE.md` → working agreement).

## Before building any of these (all agents)

1. Read `AGENTS.md` → `CLAUDE.md` → `docs/ARCHITECTURE.md` ("Adding a new game", "Shared code").
2. Open **only** `games/<name>.md` for the game you're building; update its status header as you go.
3. Mirror Hue Recall / Glimpse's layout: `games/<name>/{index.html, styles/game.css, src/{main.js, config.js, state/, ui/}}`, pure logic tested in `tests/<name>/` with `npm test`.
4. Reuse `shared/js` (dom, rng, score, verdict, countdown, round badge) and `shared/styles/game-kit.css`. Don't copy them.
5. **No dependencies, no build step** (D-001). A spec marked ⚠️ *needs a dependency decision* means the user must approve an exception first, logged as a new `D-0xx`.
6. **Original identity** (D-006): genre-inspired, never a copy of a product's name, art, layout or copy.
7. Ship with a hub tile (`index.html` + `shared/styles/hub.css`), a README row, and doc updates (`PROGRESS.md`, `ARCHITECTURE.md`, `DECISIONS.md`).

**Effort unit:** a *session* is roughly one Hue Recall–sized build: spec → core + tests → UI → browser check. Hue Recall and Glimpse each took about one.

---

## Ranking

Each idea is scored 1–5 on three axes (feasibility means feasible as vanilla JS in this repo). **Score** is the sum of the three.

| Rank | Working name | Inspired by | Novelty | Wow | Feasibility | Score | Effort | Type |
|---|---|---|---|---|---|---|---|---|
| 1 | [**Orbit**](games/orbit.md) | solar system sandbox | 3 | 5 | 4 | **12** | 1–2 sessions | toy |
| 2 | [**Pin Drop**](games/pin-drop.md) | geo-guessing (map-only) | 3 | 3 | 5 | **11** | 1–1.5 sessions | game |
| 3 | [**Keyfall**](games/keyfall.md) | falling-tile piano games | 3 | 4 | 4 | **11** | 1–2 sessions + chart prep | game |
| 4 | [**Breakbench**](games/breakbench.md) | live-coded DnB (Strudel / "Switch Angel"-style) | 4 | 5 | 2 | **11** ⚠️ | 2–3 sessions | toy |
| 5 | [**Drift**](games/drift.md) | binaural beats generator | 2 | 3 | 5 | **10** | < 1 session | tool |
| 6 | [**Lost Lens**](games/lost-lens.md) | photo geo-guessing (Pin Drop pack) | 3 | 5 | 2 | **10** ⚠️ | +1 session code, +1–2 asset curation | game mode |
| 7 | [**Blockyard**](games/blockyard.md) | voxel sandbox ("mini Minecraft") | 2 | 5 | 1 | **8** ⚠️ | 2–3 (three.js) / 4–6 (raw WebGL) | toy |

**Ties are broken by feasibility.** Each game spec ends with a **Sanity check**: a one-pass review of what's verified, what's risky, and what changed from the first draft. Read it before building.

**Suggested build order** (this differs from the rank, because it front-loads cheap wins):
1. Quick wins: Drift → Pin Drop.
2. Showpieces: Orbit → Keyfall.
3. Ambitious: Breakbench → Lost Lens (reusing Pin Drop's map) → Blockyard.

**Hub note:** Drift, Orbit and Breakbench are toys or tools, not scored games. When the first one ships, give the hub a "Toys" section (small `index.html` / `hub.css` change).

---

## On the full geo-guessing idea (why it's split into Pin Drop and Lost Lens)

A realistic street-imagery geo game is mostly not a code problem:
- **Imagery is the hard part.**
  - Google Street View needs a paid API key, which would be exposed client-side, and comes with restrictive terms.
  - Mapillary is free but needs an access token and attribution.
  - Either way the game depends on a network service and a key.
- **The map needs a dependency or real asset work.** A slippy map means Leaflet plus a tile server (a dependency and network). The vanilla alternative is a bundled vector world map.
- **Estimate for a "simple" photo version:** 3–5 sessions plus API or asset setup. The interactive core (click a map, measure distance, score) is only about 1 session.

**Recommendation:** build **Pin Drop** first (map-only, comparable to what we've built). Design its "clue" as a pluggable type, so **Lost Lens** can later add photo clues from a small curated, CC-licensed set without a street-imagery API.
