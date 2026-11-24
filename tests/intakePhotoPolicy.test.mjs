import test from 'node:test';
import assert from 'node:assert/strict';
import { intakePhotoDimensions } from '../services/marketplace/intakePhotoPolicy.mjs';

test('intake photos retain small original sizes', () => {
  assert.deepEqual(intakePhotoDimensions(320, 480), { width: 320, height: 480 });
});
test('intake landscape photos retain the existing width limit', () => {
  assert.deepEqual(intakePhotoDimensions(4000, 3000), { width: 720, height: 540 });
});
test('intake portrait photos are bounded on both axes', () => {
  assert.deepEqual(intakePhotoDimensions(1000, 6000), { width: 200, height: 1200 });
  assert.deepEqual(intakePhotoDimensions(3000, 4000), { width: 720, height: 960 });
});
test('invalid dimensions are rejected', () => {
  assert.throws(() => intakePhotoDimensions(0, 100));
  assert.throws(() => intakePhotoDimensions(Infinity, 100));
});
