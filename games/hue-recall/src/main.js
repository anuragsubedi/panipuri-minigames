// Entry point: owns the current state and maps each phase to its screen.
// The only module that touches both the pure core and the UI.

import { ROUNDS, DIFFICULTIES, CHANNEL_RANGES, START_GUESS, SCORE_CURVE, VERDICTS } from './config.js';
import { createRng, randomInt, seedFromQuery } from '../../../shared/js/rng.js';
import { verdictFor } from '../../../shared/js/verdict.js';
import {
  PHASES,
  createGame,
  setDifficulty,
  startGame,
  endMemorize,
  submitGuess,
  nextRound,
  currentRound,
  gameTotal,
  memorizeMs,
} from './state/game.js';
import { renderIntro } from './ui/screens/intro.js';
import { renderMemorize } from './ui/screens/memorize.js';
import { renderRecreate } from './ui/screens/recreate.js';
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

  [PHASES.MEMORIZE]: () =>
    renderMemorize(
      root,
      { ...roundProps(), target: currentRound(state).target, durationMs: memorizeMs(state) },
      { onDone: () => commit(endMemorize(state)) },
    ),

  [PHASES.RECREATE]: () =>
    renderRecreate(
      root,
      { ...roundProps(), start: { h: randomInt(rng, CHANNEL_RANGES.h), ...START_GUESS }, ranges: CHANNEL_RANGES },
      { onSubmit: (guess) => commit(submitGuess(state, guess)) },
    ),

  [PHASES.ROUND_RESULT]: () => {
    const round = currentRound(state);
    return renderRoundResult(
      root,
      {
        ...roundProps(),
        target: round.target,
        guess: round.guess,
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
