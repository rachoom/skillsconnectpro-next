import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function loadItN(validationResponse = 'VALID') {
  const source = fs.readFileSync(new URL('../app/api/payments/payfast/itn/route.ts', import.meta.url), 'utf8');
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const calls = [];
  class NextResponse {
    constructor(body, opts = {}) {
      this.body = body;
      this.status = opts.status ?? 200;
    }
  }
  const lib = {
    getPayfastConfig: () => ({
      merchantId: 'sandbox-merchant',
      passphrase: 'not-sent-in-validation',
      validateUrl: 'https://sandbox.payfast.co.za/eng/query/validate',
    }),
    payfastSignature: () => 'expected-signature',
    secureEqualHex: (signature, expected) => signature === expected,
    payfastParamString: fields => new URLSearchParams(fields).toString(),
  };
  const requireStub = name => {
    if (name === 'next/server') return { NextResponse };
    if (name === '@/services/payments/payfast') return lib;
    if (name === '@/services/supabaseAdmin') return {
      getSupabaseAdmin: () => { throw new Error('An unverified notification must not touch the database'); },
    };
    throw new Error('Unexpected dependency ' + name);
  };
  const context = {
    module: { exports: {} }, exports: {}, require: requireStub,
    console, Date, Promise, URLSearchParams, AbortSignal, process,
    fetch: async (url, opts) => {
      calls.push({ url, ...opts });
      return { ok: true, text: async () => validationResponse };
    },
  };
  context.exports = context.module.exports;
  vm.runInNewContext(code, context, { filename: 'payfast-itn.ts' });
  return { POST: context.module.exports.POST, calls };
}

test('valid ITN sends ordered parameters WITHOUT signature to Payfast validation', async () => {
  const { POST, calls } = loadItN();
  const raw = 'merchant_id=sandbox-merchant&amount_gross=99.00&payment_status=PENDING&pf_payment_id=1234&signature=expected-signature';
  const response = await POST({ text: async () => raw });
  assert.equal(response.status, 200);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, 'https://sandbox.payfast.co.za/eng/query/validate');
  assert.equal(calls[0].method, 'POST');
  assert.equal(calls[0].body, 'merchant_id=sandbox-merchant&amount_gross=99.00&payment_status=PENDING&pf_payment_id=1234');
  assert.equal(calls[0].body.includes('signature'), false);
  assert.equal(calls[0].body.includes('not-sent-in-validation'), false);
  assert.equal(calls[0].redirect, 'error');
  assert.ok(calls[0].signal);
});

test('ITN is rejected when Payfast remote validation fails', async () => {
  const { POST } = loadItN('INVALID');
  const raw = 'merchant_id=sandbox-merchant&payment_status=PENDING&signature=expected-signature';
  const response = await POST({ text: async () => raw });
  assert.equal(response.status, 400);
  assert.match(response.body, /Payment validation failed/);
});

test('ITN rejects tampered signature before remote validation', async () => {
  const { POST, calls } = loadItN();
  const raw = 'merchant_id=sandbox-merchant&payment_status=PENDING&signature=forged-signature';
  const response = await POST({ text: async () => raw });
  assert.equal(response.status, 400);
  assert.equal(calls.length, 0);
});

test('ITN rejects oversized posts before signature or database checks', async () => {
  const { POST, calls } = loadItN();
  const response = await POST({ text: async () => 'x'.repeat(12_001) });
  assert.equal(response.status, 413);
  assert.equal(calls.length, 0);
});

test('Preview sandbox readiness exposes only booleans and no bypass credentials', () => {
  const source = fs.readFileSync(new URL('../app/api/provider-billing/sandbox-ping/route.ts', import.meta.url), 'utf8');
  assert.match(source, /callbackConfigured/);
  assert.match(source, /VERCEL_ENV !== 'preview'/);
  assert.match(source, /payfastNotificationUrl\(baseUrl, 'sandbox'\)/);
  assert.doesNotMatch(source, /return NextResponse\.json\(\{[^}]*secret/);
});
