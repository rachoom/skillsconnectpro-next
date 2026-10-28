import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = file => fs.readFileSync(new URL(file, import.meta.url), 'utf8');

test('provider plan catalogue sells real capacity rather than unsupported premium claims', () => {
  const catalogue = read('../app/provider-plans/planCatalog.ts');
  assert.match(catalogue, /15 paid opportunity responses each month/);
  assert.match(catalogue, /40 paid opportunity responses each month/);
  assert.match(catalogue, /100 paid opportunity responses each month/);
  assert.match(catalogue, /availability and estimated arrival times/);
  assert.match(catalogue, /Manage invitations and response history/i);
  assert.doesNotMatch(catalogue, /No advanced multi-artisan|Recurring payment via Payfast|without paid priority ranking/i);
});

test('payment-return page never interprets Payfast browser redirect as confirmed purchase', () => {
  const page = read('../app/provider-payment-result/page.tsx');
  const experience = read('../app/provider-payment-result/payment-return-experience.tsx');
  assert.match(page, /ProviderPaymentReturnExperience/);
  assert.match(page, /paymentReference=\{payment\}/);
  assert.match(experience, /\/api\/payments\/payfast\/provider-status\?payment=/);
  assert.match(experience, /payment\?\.status === 'confirmed'/);
  assert.match(experience, /We will only unlock verified access/);
  assert.match(experience, /do not need to make another payment/i);
  assert.match(experience, /status === 'processing'/);
});

test('public payment-status lookup requires an unguessable reference and verified entitlement', () => {
  const route = read('../app/api/payments/payfast/provider-status/route.ts');
  assert.match(route, /referencePattern = \//);
  assert.match(route, /enforcePublicRequestLimit\(request, 'provider_payment_status'/);
  assert.match(route, /\.eq\('m_payment_id', ref\)/);
  assert.match(route, /\.eq\('processor_status'/) === false;
  assert.match(route, /processorStatus === 'COMPLETE'/);
  assert.match(route, /\.from\('subscription_entitlements'\)/);
  assert.match(route, /\.eq\('status', 'active'\)/);
  assert.match(route, /if \(entitlement\) status = 'confirmed'/);
  assert.match(route, /no-store/);
  assert.doesNotMatch(route, /payfast_payment_id.*NextResponse\.json/);
});

test('visual preview is separate from production and cannot poll or change a payment', () => {
  const preview = read('../app/provider-payment-result-preview/page.tsx');
  const component = read('../app/provider-payment-result/payment-return-experience.tsx');
  assert.match(preview, /VERCEL_ENV !== 'preview'/);
  assert.match(preview, /demoState=\{demoState\}/);
  assert.match(component, /if \(demoState \|\| !paymentReference\) return/);
});
