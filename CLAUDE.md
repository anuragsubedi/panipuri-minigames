# panipuri-minigames — Agent Guide

A collection of small, self-contained browser minigames built with **vanilla HTML, CSS and JavaScript** (native ES modules, no dependencies, no build step).

| Game | Folder | Status |
|------|--------|--------|
| Hue Recall — memorize a color, rebuild it | `games/hue-recall/` | v0.1 shipped; polish **parked** by the user |
| Glimpse — flash of dots, guess how many | `games/glimpse/` | v0.1 shipped |

## Who reads what

- `README.md` — for **non-technical humans**: how to start and play. Keep it jargon-free; update its game table when a game ships.
- `CLAUDE.md` (this file) — for **agents**: rules, conventions, where things live.
- `docs/` — long-term project memory (below).

## Start every session here

1. Read `docs/PROGRESS.md` — current status, what's next, backlog.
2. Skim `docs/ARCHITECTURE.md` before touching code.
3. Check `docs/DECISIONS.md` before re-opening a settled question.
4. Game rules, specs and scope live in `docs/PROJECT.md`.

## End every session here

- Update `docs/PROGRESS.md` (status, next step, backlog, session log entry).
- Record any non-trivial choice in `docs/DECISIONS.md` (append-only, next `D-0xx` number).
- Keep `docs/ARCHITECTURE.md` in sync if modules were added, moved or renamed.
- If a game shipped or changed how you start things, update `README.md` and the hub `index.html`.

## Working agreement (from the user)

- **Plan → acknowledge → build.** Propose a plan, wait for the user's OK, then build one step at a time and stop for review after each step.
- The user prefers **new games over polishing** existing ones unless they ask (D-014).
- Keep it simple: the smallest change that solves the problem. No frameworks, bundlers or npm packages.
- Games are **original**: a game may share a genre with existing games, but never copy a specific product's name, branding, layout or copy (D-006).
- One commit per completed step, with a clear message.
- Keep replies **short**; it's a simple prototype. Once a feature is approved, finish it without extra review stops unless asked.

## Code conventions

- **Single responsibility.** One module = one job. If a file needs "and" to describe it, split it.
- **Logic and DOM stay separate.**
  - Pure folders (`state/`, `scoring/`, and helpers like `color/`): no `document`, no `window`, no timers. Same input → same output.
  - `ui/` only renders what it is given and reports user intent through callbacks.
  - `main.js` is the only place that wires state, UI and events together.
- **Config over magic numbers.** Tunables (round count, timings, ranges, score curve) live in the game's `config.js`.
- Named exports only; no default exports. No globals.
- Files and folders: `kebab-case.js`. Functions: `camelCase`. Constants: `UPPER_SNAKE_CASE`.
- Short JSDoc on every exported function (params, return). Comments explain *why*, not *what*.
- Prefer small pure functions and plain objects over classes.
- CSS: shared design tokens in `shared/styles/tokens.css`; support light and dark via `prefers-color-scheme`.
- **Shared code** lives in `shared/js/` and `shared/styles/`. Reuse it instead of copying; only move code there once a second game needs it; after changing it, re-check every game (ARCHITECTURE → "Shared code").

## Adding a new game

Follow the checklist in `docs/ARCHITECTURE.md` → "Adding a new game". In short: spec in `PROJECT.md` → user OK → `games/<name>/` mirroring Hue Recall's layout → tests in `tests/<name>/` → hub tile in `index.html` → README table → docs.

## Running

ES modules do not load over `file://`; serve the repo root:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173/ (hub) or http://localhost:5173/games/hue-recall/.
Add `?seed=42` to a game URL for a reproducible game.
Humans can double-click `start.command` (macOS), which does the same and opens the browser.
In the Claude desktop app, `.claude/launch.json` defines the same server as `static`.

## Testing

Pure modules are tested with Node's built-in runner (no installs):

```bash
npm test
```

(`package.json` holds only `"type": "module"` and this script — never add dependencies.)
Every pure module gets a test file. UI is verified by playing it in the browser (desktop + 375px mobile, light + dark).

## Layout (short)

```
CLAUDE.md            this file (agents)
README.md            setup + play instructions (non-technical humans)
start.command        macOS double-click launcher
docs/                long-term project memory
index.html           hub listing all games
shared/js/           helpers used by 2+ games (dom, rng, format, score, verdict, countdown, round badge)
shared/styles/       tokens, reset, top bar, game-kit (card/buttons/etc.), hub styles
games/<game>/        one folder per game (index.html, styles/, src/)
tests/<game>/        node --test suites for that game's pure modules (tests/shared/ for shared/js)
```

Full module map: `docs/ARCHITECTURE.md`.
