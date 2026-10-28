import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('only Payfast sandbox Preview notifications carry the Vercel automation bypass', () => {
  const payfast = read('../services/payments/payfast.ts');
  assert.match(payfast, /export function payfastNotificationUrl/);
  assert.match(payfast, /mode === 'sandbox' && process\.env\.VERCEL_ENV === 'preview'/);
  assert.match(payfast, /notify\.hostname\.endsWith\('\.vercel\.app'\)/);
  assert.match(payfast, /process\.env\.VERCEL_AUTOMATION_BYPASS_SECRET/);
  assert.match(payfast, /notify\.searchParams\.set\('x-vercel-protection-bypass', secret\)/);
  assert.match(payfast, /Payfast sandbox checkout cannot send notifications to the live production domain/);
  assert.match(payfast, /return notify\.toString\(\)/);
});

test('both customer and artisan checkouts use the same protected sandbox callback', () => {
  const customer = read('../app/api/payments/payfast/customer-checkout/route.ts');
  const provider = read('../app/api/payments/payfast/checkout/route.ts');
  for (const src of [customer, provider]) {
    assert.match(src, /notify_url: payfastNotificationUrl\(baseUrl, config\.mode\)/);
    assert.match(src, /payfastSignature\(paymentFields, config\.passphrase\)/);
    assert.doesNotMatch(src, /notify_url: `\$\{baseUrl\}\/api\/payments\/payfast\/itn`/);
  }
});

test('Payfast ITN still validates signatures, Payfast transaction authenticity and amounts', () => {
  const itn = read('../app/api/payments/payfast/itn/route.ts');
  assert.match(itn, /secureEqualHex\(signature, payfastSignature\(fields, config\.passphrase\)\)/);
  assert.match(itn, /validateWithPayfast\(rawPayload, config\.validateUrl\)/);
  assert.match(itn, /paidCents !== Number\(payment!\.amount_cents\)/);
  assert.match(itn, /grant_customer_payment_entitlement/);
  assert.match(itn, /grant_provider_payment_entitlement/);
});
