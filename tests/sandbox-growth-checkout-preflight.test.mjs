import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';

const read = (file) => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

test('Growth sandbox checkout is isolated from live plans and uses published Payfast test buyer', () => {
  const route = read('../app/api/sandbox-growth-test/checkout/route.ts');
  const guard = read('../services/payments/sandboxGrowthTest.ts');
  const page = read('../app/sandbox-growth-test/sandbox-checkout.tsx');
  assert.match(guard, /process\.env\.VERCEL_ENV === 'preview'/);
  assert.match(guard, /process\.env\.PAYFAST_MODE === 'sandbox'/);
  assert.match(guard, /STAGING_PROJECT = 'bvzsbcpoxdvuvpskavho'/);
  assert.match(route, /growthSandboxEnabled\(\)/);
  assert.match(route, /isValidGrowthTestToken/);
  assert.match(route, /getProviderPlan\('growth'\)/);
  assert.match(route, /plan_code: 'growth_monthly'/);
  assert.match(route, /amount: '99\.00'/);
  assert.match(route, /email_address: 'sbtu01@payfast\.io'/);
  assert.match(route, /merchantId\)/);
  assert.match(route, /payfastSignature\(fields, config\.passphrase\)/);
  assert.match(page, /url\.origin !== 'https:\/\/sandbox\.payfast\.co\.za'/);
  assert.doesNotMatch(route, /\.from\('account_roles'\)/);
});

test('Sandbox health probe reports merchant format readiness without returning keys', () => {
  const health = read('../app/api/provider-billing/sandbox-ping/route.ts');
  assert.match(health, /merchantIdFormatValid/);
  assert.match(health, /merchantKeyFormatValid/);
  assert.match(health, /recurringPassphrasePresent/);
  assert.doesNotMatch(health, /merchantId: cfg\.merchantId[,}]/);
  assert.doesNotMatch(health, /merchantKey: cfg\.merchantKey[,}]/);
});

test('Payment remains INITIATED until verified notification and entitlement', () => {
  const checkout = read('../app/api/sandbox-growth-test/checkout/route.ts');
  const status = read('../app/api/sandbox-growth-test/status/route.ts');
  assert.match(checkout, /processor_status: 'INITIATED'/);
  assert.match(status, /processor === 'COMPLETE'/);
  assert.match(status, /payment_events/);
  assert.match(status, /subscription_entitlements/);
  assert.match(status, /qualified_leads_limit === 40/);
});
