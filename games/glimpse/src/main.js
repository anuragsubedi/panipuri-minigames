// Entry point: owns the current state and maps each phase to its screen.
// The only module that touches both the pure core and the UI.

import { ROUNDS, DIFFICULTIES, READY_MS, DOT_LAYOUT, GUESS_LIMITS, SCORE_CURVE, VERDICTS } from './config.js';
import { createRng, seedFromQuery } from '../../../shared/js/rng.js';
import { verdictFor } from '../../../shared/js/verdict.js';
import { percentOff } from './scoring/error.js';
import {
  PHASES,
  createGame,
  setDifficulty,
  startGame,
  endReady,
  endFlash,
  submitGuess,
  nextRound,
  isValidGuess,
  currentRound,
  gameTotal,
  flashMs,
} from './state/game.js';
import { renderIntro } from './ui/screens/intro.js';
import { renderReady } from './ui/screens/ready.js';
import { renderFlash } from './ui/screens/flash.js';
import { renderGuess } from './ui/screens/guess.js';
import { renderRoundResult } from './ui/screens/round-result.js';
import { renderSummary } from './ui/screens/summary.js';

const root = document.getElementById('game');
const rng = createRng(seedFromQuery(location.search));

let state = createGame();
let cleanup = () => {};

const screens = {
  [PHASES.INTRO]: () =>
    renderIntro(
      root,
      { difficulty: state.difficulty, difficulties: DIFFICULTIES, rounds: ROUNDS },
      {
        // The intro toggles its own buttons, so no re-render (keeps focus).
        onDifficulty: (key) => commit(setDifficulty(state, key), { rerender: false }),
        onStart: () => commit(startGame(state, rng)),
      },
    ),

  [PHASES.READY]: () =>
    renderReady(root, { ...roundProps(), durationMs: READY_MS }, { onDone: () => commit(endReady(state)) }),

  [PHASES.FLASH]: () =>
    renderFlash(
      root,
      { dots: currentRound(state).dots, radius: DOT_LAYOUT.radius, durationMs: flashMs(state) },
      { onDone: () => commit(endFlash(state)) },
    ),

  [PHASES.GUESS]: () =>
    renderGuess(
      root,
      { ...roundProps(), limits: GUESS_LIMITS, isValid: isValidGuess },
      { onSubmit: (guess) => commit(submitGuess(state, guess)) },
    ),

  [PHASES.ROUND_RESULT]: () => {
    const round = currentRound(state);
    return renderRoundResult(
      root,
      {
        ...roundProps(),
        dots: round.dots,
        radius: DOT_LAYOUT.radius,
        count: round.count,
        guess: round.guess,
        percentOff: percentOff(round.guess, round.count),
        score: round.score,
        maxScore: SCORE_CURVE.max,
        verdict: verdictFor(round.score, VERDICTS),
        isLast: state.roundIndex === state.rounds.length - 1,
      },
      { onNext: () => commit(nextRound(state)) },
    );
  },

  [PHASES.SUMMARY]: () => {
    const total = gameTotal(state);
    return renderSummary(
      root,
      {
        rounds: state.rounds.map((r) => ({ ...r, verdict: verdictFor(r.score, VERDICTS) })),
        total,
        maxTotal: SCORE_CURVE.max * state.rounds.length,
        verdict: verdictFor(total / state.rounds.length, VERDICTS),
        difficultyLabel: DIFFICULTIES[state.difficulty].label,
      },
      {
        onPlayAgain: () => commit(startGame(state, rng)),
        onMenu: () => commit(createGame({ difficulty: state.difficulty })),
      },
    );
  },
};

function commit(next, { rerender = true } = {}) {
  state = next;
  if (rerender) render();
}

function render() {
  cleanup();
  root.replaceChildren();
  cleanup = screens[state.phase]();
}

function roundProps() {
  return { roundNumber: state.roundIndex + 1, totalRounds: state.rounds.length };
}

render();
