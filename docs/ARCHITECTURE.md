# Architecture

> Status: **Hue Recall v0.1**, **Glimpse v0.1**, **Beatween v0.1** and **Orbit v0.1** playable. Both games share `shared/js` + `shared/styles/game-kit.css`.
> The module table and state section below describe Hue Recall in detail; Glimpse mirrors the same shape (see "Glimpse" section).

## Principles

1. **Pure core, thin shell.** Game rules, color math and scoring are pure functions with no DOM access. The UI is a thin layer that renders state and reports intent.
2. **One wiring point.** `main.js` is the only module that imports from both the core and the UI.
3. **Data flows one way.** `user intent → main.js → state transition → new state → render`.

## Repository layout

```
panipuri-minigames/
├── CLAUDE.md                     # agent guide
├── README.md                     # non-technical setup + play guide
├── start.command                 # macOS double-click launcher (python3 http.server + open browser)
├── .nojekyll                     # GitHub Pages: serve files as-is (Pages deploys the `live` branch root)
├── .claude/launch.json           # "static" server config for the Claude desktop preview
├── docs/                         # long-term memory; docs/specs/ holds specs (games/<name>.md, pipeline, architect)
├── package.json                  # only "type": "module" + `npm test`; no dependencies
├── index.html                    # hub: links to each game
├── shared/                       # code used by more than one game (see "Shared code")
│   ├── js/
│   │   ├── dom.js                # el() element builder, onKey() page-level key listener, fillValues() for doc pages
│   │   ├── plot.js               # curvePath(): SVG path for y = f(x) (doc page charts)
│   │   ├── format.js             # formatPoints()
│   │   ├── rng.js                # createRng(seed), randomInt(), seedFromQuery()
│   │   ├── score.js              # roundScore(error, curve), totalScore()
│   │   ├── verdict.js            # verdictFor(score, verdicts)
│   │   └── components/
│   │       ├── countdown.js      # rAF countdown with caption + bar; onDone; stop()
│   │       └── round-badge.js    # "Round n / N" pill
│   └── styles/
│       ├── tokens.css            # colors, radii, fonts, shadows (light + dark)
│       ├── base.css              # reset, body, shared top bar
│       ├── game-kit.css          # stage, card, screens, buttons, segmented, round badge, countdown, result panel, summary list
│       └── hub.css               # hub page only
├── games/
│   └── hue-recall/
│       ├── index.html            # single mount point (#game) + module entry
│       ├── styles/
│       │   └── game.css          # Hue Recall only: intro, recreate, slider, result, summary
│       └── src/
│           ├── main.js
│           ├── config.js
│           ├── state/
│           │   └── game.js
│           ├── color/
│           │   ├── convert.js
│           │   ├── distance.js
│           │   ├── random.js     # randomHsb (uses shared rng)
│           │   ├── contrast.js
│           │   └── gradient.js
│           └── ui/
│               ├── components/
│               │   ├── slider.js
│               │   └── swatch.js
│               └── screens/
│                   ├── intro.js
│                   ├── memorize.js
│                   ├── recreate.js
│                   ├── round-result.js
│                   └── summary.js
│   ├── glimpse/                  # same shape; see "Glimpse" below
│   ├── beatween/                 # tool; see "Beatween" below
│   └── orbit/                    # toy; see "Orbit" below
└── tests/
    ├── shared/
    │   ├── rng.test.js
    │   └── score.test.js
    ├── glimpse/                  # dots, error, game
    ├── beatween/                 # core (settings, scale, bands, lissajous), noise
    ├── orbit/                    # physics (energy, merge, bounce, preview), presets, world, camera, trails
    └── hue-recall/
        ├── convert.test.js
        ├── distance.test.js
        ├── random.test.js
        ├── score.test.js
        ├── game.test.js
        └── ui-helpers.test.js    # contrast, gradient, verdict
```

## Module responsibilities

| Module                    | Responsibility                                                         | Pure? |
|---------------------------|------------------------------------------------------------------------|-------|
| `config.js`               | All tunables: rounds, difficulties, target/slider ranges, slider start, verdicts, score curve | yes   |
| `color/convert.js`        | HSB → RGB → hex, RGB → XYZ → CIELAB                                    | yes   |
| `color/distance.js`       | CIEDE2000 ΔE between two Lab colors                                    | yes   |
| `color/random.js`         | Constrained random HSB (uses `shared/js/rng.js`)                       | yes   |
| `color/contrast.js`       | Light vs. dark text ink for a background color                         | yes   |
| `color/gradient.js`       | Hex stops for a slider track (one channel swept)                       | yes   |
| `state/game.js`           | Game state shape + transitions, selectors                              | yes   |
| `ui/components/slider.js` | One vertical slider: pointer drag + keyboard, ARIA, gradient track     | no    |
| `ui/components/swatch.js` | Color block with label + hex                                           | no    |
| `ui/screens/*.js`         | Render one phase; report intent via callbacks; return cleanup          | no    |
| `main.js`                 | Holds state, maps phase → screen, commits transitions, owns the RNG    | no    |

Shared modules (`shared/js/…`) are listed in the layout above.

Timers live in UI components (the countdown), never in state; the screen's cleanup cancels them.

## Game state

```js
{
  phase: 'intro' | 'memorize' | 'recreate' | 'roundResult' | 'summary',
  difficulty: 'easy' | 'hard',
  roundIndex: 0,                 // 0-based
  rounds: [                      // one entry per round, filled as play progresses
    { target: {h, s, b}, guess: {h, s, b} | null, deltaE: number | null, score: number | null }
  ],
}
```

Transitions (all pure, `(state, ...args) → newState`):

| Function               | From              | To                             |
|------------------------|-------------------|--------------------------------|
| `createGame(opts)`     | —                 | `intro`                        |
| `setDifficulty(s, d)`  | `intro`/`summary` | same phase, new difficulty     |
| `startGame(s, rng)`    | `intro`/`summary` | `memorize` (targets generated) |
| `endMemorize(s)`       | `memorize`        | `recreate`                     |
| `submitGuess(s, g)`    | `recreate`        | `roundResult` (scored)         |
| `nextRound(s)`         | `roundResult`     | `memorize` or `summary`        |

Invalid transitions **throw**. Selectors: `currentRound(s)`, `gameTotal(s)`, `memorizeMs(s)`.
`rng` is injected (`createRng(seed)` from `shared/js/rng.js`), so games are reproducible in tests.

Color shapes: HSB `{h: 0–360, s: 0–100, b: 0–100}`, RGB `{r, g, b}` as unrounded 0–255 floats, Lab `{L, a, b}` (D65).

## Screen contract

Every screen module exports one function:

```js
/**
 * @param {HTMLElement} root   container to render into
 * @param {object} props       data needed for this phase
 * @param {object} handlers    callbacks for user intent (e.g. onSubmit)
 * @returns {() => void}       cleanup (remove listeners, stop timers)
 */
export function renderX(root, props, handlers) { ... }
```

`main.js` calls the previous screen's cleanup before rendering the next.

## Render loop (`main.js`)

```
commit(nextState) → state = nextState → cleanup() → root.replaceChildren() → screens[state.phase]()
```

- Each phase re-renders the whole card. Slider drags do **not** go through state: the recreate screen keeps its working guess locally and reports it once on submit.
- Exception: difficulty toggling on the intro commits with `{ rerender: false }` because the screen updates its own buttons (keeps keyboard focus).
- Primary actions are also bound to **Enter** via `onKey`, which ignores auto-repeat so one press can't skip two phases.
- `?seed=<n>` in the URL makes target colors and starting hues reproducible.

## Glimpse

```
games/glimpse/src/
├── main.js                 # same render loop as Hue Recall
├── config.js               # ROUNDS, DIFFICULTIES(flashMs), READY_MS, COUNT_BANDS, DOT_LAYOUT, GUESS_LIMITS, SCORE_CURVE, VERDICTS
├── dots/counts.js          # one count per band, shuffled
├── dots/layout.js          # rejection-sampled non-overlapping dots in a unit square
├── scoring/error.js        # ratioError |ln(g/a)|, percentOff
├── state/game.js           # phases intro → ready → flash → guess → roundResult → summary
└── ui/
    ├── components/field.js # SVG dot field (viewBox 0 0 1 1)
    └── screens/            # intro, ready, flash, guess, round-result, summary
```

Round: `{ count, dots: [{x, y}], guess, error, score }`. Transitions: `startGame`, `endReady`, `endFlash`, `submitGuess` (throws `RangeError` unless `isValidGuess`), `nextRound`. The flash screen owns a `setTimeout`; its cleanup clears it.

## Beatween (tool)

A toy/tool rather than a round-based game, so it **doesn't use the phase state machine or the card**. It's a one-screen instrument whose controls are updated in place (no re-render, so sliders keep working mid-drag).

```
games/beatween/src/
├── main.js                 # holds settings, drives engine, calls each control's update()
├── config.js               # FREQ_RANGE, presets, bands, noise, timer, AUDIO levels, VISUAL tempo
├── state/settings.js       # pure: setChannel (link keeps the beat), stepChannel (½ −1 +1 ×2), setBeat, presets…
├── tone/{scale,bands}.js   # log slider mapping; band names
├── audio/noise.js          # pure pink/brown generators + loop crossfade
├── audio/engine.js         # Web Audio: 2 sines → ChannelMerger (L/R) → master; noise → master
├── visual/lissajous.js     # pure XY figure + slowed tempo (no flicker)
├── storage.js              # guarded localStorage
└── ui/                     # scope (canvas), beat-control, channel-panel, link-toggle, presets, transport, icons
```

Styles: `games/beatween/styles/app.css` (doesn't use `game-kit.css`). Layout: scope over deck on phones; side by side when ≥ 860 px wide or landscape ≤ 540 px tall; `body` is one screen tall and `.app` scrolls only as a fallback.

## Orbit (toy)

A gravity sandbox. Like Beatween it is a one-screen toy with no phase machine and no card: **one continuous `requestAnimationFrame` loop** in `main.js`. Controls are built once and updated in place.

```
games/orbit/src/
├── main.js                 # owns world + loop; accumulator → advance(); camera eases to the center of mass; zoom; saves
├── config.js               # sim units (= real units, see UNITS), G, softening, DT, SIM_RATE, speeds, ranges, kinds, launch, zoom, trails
├── storage.js              # guarded localStorage for saved systems
├── physics/                # pure
│   ├── gravity.js          # O(n²) softened accelerations, energy, momentum
│   ├── integrate.js        # leapfrog (kick-drift-kick) step
│   ├── collide.js          # merge (momentum-conserving) or bounce (impulse + COM-neutral separation)
│   └── predict.js          # aim preview: probe vs frozen bodies, capped steps, stops on a hit
├── sim/                    # pure
│   ├── bodies.js           # body shape, radiusOf, kindOf, nameOf, centerOfMass, recenter
│   ├── units.js            # sim ↔ days, AU, km/s, solar masses
│   ├── solar-system.js     # J2000 elements → state vectors (Kepler), real periods
│   ├── presets.js          # Solar system, Heavy planets, Binary star, Chaos (+ start view, epoch)
│   ├── snapshot.js         # world ↔ JSON for saves, validated on restore
│   └── world.js            # world object + transitions (advance, launch, remove, setGravity, setStarMass…), stepsFor accumulator
├── view/                   # pure, no DOM
│   ├── camera.js           # world ↔ screen, hit test, easing
│   ├── format.js           # elapsed time, calendar date, rate, mass/speed/distance in real units
│   └── trails.js           # per-body history, sampled by distance moved
└── ui/
    ├── canvas-renderer.js  # draws a frame; colours from CSS custom properties; DPR-aware; starfield; AU rings; names
    ├── launcher.js         # pointer input: tap = select, drag = aim + launch, pinch / wheel = zoom
    ├── controls.js         # deck: play/pause, speed, reset, System button, log₂ sliders, chips
    ├── sky-overlay.js      # clock + rate, count → heaviest-bodies list, zoom buttons, paused badge, hint, inspector
    ├── systems-sheet.js    # <dialog>: presets, saved systems (load/delete), save form
    └── icons.js
```

- **Time:** fixed `DT` steps fed by an accumulator (`stepsFor`); real frame time is clamped to `MAX_FRAME_SECONDS` (hidden tabs) and steps per frame are capped.
- **World is immutable from outside:** `advance(world, n)` copies bodies once, mutates its copies for n steps, returns a new world plus the merges (used for selection follow + flash).
- **Body:** `{id, x, y, vx, vy, mass, radius, color, star, name}`; `color` is a palette slot (theme decides the colour), `star` marks what the Sun-mass slider scales and what glows, `name` is optional (Solar system planets).
- **Units (v0.2):** 1 distance unit = 0.01 AU, 1 mass unit = 0.001 M☉, so with G = 1 one time unit ≈ 1.838 days (r = 100 → 1 year). All real-unit readouts go through `sim/units.js` + `view/format.js`.
- **Zoom** is a view radius in `main.js` (not in the world); presets carry a starting view. Launch speed and preview step scale with it.
- **Styles:** `games/orbit/styles/app.css`. Sky is night in dark mode, a pale daylight chart in light mode; canvas has `touch-action: none`. Same responsive breakpoints as Beatween.

## "How it works" pages

Each game has `games/<name>/how.html`: a short, plain-language page on the mechanics, styled by `shared/styles/doc.css` and linked from the game's top bar (`.topbar__how`) and one line at the bottom of the hub. Numbers in the text sit in `<span data-value="key">default</span>` and an inline module fills them from the game's own `config.js` (via `fillValues`), so the page can't drift from the code; charts are drawn with `curvePath`. Keep them lean: what you see, how it's computed, the one or two choices worth explaining.

## Adding a new game

Every game follows Hue Recall's shape so any agent can find their way around.

1. **Spec first.** Add a section to `docs/PROJECT.md` (pitch, flow table, difficulty, scoring, out of scope) and get the user's OK.
2. **Folder.** `games/<kebab-name>/` with `index.html` (links `shared/styles/tokens.css`, `base.css`, `game-kit.css`, then its own `styles/game.css`; mounts into `#game.card`), `src/main.js`, `src/config.js`, `src/state/`, `src/scoring/`, `src/ui/{components,screens}/`.
3. **Pure core + tests.** State transitions in `state/game.js` with `PHASES`, `createGame`, `startGame(state, rng)`, and phase assertions that throw. Tests in `tests/<kebab-name>/`.
4. **Screens** follow the screen contract above (`renderX(root, props, handlers) → cleanup`), primary action also on Enter via `onKey`.
5. **How it works.** Add `how.html` (copy a sibling's shape) and the top-bar link.
6. **Hub + README.** Add a tile to `index.html` (+ art class in `shared/styles/hub.css`) and a row to the README game table.
7. **Docs.** Update this file's layout, `PROGRESS.md`, and log decisions.

### Shared code

`shared/` holds code that **two or more games** use. Games import it with relative paths, e.g. from `games/<g>/src/ui/screens/x.js`: `'../../../../../shared/js/dom.js'`; from `games/<g>/src/main.js`: `'../../../shared/js/rng.js'`.

- `shared/js/` — `dom.js`, `format.js`, `rng.js`, `score.js`, `verdict.js`, `components/countdown.js` (caption is a parameter), `components/round-badge.js`. Pure ones are tested in `tests/shared/`.
- `shared/styles/game-kit.css` — the common card look incl. result panel and summary list; each game's own `styles/game.css` adds only its screens.

Rules:
- Game-specific code (Hue Recall's color math, slider, swatch) stays inside its game.
- Code moves to `shared/` only once a second game actually needs it — don't pre-share speculatively, and never copy-paste between games.
- Changing a shared module means re-checking **every** game that uses it (tests + a quick browser play).
