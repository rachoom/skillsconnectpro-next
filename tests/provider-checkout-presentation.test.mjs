import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const file = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('provider pricing retains published tiers and allowance labels', () => {
  const catalog = file('app/provider-plans/planCatalog.ts');
  assert.match(catalog, /name: 'Starter', price: 'R49'/);
  assert.match(catalog, /name: 'Growth', price: 'R99'/);
  assert.match(catalog, /name: 'Pro', price: 'R199'/);
  assert.match(catalog, /15 paid opportunity responses each month/);
  assert.match(catalog, /40 paid opportunity responses each month/);
  assert.match(catalog, /100 paid opportunity responses each month/);
});

test('checkout layout keeps authenticated artisan billing and payment flow unchanged', () => {
  const page = file('app/provider-checkout/page.tsx');
  const form = file('app/provider-checkout/ProviderCheckoutForm.tsx');
  const handler = file('app/api/payments/payfast/checkout/route.ts');
  assert.match(page, /getAuthenticatedAccount\(\)/);
  assert.match(page, /linked_artisan_id/);
  assert.match(page, /<ProviderCheckoutForm/);
  assert.match(form, /\/api\/payments\/payfast\/checkout/);
  assert.match(form, /form\.submit\(\)/);
  assert.match(handler, /getPayfastConfig\(\)/);
  assert.match(handler, /payfastSignature\(/);
  assert.match(handler, /payment_transactions/);
});

test('plan screens show current prices and recurring billing terms clearly', () => {
  const cards = file('app/plans/page.tsx');
  const detail = file('app/provider-plans/[plan]/page.tsx');
  const checkout = file('app/provider-checkout/ProviderCheckoutForm.tsx');
  assert.match(cards, /Monthly recurring billing/);
  assert.match(detail, /Automatically renewing monthly/);
  assert.match(checkout, /Automatically renewing monthly subscription/);
  assert.match(checkout, /once-off payment/);
  assert.match(checkout, /Provider Billing Terms/);
  assert.match(checkout, /Responding to opportunities does not guarantee a job/);
});

test('the product color system now keeps provider tiers in the same gold brand', () => {
  const theme = file('services/planPresentation.ts');
  const section = theme.slice(theme.indexOf('export const providerPlanThemes'));
  for (const name of ['starter', 'growth', 'pro', 'lead-pack-4', 'lead-pack-10', 'lead-pack-25']) {
    assert.ok(section.includes(`'${name}':`), `Missing provider theme: ${name}`);
  }
  assert.doesNotMatch(section, /#2dd4bf|#a78bfa|#fb923c|#f472b6/);
  assert.match(section, /bg-\[#f5c518\]/);
});
