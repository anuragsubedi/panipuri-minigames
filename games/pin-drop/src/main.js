// Entry point: loads the map and packs, owns the current state and maps each
// phase to its screen. The only module that touches both the pure core and the UI.

import { ROUND_OPTIONS, MAPS, DIFFICULTIES, SCORE_CURVE, VERDICTS, MAP_VIEW } from './config.js';
import { createRng, seedFromQuery } from '../../../shared/js/rng.js';
import { el } from '../../../shared/js/dom.js';
import { verdictFor } from '../../../shared/js/verdict.js';
import { loadPack } from './data/load-pack.js';
import { answerLabel } from './data/clue.js';
import { poolFor } from './data/pick-places.js';
import { formatKm, directionHint } from './geo/describe.js';
import {
  PHASES,
  createGame,
  setOptions,
  startGame,
  submitPin,
  nextRound,
  currentRound,
  currentClue,
  gameTotal,
  packIdsFor,
} from './state/game.js';
import { renderIntro } from './ui/screens/intro.js';
import { renderClue } from './ui/screens/clue.js';
import { renderReveal } from './ui/screens/reveal.js';
import { renderSummary } from './ui/screens/summary.js';

const root = document.getElementById('game');
const rng = createRng(seedFromQuery(location.search));

let packs = {};
let maps = {};
let state = createGame();
let cleanup = () => {};

const screens = {
  [PHASES.INTRO]: () =>
    renderIntro(
      root,
      {
        mapId: state.mapId,
        topic: state.topic,
        difficulty: state.difficulty,
        roundCount: state.roundCount,
        maps: MAPS,
        difficulties: DIFFICULTIES,
        roundOptions: ROUND_OPTIONS,
        placesFor: (choice) => poolFor(packIdsFor({ mapId: state.mapId, ...choice }).map((id) => packs[id]), DIFFICULTIES[choice.difficulty].tiers),
        ...mapProps(),
      },
      {
        // The intro toggles its own buttons, so no re-render (keeps focus);
        // a new map changes the topics and the preview, so that one re-renders.
        onOptions: (changes) => commit(setOptions(state, changes), { rerender: 'mapId' in changes }),
        onStart: () => commit(startGame(state, packs, rng)),
      },
    ),

  [PHASES.CLUE]: () =>
    renderClue(
      root,
      { ...roundProps(), ...mapProps(), total: gameTotal(state), clue: currentClue(state) },
      { onSubmit: (pin) => commit(submitPin(state, pin)) },
    ),

  [PHASES.REVEAL]: () => {
    const round = currentRound(state);
    return renderReveal(
      root,
      {
        ...roundProps(),
        ...mapProps(),
        answer: answerLabel(round.place),
        blurb: round.place.blurb ?? null,
        guess: round.guess,
        target: round.target,
        shape: round.place.shape ?? null,
        distance: formatKm(round.distanceKm),
        direction: directionHint(round.guess, round.target, round.distanceKm),
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
        ...mapProps(),
        rounds: state.rounds.map((r) => ({
          answer: answerLabel(r.place),
          guess: r.guess,
          target: r.target,
          distance: formatKm(r.distanceKm),
          score: r.score,
          verdict: verdictFor(r.score, VERDICTS),
        })),
        total,
        maxTotal: SCORE_CURVE.max * state.rounds.length,
        verdict: verdictFor(total / state.rounds.length, VERDICTS),
        optionsLabel: `${MAPS[state.mapId].label} · ${MAPS[state.mapId].topics[state.topic].label} · ${DIFFICULTIES[state.difficulty].label}`,
      },
      {
        onPlayAgain: () => commit(startGame(state, packs, rng)),
        onMenu: () => commit(createGame({ mapId: state.mapId, topic: state.topic, difficulty: state.difficulty, roundCount: state.roundCount })),
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

function mapProps() {
  return { map: maps[state.mapId], mapView: MAP_VIEW, gridStep: MAPS[state.mapId].gridStep };
}

async function loadJson(path) {
  const response = await fetch(new URL(path, import.meta.url));
  if (!response.ok) throw new Error(`Could not load ${path} (${response.status})`);
  return response.json();
}

// Everything is fetched once up front; nothing goes over the network during play.
async function boot() {
  root.append(el('p', { class: 'loading', text: 'Unfolding the map…' }));
  try {
    const ids = [...new Set(Object.values(MAPS).flatMap((m) => Object.values(m.topics).flatMap((t) => t.packs)))];
    const loaded = await Promise.all(ids.map((id) => loadPack(new URL(`../data/packs/${id}.json`, import.meta.url))));
    packs = Object.fromEntries(loaded.map((p) => [p.id, p]));
    maps = Object.fromEntries(await Promise.all(Object.keys(MAPS).map(async (id) => [id, await loadJson(`../data/maps/${id}.json`)])));
    render();
  } catch (error) {
    root.replaceChildren(el('p', { class: 'loading', text: `Couldn't load the map. ${error.message}` }));
  }
}

boot();
