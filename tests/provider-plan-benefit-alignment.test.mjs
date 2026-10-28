import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

test('provider tiers publish differentiated, enforceable monthly response limits, not paid priority', () => {
  const catalog = read('../app/provider-plans/planCatalog.ts');
  const policy = read('../services/marketplace/providerLeadAccessPolicy.js');
  const migration = read('../supabase/migrations/202610280001_provider_atomic_response_quotas.sql');
  for (const [code, amount] of [['starter_monthly',15], ['growth_monthly',40], ['pro_monthly',100]]) {
    assert.match(catalog, new RegExp("code: '" + code + "'"));
    assert.match(policy, new RegExp(code + ': ' + amount));
    assert.match(migration, new RegExp("when '" + code + "' then " + amount));
  }
  assert.match(catalog, /100 paid opportunity responses each month/);
  assert.match(catalog, /40 paid opportunity responses each month/);
  assert.match(catalog, /15 paid opportunity responses each month/);
  assert.doesNotMatch(catalog, /without paid priority ranking|No advanced multi-artisan|Recurring payment via Payfast/i);
  assert.doesNotMatch(policy, /Priority positioning for established providers/);
});

test('lead responses and lead spending are one database transaction with restricted execution', () => {
  const catalog = read('../app/provider-plans/planCatalog.ts');
  const response = read('../services/marketplace/providerResponses.ts');
  const migration = read('../supabase/migrations/202610280001_provider_atomic_response_quotas.sql');
  assert.match(catalog, /consumed on an eligible submitted response/i);
  assert.match(response, /\.rpc\('submit_provider_response_billed'/);
  assert.doesNotMatch(response, /await consumeLeadPackCredit/);
  assert.match(migration, /pg_advisory_xact_lock/);
  assert.match(migration, /qualified_leads_used = qualified_leads_used \+ 1/);
  assert.match(migration, /on conflict|Opportunity already answered/);
  assert.match(migration, /revoke all on function public\.submit_provider_response_billed/);
  assert.match(migration, /grant execute on function public\.submit_provider_response_billed[\s\S]*to service_role/);
});

test('a subscriber can cancel future renewals using account-bound Payfast API, retaining paid access', () => {
  const route = read('../app/api/provider-billing/cancel/route.ts');
  const api = read('../services/payments/payfast.ts');
  assert.match(route, /getAuthenticatedAccount\(\)/);
  assert.match(route, /linked_artisan_id/);
  assert.match(route, /cancelPayfastSubscription/);
  assert.match(route, /record_provider_subscription_cancellation/);
  assert.match(api, /payfastApiSignature/);
  assert.match(api, /\/cancel/);
});

test('the free allowance and subscription/pack gating are still enforced', () => {
  const policy = read('../services/marketplace/providerLeadAccessPolicy.js');
  assert.match(policy, /DEFAULT_FREE_LEAD_LIMIT = 3/);
  assert.match(policy, /locked: freeLeadsRemaining === 0 && !hasPaidAccess/);
  assert.match(policy, /subscriptionCodes\.has\(entitlement\.plan_code\)/);
});
