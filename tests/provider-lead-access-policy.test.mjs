import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildProviderLeadAccess,
  parseFreeLeadLimit,
} from '../services/marketplace/providerLeadAccessPolicy.js';

test('keeps a provider unlocked for the first three opportunities', () => {
  const access = buildProviderLeadAccess({ usedFreeLeads: 2 });
  assert.equal(access.locked, false);
  assert.equal(access.freeLeadsRemaining, 1);
});

test('locks the fourth opportunity without a paid entitlement', () => {
  const access = buildProviderLeadAccess({ usedFreeLeads: 3 });
  assert.equal(access.locked, true);
  assert.equal(access.freeLeadsRemaining, 0);
});

test('an active subscription keeps the provider unlocked after free leads', () => {
  const access = buildProviderLeadAccess({
    usedFreeLeads: 8,
    entitlements: [{ plan_code: 'starter_monthly', status: 'active', starts_at: '2026-10-01T00:00:00Z' }],
    now: new Date('2026-10-10T00:00:00Z'),
  });
  assert.equal(access.locked, false);
  assert.equal(access.activePlan?.code, 'starter_monthly');
});

test('a lead pack unlocks only while credits remain', () => {
  const base = { plan_code: 'lead_pack_4', status: 'active', starts_at: '2026-10-01T00:00:00Z', qualified_leads_limit: 4 };
  assert.equal(buildProviderLeadAccess({ usedFreeLeads: 3, entitlements: [{ ...base, qualified_leads_used: 3 }] }).locked, false);
  assert.equal(buildProviderLeadAccess({ usedFreeLeads: 3, entitlements: [{ ...base, qualified_leads_used: 4 }] }).locked, true);
});

test('rejects an invalid configured free-lead limit', () => {
  assert.equal(parseFreeLeadLimit('nope'), 3);
  assert.equal(parseFreeLeadLimit('5'), 5);
});
