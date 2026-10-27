# Project: panipuri-minigames

## Vision

A small arcade of quick, satisfying browser minigames that test perception and memory. Each game is playable in under two minutes, needs no account, and runs from static files.

## Constraints

- Vanilla HTML / CSS / JS, native ES modules. No dependencies, no build step.
- Readable and maintainable: modular, single-responsibility code (see `CLAUDE.md`).
- Original identity: games may share a genre with existing games, but names, visuals and copy are our own.

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
