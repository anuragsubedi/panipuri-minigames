# Architecture

> Status: **v0.1 playable.** Pure core implemented and tested; UI implemented and verified in the browser (desktop + mobile, light + dark).

## Principles

1. **Pure core, thin shell.** Game rules, color math and scoring are pure functions with no DOM access. The UI is a thin layer that renders state and reports intent.
2. **One wiring point.** `main.js` is the only module that imports from both the core and the UI.
3. **Data flows one way.** `user intent → main.js → state transition → new state → render`.

## Repository layout

```
panipuri-minigames/
├── CLAUDE.md
├── docs/
├── package.json                  # only "type": "module" + `npm test`; no dependencies
├── index.html                    # hub: links to each game
├── shared/
│   └── styles/
│       ├── tokens.css            # colors, radii, fonts, shadows (light + dark)
│       ├── base.css              # reset, body, shared top bar
│       └── hub.css               # hub page only
├── games/
│   └── hue-recall/
│       ├── index.html            # single mount point (#game) + module entry
│       ├── styles/
│       │   └── game.css          # card, screens, buttons, slider, summary
│       └── src/
│           ├── main.js
│           ├── config.js
│           ├── state/
│           │   └── game.js
│           ├── color/
│           │   ├── convert.js
│           │   ├── distance.js
│           │   ├── random.js
│           │   ├── contrast.js
│           │   └── gradient.js
│           ├── scoring/
│           │   ├── score.js
│           │   └── verdict.js
│           └── ui/
│               ├── dom.js
│               ├── format.js
│               ├── components/
│               │   ├── slider.js
│               │   ├── countdown.js
│               │   ├── swatch.js
│               │   └── round-badge.js
│               └── screens/
│                   ├── intro.js
│                   ├── memorize.js
│                   ├── recreate.js
│                   ├── round-result.js
│                   └── summary.js
└── tests/
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
| `color/random.js`         | Seedable RNG, random ints, constrained random HSB                      | yes   |
| `color/contrast.js`       | Light vs. dark text ink for a background color                         | yes   |
| `color/gradient.js`       | Hex stops for a slider track (one channel swept)                       | yes   |
| `scoring/score.js`        | ΔE → round points; total                                               | yes   |
| `scoring/verdict.js`      | Points → verdict word                                                  | yes   |
| `state/game.js`           | Game state shape + transitions, selectors                              | yes   |
| `ui/dom.js`               | `el()` element builder, `onKey()` page-level key listener              | no    |
| `ui/format.js`            | Number display formatting                                              | no*   |
| `ui/components/slider.js` | One vertical slider: pointer drag + keyboard, ARIA, gradient track     | no    |
| `ui/components/countdown.js` | rAF countdown with bar; calls `onDone`; `stop()` to cancel          | no    |
| `ui/components/swatch.js` | Color block with label + hex                                           | no    |
| `ui/components/round-badge.js` | "Round n / N" pill                                                | no    |
| `ui/screens/*.js`         | Render one phase; report intent via callbacks; return cleanup          | no    |
| `main.js`                 | Holds state, maps phase → screen, commits transitions, owns the RNG    | no    |

\* pure, but presentation-only, so it lives in `ui/`.

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
`rng` is injected (`createRng(seed)` from `color/random.js`), so games are reproducible in tests.

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
