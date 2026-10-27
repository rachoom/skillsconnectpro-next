import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

test('provider plans do not market unavailable priority, visibility or collaboration', () => {
  const catalog = read('../app/provider-plans/planCatalog.ts');
  const policy = read('../services/marketplace/providerLeadAccessPolicy.js');
  for (const code of ['starter_monthly', 'growth_monthly', 'pro_monthly']) {
    assert.match(catalog, new RegExp("code: '" + code + "'"));
  }
  assert.match(catalog, /no paid priority ranking currently applied/i);
  assert.match(catalog, /No separate Pro-specific lead allowance is currently enforced/);
  assert.doesNotMatch(policy, /Priority positioning for established providers/);
  assert.doesNotMatch(policy, /More visibility for a steadily growing service business/);
});

test('lead packs claim response consumption, not a charge simply for viewing', () => {
  const catalog = read('../app/provider-plans/planCatalog.ts');
  const response = read('../services/marketplace/providerResponses.ts');
  assert.match(catalog, /consumed on an eligible submitted response/i);
  assert.match(response, /if \(!declined\) \{\s*try \{\s*await consumeLeadPackCredit\(leadAccess\)/);
  assert.match(response, /\.eq\('qualified_leads_used', used\)/);
});

test('checkout does not imply an unimplemented self-service cancellation tool', () => {
  const checkout = read('../app/provider-checkout/ProviderCheckoutForm.tsx');
  assert.match(checkout, /contact Skills Connect Pro support/);
  assert.doesNotMatch(checkout, /You can cancel future renewals at any time/);
});

test('the three complimentary lead boundary and subscription unlock remain intact', () => {
  const policy = read('../services/marketplace/providerLeadAccessPolicy.js');
  assert.match(policy, /DEFAULT_FREE_LEAD_LIMIT = 3/);
  assert.match(policy, /locked: freeLeadsRemaining === 0 && !hasPaidAccess/);
  assert.match(policy, /activeEntitlements\.find\(\(entitlement\) => subscriptionCodes\.has/);
});
