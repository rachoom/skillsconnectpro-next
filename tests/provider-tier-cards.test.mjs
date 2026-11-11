import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('three monthly provider plans retain their original prices and allowances', () => {
  const catalog = source('app/provider-plans/planCatalog.ts');
  for (const [name, price, allowance] of [['Starter', 'R49', '15'], ['Growth', 'R99', '40'], ['Pro', 'R199', '100']]) {
    assert.ok(catalog.includes(`name: '${name}', price: '${price}'`), `${name} amount changed`);
    assert.ok(catalog.includes(`${allowance} paid opportunity responses each month`), `${name} allowance changed`);
  }
});

test('each plan page lists every included feature inside the bordered price card', () => {
  const detail = source('app/provider-plans/[plan]/page.tsx');
  const start = detail.indexOf('<aside className={`relative isolate');
  const end = detail.indexOf('</aside>', start);
  assert.ok(start >= 0 && end > start, 'Pricing card markup must be present');
  const card = detail.slice(start, end);
  assert.match(card, /plan\.included\.map\(\(feature, index\)/);
  assert.match(card, /Everything included/);
  assert.match(card, /Continue to secure checkout/);
  assert.match(card, /Automatically renewing monthly/);
  assert.match(card, /no automatic renewal/i);
  assert.match(card, /href=\{checkoutHref\}/);
});

test('all provider comparison cards also show the full feature list', () => {
  const comparison = source('app/plans/page.tsx');
  assert.match(comparison, /plan\.included\[0\]/);
  assert.match(comparison, /plan\.included\.slice\(1\)\.map/);
  assert.doesNotMatch(comparison, /plan\.included\.slice\(1, 5\)/);
});

test('Starter is emerald, Growth purple and Pro gold, without replacing brand logo', () => {
  const all = source('services/planPresentation.ts');
  const themes = all.slice(all.indexOf('export const providerPlanThemes'));
  for (const [key, colour] of [['starter', '#61e2bc'], ['growth', '#bba3ff'], ['pro', '#f5c518']]) {
    const from = themes.indexOf(`'${key}': {`);
    const to = themes.indexOf('  },', from);
    assert.ok(from > -1 && to > from, `Theme missing for ${key}`);
    assert.ok(themes.slice(from, to).includes(`bg-[${colour}]`), `Distinctive action colour missing on ${key}`);
  }
  const plan = source('app/provider-plans/[plan]/page.tsx');
  assert.match(plan, /src="\/logo-new\.svg"/);
  assert.match(plan, /providerTheme\(plan\.slug\)/);
  assert.match(plan, /theme\.card/);
});

test('provider checkout still uses signed-in payment route and tier-specific visual accents', () => {
  const page = source('app/provider-checkout/page.tsx');
  const form = source('app/provider-checkout/ProviderCheckoutForm.tsx');
  const route = source('app/api/payments/payfast/checkout/route.ts');
  assert.match(page, /getAuthenticatedAccount\(\)/);
  assert.match(page, /linked_artisan_id/);
  assert.match(page, /theme\.card/);
  assert.match(form, /theme\.button/);
  assert.match(form, /\/api\/payments\/payfast\/checkout/);
  assert.match(form, /form\.submit\(\)/);
  assert.match(route, /getPayfastConfig\(\)/);
  assert.match(route, /payfastSignature\(/);
  assert.match(route, /payment_transactions/);
});
