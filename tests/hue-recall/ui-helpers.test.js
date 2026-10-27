import { test } from 'node:test';
import assert from 'node:assert/strict';
import { VERDICTS } from '../../games/hue-recall/src/config.js';
import { inkFor } from '../../games/hue-recall/src/color/contrast.js';
import { channelStops } from '../../games/hue-recall/src/color/gradient.js';
import { verdictFor } from '../../shared/js/verdict.js';

test('inkFor: dark ink on light colors, light ink on dark colors', () => {
  assert.equal(inkFor({ h: 60, s: 100, b: 100 }), 'dark'); // yellow
  assert.equal(inkFor({ h: 0, s: 0, b: 100 }), 'dark'); // white
  assert.equal(inkFor({ h: 240, s: 100, b: 100 }), 'light'); // blue
  assert.equal(inkFor({ h: 0, s: 0, b: 10 }), 'light'); // near black
});

test('channelStops: sweeps one channel from min to max', () => {
  const stops = channelStops('b', { h: 0, s: 0, b: 50 }, [0, 100], 3);
  assert.deepEqual(stops, ['#000000', '#808080', '#ffffff']);
});

test('channelStops: hue sweep starts and ends on red', () => {
  const stops = channelStops('h', { h: 120, s: 100, b: 100 }, [0, 360], 7);
  assert.equal(stops.length, 7);
  assert.equal(stops[0], '#ff0000');
  assert.equal(stops[6], '#ff0000');
});

test('verdictFor: picks band by minimum', () => {
  assert.equal(verdictFor(10, VERDICTS), 'Flawless');
  assert.equal(verdictFor(8.4, VERDICTS), 'Sharp eye');
  assert.equal(verdictFor(6, VERDICTS), 'Close');
  assert.equal(verdictFor(0, VERDICTS), 'Way off');
  assert.equal(verdictFor(-1, VERDICTS), 'Way off');
});
