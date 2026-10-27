# panipuri-minigames — Agent Guide

A collection of small, self-contained browser minigames built with **vanilla HTML, CSS and JavaScript** (native ES modules, no dependencies, no build step).

First game: **Hue Recall** — memorize a color, then recreate it from memory.

## Start every session here

1. Read `docs/PROGRESS.md` — current status and the next step.
2. Skim `docs/ARCHITECTURE.md` before touching code.
3. Check `docs/DECISIONS.md` before re-opening a settled question.
4. Game rules and scope live in `docs/PROJECT.md`.

## End every session here

- Update `docs/PROGRESS.md` (what changed, what's next, open questions).
- Record any non-trivial choice in `docs/DECISIONS.md` (append-only).
- Keep `docs/ARCHITECTURE.md` in sync if modules were added, moved or renamed.

## Working agreement

- **Plan → acknowledge → build.** Propose a plan, wait for the user's OK, then build one step at a time and stop for review after each step.
- Keep it simple: the smallest change that solves the problem. No frameworks, bundlers or npm packages.
- One commit per completed step, with a clear message.

## Code conventions

- **Single responsibility.** One module = one job. If a file needs "and" to describe it, split it.
- **Logic and DOM stay separate.**
  - `src/state`, `src/color`, `src/scoring` are **pure**: no `document`, no `window`, no timers. Same input → same output.
  - `src/ui` only renders what it is given and reports user intent through callbacks.
  - `src/main.js` is the only place that wires state, UI and events together.
- **Config over magic numbers.** Tunables (round count, timings, color ranges) live in `config.js`.
- Named exports only; no default exports. No globals.
- Files and folders: `kebab-case.js`. Functions: `camelCase`. Constants: `UPPER_SNAKE_CASE`.
- Short JSDoc on every exported function (params, return). Comments explain *why*, not *what*.
- Prefer small pure functions and plain objects over classes.
- CSS: design tokens as custom properties in `tokens.css`; support light and dark via `prefers-color-scheme`.

## Running

ES modules do not load over `file://`; serve the repo root:

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173/ (hub) or http://localhost:5173/games/hue-recall/.
Add `?seed=42` to the game URL for a reproducible set of colors.

## Testing

Pure modules are tested with Node's built-in runner (no installs):

```bash
npm test
```

(`package.json` holds only `"type": "module"` and this script — never add dependencies.)

Every pure module gets a test file. UI is verified by playing it in the browser.

## Layout (short)

```
CLAUDE.md            this file
docs/                long-term project memory
index.html           hub listing all games
shared/styles/       design tokens, reset, top bar, hub styles (used by hub + every game)
games/<game>/        one folder per game (index.html, styles/, src/)
tests/<game>/        node --test suites for that game's pure modules
```

Full module map: `docs/ARCHITECTURE.md`.
