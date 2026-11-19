import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function load(path, overrides = {}) {
  const output = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  });
  const module = { exports: {} };
  vm.runInNewContext(output.outputText, {
    module, exports: module.exports, URL, URLSearchParams, Buffer,
    console: { error() {} }, process: { env: {} },
    require: name => Object.hasOwn(overrides, name) ? overrides[name] : require(name),
  });
  return module.exports;
}
function nodes(tree) {
  if (Array.isArray(tree)) return tree.flatMap(nodes);
  if (!tree || typeof tree !== 'object') return [];
  return [tree, ...nodes(tree.props?.children)];
}
function copy(tree) {
  if (Array.isArray(tree)) return tree.map(copy).join(' ');
  if (tree === null || tree === undefined || typeof tree === 'boolean') return '';
  if (typeof tree !== 'object') return String(tree);
  return copy(tree.props?.children);
}
const icons = { ArrowLeft: 'span', CreditCard: 'span', LockKeyhole: 'span', ShieldCheck: 'span', Mail: 'span', CheckCircle2: 'span', Clock3: 'span', XCircle: 'span' };
const user = { id: 'owner-1', email: 'owner@example.test', name: 'Owner' };
const token = 'test-claim-token';
const hash = createHash('sha256').update(token).digest('hex');
function payment(overrides = {}) {
  return { m_payment_id: 'payment-1', user_id: user.id, processor_status: 'COMPLETE',
    payfast_payment_id: 'processor-1', plan_code: 'basic_30', claim_token_hash: null, ...overrides };
}
async function resultPage(row, account, params = {}, options = {}) {
  let grants = 0, claimedUpdate;
  const db = {
    from() {
      const query = { select: () => query, eq: () => query, is: () => query, gt: () => query,
        update(value) { claimedUpdate = value; return query; },
        maybeSingle: async () => ({ data: claimedUpdate ? { ...row, ...claimedUpdate } : row, error: null }) };
      return query;
    },
    rpc: async () => { grants++; return { data: false, error: options.activationError ? { message: 'test outage' } : null }; },
  };
  const page = load('../app/customer-payment-result/page.tsx', {
    'next/link': 'a', 'lucide-react': icons,
    './PaymentStatusCheck': { PaymentStatusCheck: 'payment-status-check' },
    '@/components/CustomerTransactionShell': { CustomerTransactionShell: 'customer-shell' },
    '@/services/supabase/server': { getAuthenticatedAccount: async () => ({ user: account }) },
    '@/services/supabaseAdmin': { getSupabaseAdmin: () => db },
  }).default;
  const tree = await page({ searchParams: Promise.resolve({ payment: 'payment-1', ...params }) });
  return { tree, text: copy(tree), grants, claimedUpdate };
}
test('confirmed owner purchase reconciles activation idempotently on every return', async () => {
  const result = await resultPage(payment(), user);
  assert.equal(result.grants, 1);
  assert.match(result.text, /Your plan is active/);
});
test('activation failure shows pending and retry without asking for another payment', async () => {
  const result = await resultPage(payment(), user, {}, { activationError: true });
  assert.doesNotMatch(result.text, /Your plan is active/);
  assert.match(result.text, /do not need to pay again/);
  assert.match(result.text, /Check payment status/);
});
test('unconfirmed return and arbitrary cancel query cannot grant paid access', async () => {
  const pending = await resultPage(payment({ processor_status: 'INITIATED' }), user);
  assert.equal(pending.grants, 0);
  assert.match(pending.text, /confirmation pending/);
  const confirmed = await resultPage(payment(), user, { cancelled: '1' });
  assert.match(confirmed.text, /Your plan is active/);
  assert.doesNotMatch(confirmed.text, /Payment cancelled/);
});
test('another account cannot inspect or activate an owned payment', async () => {
  const result = await resultPage(payment(), { id: 'other-account' });
  assert.equal(result.grants, 0);
  assert.match(result.text, /could not verify this payment link/);
});
test('guest needs the matching unexpired token to see a purchase', async () => {
  const row = payment({ user_id: null, claim_token_hash: hash, claim_expires_at: new Date(Date.now()+60000).toISOString() });
  for (const claim of [undefined, 'wrong-token']) {
    const result = await resultPage(row, null, { claim });
    assert.match(result.text, /could not verify this payment link/);
    assert.equal(result.grants, 0);
  }
  const valid = await resultPage(row, null, { claim: token });
  assert.match(valid.text, /Secure my access/);
  assert.equal(valid.grants, 0);
  const expired = await resultPage({ ...row, claim_expires_at: new Date(Date.now()-60000).toISOString() }, user, { claim: token });
  assert.equal(expired.claimedUpdate, undefined);
});
test('guest claim consumes token and reconciles a verified complete purchase', async () => {
  const result = await resultPage(payment({ user_id: null, claim_token_hash: hash, claim_expires_at: new Date(Date.now()+60000).toISOString() }), user, { claim: token });
  assert.equal(result.claimedUpdate.user_id, user.id);
  assert.equal(result.claimedUpdate.claim_token_hash, null);
  assert.equal(result.claimedUpdate.claim_expires_at, null);
  assert.equal(result.grants, 1);
  assert.match(result.text, /Your plan is active/);
});
test('optional sign-in preserves either selected plan while guest payment remains visible', async () => {
  for (const code of ['basic_30', 'project_pass_90']) {
    const plan = { code, name: 'Homeowner plan', price_cents: code === 'basic_30' ? 2900 : 7900, duration_days: 30 };
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: plan, error: null }) };
    const page = load('../app/customer-checkout/page.tsx', {
      'next/link': 'a', 'next/navigation': { redirect: () => { throw Error('unexpected redirect'); } }, 'lucide-react': icons,
      '@/services/supabase/server': { getAuthenticatedAccount: async () => ({ user: null }) },
      '@/services/supabaseAdmin': { getSupabaseAdmin: () => ({ from: () => query }) },
      './CustomerCheckoutForm': { CustomerCheckoutForm: 'checkout-form' },
      '@/components/CustomerTransactionShell': { CustomerTransactionShell: 'customer-shell' },
    }).default;
    const tree = await page({ searchParams: Promise.resolve({ plan: code }) });
    const link = nodes(tree).find(n => n.props?.href?.startsWith('/sign-in?'));
    assert.equal(new URL(link.props.href, 'https://site.example').searchParams.get('next'), '/customer-checkout?plan=' + code);
    assert.equal(nodes(tree).find(n => n.type === 'checkout-form').props.planCode, code);
    assert.match(copy(tree), /Sign-in is optional/);
  }
});
test('checkout server chooses amount and identity; guests receive only a hashed claim token in storage', async () => {
  let inserted;
  const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: { code: 'basic_30', name: 'Basic', price_cents: 2900, duration_days: 30 } }), insert: async value => { inserted = value; return { error: null }; } };
  const route = load('../app/api/payments/payfast/customer-checkout/route.ts', {
    'next/server': { NextResponse: Response },
    '@/services/supabase/server': { getAuthenticatedAccount: async () => ({ user: null }) },
    '@/services/publicRequestGuard': { enforcePublicRequestLimit: async () => null, publicRequestError: () => null, readBoundedJson: r => r.json() },
    '@/services/payments/payfast': { getPayfastConfig: () => ({ processUrl: 'https://www.payfast.co.za/eng/process', mode: 'live' }), normalisePayfastFields: f => f, payfastSignature: () => 'test-signature' },
    '@/services/supabaseAdmin': { getSupabaseAdmin: () => ({ from: () => query }) },
  });
  const request = body => new Request('https://www.skillsconnectpro.co.za/api/payments/payfast/customer-checkout', { method: 'POST', headers: { origin: 'https://www.skillsconnectpro.co.za', host: 'www.skillsconnectpro.co.za' }, body: JSON.stringify(body) });
  const response = await route.POST(request({ plan: 'basic_30', amount: '0.01', user_id: 'attacker-selected' }));
  const payload = await response.json();
  assert.equal(response.status, 200);
  assert.equal(payload.fields.amount, '29.00');
  assert.equal(inserted.user_id, null);
  assert.equal(inserted.amount_cents, 2900);
  const claim = new URL(payload.fields.return_url).searchParams.get('claim');
  assert.equal(inserted.claim_token_hash, createHash('sha256').update(claim).digest('hex'));
  assert.equal(JSON.stringify(inserted).includes(claim), false);
  assert.match(response.headers.get('Cache-Control'), /no-store/);
  assert.equal((await route.POST(request({ plan: 'invalid' }))).status, 400);
  const crossOrigin = new Request('https://www.skillsconnectpro.co.za/api/payments/payfast/customer-checkout', { method: 'POST', headers: { origin: 'https://attacker.example', host: 'www.skillsconnectpro.co.za' }, body: '{}' });
  assert.equal((await route.POST(crossOrigin)).status, 403);
});

test('status checks are offered only for authorised purchases still needing confirmation', async () => {
  for (const [status, expected] of [['INITIATED', true], ['COMPLETE', false], ['FAILED', false], ['CANCELLED', false]]) {
    const result = await resultPage(payment({ processor_status: status }), user);
    assert.equal(nodes(result.tree).some(node => node.type === 'payment-status-check'), expected);
  }
  const other = await resultPage(payment({ processor_status: 'INITIATED' }), { id: 'another-user' });
  assert.equal(nodes(other.tree).some(node => node.type === 'payment-status-check'), false);
});
