import test from 'node:test';
import assert from 'node:assert/strict';

import { projectStatusAfterInvitation } from '../services/marketplace/invitationStatusPolicy.js';

test('moves a newly assessed project into matching', () => {
  assert.equal(projectStatusAfterInvitation('assessment_complete'), 'matching');
});

test('keeps an existing matching project in matching', () => {
  assert.equal(projectStatusAfterInvitation('matching'), 'matching');
});

test('does not regress a project after provider responses arrive', () => {
  assert.equal(projectStatusAfterInvitation('responses_received'), 'responses_received');
});

test('does not reopen a closed or connected project', () => {
  assert.equal(projectStatusAfterInvitation('provider_selected'), 'provider_selected');
  assert.equal(projectStatusAfterInvitation('contact_released'), 'contact_released');
  assert.equal(projectStatusAfterInvitation('completed'), 'completed');
});
