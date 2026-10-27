import { test } from 'node:test';
import assert from 'node:assert/strict';
import { curvePath } from '../../shared/js/plot.js';

test('curvePath: maps the box corners and flips y', () => {
  const d = curvePath((x) => x, { x0: 0, x1: 1, y0: 0, y1: 1, w: 100, h: 50, samples: 2 });
  assert.equal(d, 'M0,50L50,25L100,0');
});
