import test from 'node:test';
import assert from 'node:assert/strict';

import {
  evaluateCustomerCompletionConfirmation,
  isCustomerCompletionConfirmation,
  isProviderCompletionReport,
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

test('prevents a provider from confirming final completion', () => {
  const result = evaluateCustomerCompletionConfirmation({
    actorType: 'provider',
    projectStatus: 'in_progress',
    completionReportedAt: '2026-08-05T04:00:00.000Z',
    providerCompletionEvent: providerReport,
    customerCompletionEvent: null,
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
  });

  assert.deepEqual(result, {
    allowed: true,
    alreadyConfirmed: true,
    reason: null,
  });
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
