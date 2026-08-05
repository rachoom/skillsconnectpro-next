import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateCustomerCompletionConfirmation,
  isCustomerCompletionConfirmation,
  isProviderCompletionReport,
  isSystemAutoCompletion,
  verifiedReviewEligible,
} from '../services/marketplace/completionPolicy.js';

const providerReport = {
  event_type: 'completion_reported',
  actor_type: 'provider',
  event_data: { action: 'report_completion' },
};

const customerConfirmation = {
  event_type: 'project_completed',
  actor_type: 'customer',
  event_data: { action: 'confirm_completion' },
};

const automaticCompletion = {
  event_type: 'project_auto_completed',
  actor_type: 'system',
  event_data: { action: 'auto_complete_after_timeout' },
};

const noSystemCompletion = null;

test('recognises only a valid provider completion report', () => {
  assert.equal(isProviderCompletionReport(providerReport), true);
  assert.equal(
    isProviderCompletionReport({
      event_type: 'completion_reported',
      actor_type: 'customer',
      event_data: { action: 'report_completion' },
    }),
    false,
  );
});

test('recognises only a valid customer completion confirmation', () => {
  assert.equal(isCustomerCompletionConfirmation(customerConfirmation), true);
  assert.equal(
    isCustomerCompletionConfirmation({
      event_type: 'project_completed',
      actor_type: 'provider',
      event_data: { action: 'confirm_completion' },
    }),
    false,
  );
});

test('recognises only a valid system timeout closure', () => {
  assert.equal(isSystemAutoCompletion(automaticCompletion), true);
  assert.equal(
    isSystemAutoCompletion({
      event_type: 'project_auto_completed',
      actor_type: 'admin',
      event_data: { action: 'auto_complete_after_timeout' },
    }),
    false,
  );
});

test('prevents a provider from confirming final completion', () => {
  const result = evaluateCustomerCompletionConfirmation({
    actorType: 'provider',
    projectStatus: 'in_progress',
    completionReportedAt: '2026-08-05T04:00:00.000Z',
    providerCompletionEvent: providerReport,
    customerCompletionEvent: null,
    systemCompletionEvent: noSystemCompletion,
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /customer must confirm/i);
});

test('prevents customer confirmation before the provider reports completion', () => {
  const result = evaluateCustomerCompletionConfirmation({
    actorType: 'customer',
    projectStatus: 'in_progress',
    completionReportedAt: null,
    providerCompletionEvent: null,
    customerCompletionEvent: null,
    systemCompletionEvent: noSystemCompletion,
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /provider must report/i);
});

test('allows customer confirmation after a valid provider report', () => {
  const result = evaluateCustomerCompletionConfirmation({
    actorType: 'customer',
    projectStatus: 'in_progress',
    completionReportedAt: '2026-08-05T04:00:00.000Z',
    providerCompletionEvent: providerReport,
    customerCompletionEvent: null,
    systemCompletionEvent: noSystemCompletion,
  });

  assert.deepEqual(result, {
    allowed: true,
    alreadyConfirmed: false,
    reason: null,
  });
});

test('treats repeated customer confirmation as idempotent', () => {
  const result = evaluateCustomerCompletionConfirmation({
    actorType: 'customer',
    projectStatus: 'completed',
    completionReportedAt: '2026-08-05T04:00:00.000Z',
    providerCompletionEvent: providerReport,
    customerCompletionEvent: customerConfirmation,
    systemCompletionEvent: noSystemCompletion,
  });

  assert.deepEqual(result, {
    allowed: true,
    alreadyConfirmed: true,
    reason: null,
  });
});

test('allows late customer confirmation after an automatic timeout closure', () => {
  const result = evaluateCustomerCompletionConfirmation({
    actorType: 'customer',
    projectStatus: 'completed',
    completionReportedAt: '2026-08-05T04:00:00.000Z',
    providerCompletionEvent: providerReport,
    customerCompletionEvent: null,
    systemCompletionEvent: automaticCompletion,
  });

  assert.deepEqual(result, {
    allowed: true,
    alreadyConfirmed: false,
    reason: null,
  });
});

test('rejects a completed project with no trusted closure event', () => {
  const result = evaluateCustomerCompletionConfirmation({
    actorType: 'customer',
    projectStatus: 'completed',
    completionReportedAt: '2026-08-05T04:00:00.000Z',
    providerCompletionEvent: providerReport,
    customerCompletionEvent: null,
    systemCompletionEvent: null,
  });

  assert.equal(result.allowed, false);
  assert.match(result.reason, /contact support/i);
});

test('keeps verified rating locked without customer confirmation', () => {
  assert.equal(
    verifiedReviewEligible({
      hasSelectedProvider: true,
      projectStatus: 'completed',
      customerCompletionEvent: null,
    }),
    false,
  );
});

test('automatic closure alone does not unlock verified rating', () => {
  assert.equal(
    verifiedReviewEligible({
      hasSelectedProvider: true,
      projectStatus: 'completed',
      customerCompletionEvent: automaticCompletion,
    }),
    false,
  );
});

test('unlocks verified rating only after customer confirmation', () => {
  assert.equal(
    verifiedReviewEligible({
      hasSelectedProvider: true,
      projectStatus: 'completed',
      customerCompletionEvent: customerConfirmation,
    }),
    true,
  );
});
