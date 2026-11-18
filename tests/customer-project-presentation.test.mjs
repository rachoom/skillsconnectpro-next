import test from 'node:test';
import assert from 'node:assert/strict';
import { customerProjectPresentation as present, customerProjectStatusLabel } from '../services/marketplace/customerProjectPresentation.js';

test('closed projects never advertise matching or new provider actions, even with old responses', () => {
  for (const status of ['cancelled', 'completed', 'unfulfilled']) {
    const model = present({ status, responses: 4, invited: 8, reviewing: 3, selected: true, connected: true });
    assert.equal(model.closed, true); assert.equal(model.matching, false); assert.equal(model.action, null);
    assert.doesNotMatch(model.headline, /contacted|ready|search/i);
  }
});
test('recorded work and connection states take precedence over historical matching counts', () => {
  assert.equal(present({ status: 'in_progress', responses: 3, connected: true }).headline, 'Work is in progress');
  assert.equal(present({ status: 'contact_released', connected: true, responses: 2 }).label, 'Connected');
  assert.equal(present({ status: 'provider_selected', selected: true, responses: 2 }).action, null);
  assert.equal(present({ status: 'disputed', connected: true }).tone, 'attention');
});
test('waiting and response messages reflect the recorded counts', () => {
  const preparing = present({ status: 'assessed' });
  assert.match(preparing.next, /No provider has been contacted/);
  assert.equal(present({ status: 'matching', invited: 3 }).headline, '3 providers contacted');
  assert.match(present({ status: 'matching', invited: 3, reviewing: 1 }).copy, /1 provider has viewed/);
  assert.equal(present({ status: 'matching', responses: 1 }).headline, '1 provider response ready');
  assert.equal(present({ status: 'matching', responses: 2 }).action, 'responses');
  assert.equal(customerProjectStatusLabel('unfulfilled'), 'Matching ended');
});
