# Architecture

> Status: **planned**. Modules below are not written yet; update this file as they land.

## Principles

1. **Pure core, thin shell.** Game rules, color math and scoring are pure functions with no DOM access. The UI is a thin layer that renders state and reports intent.
2. **One wiring point.** `main.js` is the only module that imports from both the core and the UI.
3. **Data flows one way.** `user intent → main.js → state transition → new state → render`.

## Repository layout

```
panipuri-minigames/
├── CLAUDE.md
├── docs/
├── index.html                    # hub: links to each game
├── games/
│   └── hue-recall/
│       ├── index.html            # single mount point + module entry
│       ├── styles/
│       │   ├── tokens.css        # colors, spacing, radii, type scale (light + dark)
│       │   ├── base.css          # reset, body, typography
│       │   └── game.css          # card, screens, sliders
│       └── src/
│           ├── main.js
│           ├── config.js
│           ├── state/
│           │   └── game.js
│           ├── color/
│           │   ├── convert.js
│           │   ├── distance.js
│           │   └── random.js
│           ├── scoring/
│           │   └── score.js
│           └── ui/
│               ├── dom.js
│               ├── components/
│               │   ├── slider.js
│               │   ├── countdown.js
│               │   └── swatch.js
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
        └── game.test.js
```

## Module responsibilities

| Module                    | Responsibility                                                         | Pure? |
|---------------------------|------------------------------------------------------------------------|-------|
| `config.js`               | All tunables: rounds, timings per difficulty, color ranges, score curve | yes   |
| `color/convert.js`        | HSB ↔ RGB ↔ hex, RGB → XYZ → CIELAB                                    | yes   |
| `color/distance.js`       | CIEDE2000 ΔE between two Lab colors                                    | yes   |
| `color/random.js`         | Seedable RNG + constrained random HSB target                           | yes   |
| `scoring/score.js`        | ΔE → round points; total                                               | yes   |
| `state/game.js`           | Game state shape + transitions (start, submit, next, restart)          | yes   |
| `ui/dom.js`               | Tiny helpers (`el()`, `clear()`), nothing game-specific                | no    |
| `ui/components/slider.js` | One vertical slider: pointer + keyboard input, gradient track          | no    |
| `ui/components/countdown.js` | Visual countdown driven by a timer; calls `onDone`                  | no    |
| `ui/components/swatch.js` | A color block with optional label                                      | no    |
| `ui/screens/*.js`         | Render one phase from state; expose user intent via callbacks          | no    |
| `main.js`                 | Holds current state, maps phase → screen, handles intents, owns timers | no    |

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

| Function            | From          | To                          |
|---------------------|---------------|-----------------------------|
| `createGame(opts)`  | —             | `intro`                     |
| `startGame(s, rng)` | `intro`/`summary` | `memorize` (targets generated) |
| `endMemorize(s)`    | `memorize`    | `recreate`                  |
| `submitGuess(s, g)` | `recreate`    | `roundResult` (scored)      |
| `nextRound(s)`      | `roundResult` | `memorize` or `summary`     |

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
