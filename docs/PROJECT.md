# Project: panipuri-minigames

## Vision

A small arcade of quick, satisfying browser minigames that test perception and memory. Each game is playable in under two minutes, needs no account, and runs from static files.

## Constraints

- Vanilla HTML / CSS / JS, native ES modules. No dependencies, no build step.
- Readable and maintainable: modular, single-responsibility code (see `CLAUDE.md`).
- Original identity: games may share a genre with existing games, but names, visuals and copy are our own.

---

## Games at a glance

| # | Game        | Folder              | Status                                   |
|---|-------------|---------------------|------------------------------------------|
| 1 | Hue Recall  | `games/hue-recall/` | **v0.1 shipped.** Polish parked by user (D-014). |
| 2 | Glimpse     | `games/glimpse/`    | **v0.1 shipped.** |
| 3 | Beatween    | `games/beatween/`   | **v0.1 shipped** (tool; spec in `docs/specs/games/beatween.md`). |

Future games and toys (proposals, ranked): see [`specs/README.md`](specs/README.md).

---

## Game 1: Hue Recall

### Pitch

People are surprisingly bad at remembering colors. Hue Recall shows you a color for a few seconds, takes it away, and asks you to rebuild it.

### Game flow

```
Intro ──▶ [ Memorize ──▶ Recreate ──▶ Round result ] × 5 ──▶ Summary ──▶ (Play again)
```

| Phase        | What the player sees                                                        | Exit                    |
|--------------|-----------------------------------------------------------------------------|-------------------------|
| Intro        | Title, one-line rules, difficulty toggle, Start button                      | Start                   |
| Memorize     | Full-card target color, countdown, round counter (`2 / 5`)                  | Countdown reaches 0     |
| Recreate     | Hue / Saturation / Brightness sliders, card previews the current guess      | Submit                  |
| Round result | Target vs. guess side by side, round score (0–10)                           | Next                    |
| Summary      | All five pairs, per-round scores, total out of 50, Play again               | Play again              |

### Controls

- Three vertical sliders: **Hue** (0–360), **Saturation** (0–100), **Brightness** (0–100).
- Each slider's track gradient updates live to reflect the other two values.
- Pointer (mouse/touch) drag and keyboard (arrow keys) both work.
- Sliders start at a neutral position each round (not at the target).

### Difficulty

| Setting | Memorize time | Notes                       |
|---------|---------------|-----------------------------|
| Easy    | 5 s           | Default                     |
| Hard    | 2 s           |                             |

### Target color generation

- Random HSB with constrained ranges so targets are distinguishable:
  saturation ≈ 25–100, brightness ≈ 25–100 (exact bounds in `config.js`).
- Seedable RNG so a game can be replayed or tested deterministically.

### Scoring

- Convert target and guess to CIELAB; compute **CIEDE2000** ΔE.
- Map ΔE → 0–10 points with a smooth decaying curve (ΔE 0 → 10.00; large ΔE → ~0). Shown with two decimals.
- Total = sum of the 5 rounds (max 50).
- Curve parameters live in `config.js` and will be tuned in playtesting.

### Out of scope for v0.1

Multiplayer, daily challenge, sound, sharing, accounts, leaderboards, persistence.

---

## Game 2: Glimpse

> Status: **v0.1 shipped.** Tunables (bands, timings, layout, score curve, verdicts) in `games/glimpse/src/config.js`.

### Pitch

How many dots was that? A cloud of dots flashes for under a second — too fast to count — and you guess the number. It tests "number sense": the gut-level estimation everyone does when glancing at a crowd or a jar of sweets.

### Game flow

```
Intro ──▶ [ Ready ──▶ Flash ──▶ Guess ──▶ Round result ] × 5 ──▶ Summary ──▶ (Play again)
```

| Phase        | What the player sees                                                    | Exit              |
|--------------|-------------------------------------------------------------------------|-------------------|
| Intro        | Title, one-line rules, difficulty toggle, Start                         | Start             |
| Ready        | "Round 2 / 5 · Get ready" with a short 3-2-1 (≈1.5 s total)             | Auto              |
| Flash        | Dot cloud on the card                                                   | Auto after flash  |
| Guess        | Empty card, big number input (numeric keypad on phones), −/+ buttons    | Submit / Enter    |
| Round result | The dots again with the true count, your guess, % off, round score     | Next / Enter      |
| Summary      | Five rounds (actual vs. guess), total out of 50, Menu / Play again      | Play again        |

### Rounds and difficulty

- Dot counts are random per round, spread across a range (≈ 8–150) so each game has small and large clouds.
- Easy: flash 1000 ms. Hard: flash 400 ms. (Tunables in `config.js`.)
- Dots: same size, placed with a minimum spacing so none overlap (seeded, reproducible with `?seed=`).

### Scoring

- Error is **ratio-based**, not absolute: guessing 110 for 100 is as good as 11 for 10.
  `error = |ln(guess / actual)|`
- Points = `10 · exp(-(error / scale) ^ shape)`, same curve shape as Hue Recall. Exact guess = 10.
- Guess of 0 or empty can't be submitted.

### Reuse

- Shares the card look, screen contract, render loop and Enter-key flow with Hue Recall.
- Generic helpers (`el`/`onKey`, seeded RNG, points formatting, round badge, countdown) move to `shared/js/` so both games import them instead of copying (see ARCHITECTURE "Adding a new game").

### Out of scope for v0.1

Shapes other than dots, colored distractors, timed streak mode, persistence.
