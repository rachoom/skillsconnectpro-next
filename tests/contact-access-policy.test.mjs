import test from 'node:test';
import assert from 'node:assert/strict';

import { isContactAccessActive } from '../services/marketplace/contactAccessPolicy.js';

test('contact access remains private before release', () => {
  assert.equal(isContactAccessActive('contact_released', null), false);
});

test('contact access remains available for an active connected job', () => {
  assert.equal(isContactAccessActive('contact_released', '2026-10-07T19:25:00.000Z'), true);
  assert.equal(isContactAccessActive('in_progress', '2026-10-07T19:25:00.000Z'), true);
});

test('customer cancellation revokes previously released contact access', () => {
  assert.equal(isContactAccessActive('cancelled', '2026-10-07T19:25:00.000Z'), false);
});

test('unfulfilled closure also revokes contact access', () => {
  assert.equal(isContactAccessActive('unfulfilled', '2026-10-07T19:25:00.000Z'), false);
});

test('completed project keeps its historical connected contact access', () => {
  assert.equal(isContactAccessActive('completed', '2026-10-07T19:25:00.000Z'), true);
});
