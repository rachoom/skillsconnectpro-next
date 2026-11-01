import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const require = createRequire(import.meta.url);
class PublicRequestError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
function load(path, overrides) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, Buffer, console, process,
    require: name => overrides[name] ?? require(name) });
  return module.exports;
}
function photoGuard({ user = { id: 'signed-in-account' }, result, error = null } = {}) {
  const calls = [];
  const guard = load('../services/customerPlanUsage.ts', {
    './supabase/server': { getAuthenticatedAccount: async () => ({ user }) },
    './publicRequestGuard': { PublicRequestError },
    './supabaseAdmin': { getSupabaseAdmin: () => ({ rpc: async (name, input) => {
      calls.push({ name, input });
      return { data: result ?? (name === 'finish_customer_photo_image' ? true : {
        allowed: true, plan_code: 'basic_30', reservation_id: 'reservation-1',
      }), error };
    } }) },
  });
  return { guard, calls };
}

test('photo identity hashes decoded bytes consistently across data URLs and whitespace', async () => {
  const { guard, calls } = photoGuard();
  for (const image of ['aGVsbG8=', 'data:image/png;base64,aGVs\nbG8=']) {
    const access = await guard.reserveCustomerPhotoImage(image);
    assert.equal(access.allowed, true);
    assert.equal(access.reservation.userId, 'signed-in-account');
  }
  const hash = createHash('sha256').update('hello').digest('hex');
  assert.deepEqual(calls.map(call => call.input.p_image_hash), [hash, hash]);
  assert.equal(calls[0].input.p_user_id, 'signed-in-account');
});
test('invalid image input is rejected before touching allowance storage', async () => {
  const { guard, calls } = photoGuard();
  for (const input of ['@@@', 'data:image/png;base64,', 'a']) {
    await assert.rejects(guard.reserveCustomerPhotoImage(input), error => error.status === 400);
  }
  assert.equal(calls.length, 0);
});
test('duplicate completed images do not create a second reservation', async () => {
  const { guard, calls } = photoGuard({ result: { allowed: true, plan_code: 'basic_30' } });
  const access = await guard.reserveCustomerPhotoImage('aGVsbG8=');
  assert.equal(access.reservation, null);
  await guard.settleCustomerPhotoAssessment(access.reservation);
  assert.equal(calls.length, 1);
});
test('photo storage failure blocks analysis without exposing private database errors', async () => {
  const { guard } = photoGuard({ error: new Error('private database detail') });
  await assert.rejects(guard.reserveCustomerPhotoImage('aGVsbG8='), error =>
    error.status === 503 && !error.message.includes('private database detail'));
});
test('in-flight photos and exhausted allowances return distinct retry and upgrade responses', async () => {
  for (const [reason, status, code] of [
    ['processing', 409, 'PHOTO_ANALYSIS_PROCESSING'], ['limit', 403, 'PHOTO_ANALYSIS_LIMIT'],
  ]) {
    const { guard } = photoGuard({ result: { allowed: false, reason, plan_code: 'free' } });
    const access = await guard.reserveCustomerPhotoImage('aGVsbG8=');
    assert.equal(access.allowed, false);
    assert.equal(access.response.status, status);
    assert.equal((await access.response.json()).code, code);
  }
});
test('photo settlement is idempotent and rejects an expired or missing reservation', async () => {
  const { guard, calls } = photoGuard();
  const { reservation } = await guard.reserveCustomerPhotoImage('aGVsbG8=');
  await guard.settleCustomerPhotoAssessment(reservation);
  await guard.settleCustomerPhotoAssessment(reservation);
  assert.equal(calls.length, 2);
  assert.equal(calls[1].input.p_success, true);
  const rejected = photoGuard({ result: false });
  const expired = { userId: 'signed-in-account', id: 'expired', settled: false };
  await assert.rejects(rejected.guard.settleCustomerPhotoAssessment(expired), error => error.status === 503);
  assert.equal(expired.settled, false);
});
test('anonymous previews and text-only requests do not debit a signed-in photo account', async () => {
  const { guard, calls } = photoGuard({ user: null });
  assert.equal((await guard.reserveCustomerPhotoImage('aGVsbG8=')).planCode, null);
  assert.equal((await guard.reserveCustomerPhotoImage('')).reservation, null);
  assert.equal(calls.length, 0);
});

test('verified paid photo plans retain finite headroom in both image workflows', () => {
  const guard = load('../services/aiUsageGuard.ts', { './supabaseAdmin': {} });
  for (const profile of [guard.customerProjectUsage, guard.quickIntentUsage]) {
    assert.equal(profile(true).imageLimit, 1);
    assert.equal(profile(true, 'unrecognized').imageLimit, 1);
    assert.ok(profile(true, 'basic_30').imageLimit >= 2);
    assert.ok(profile(true, 'project_pass_90').imageLimit >= 5);
    assert.ok(profile(true, 'project_pass_90').imageLimit <= 30);
  }
});

function checkout({ signedIn = true, linked = 7 } = {}) {
  let selectedProvider;
  let inserted;
  const roleQuery = { select: () => roleQuery, eq: () => roleQuery,
    maybeSingle: async () => ({ data: linked ? { linked_artisan_id: linked } : null, error: null }) };
  const providerQuery = { select: () => providerQuery, eq: (_, id) => { selectedProvider = id; return providerQuery; },
    maybeSingle: async () => ({ data: { id: selectedProvider, first_name: 'Test', last_name: 'Artisan', email: 'test@example.com' }, error: null }) };
  const route = load('../app/api/payments/payfast/checkout/route.ts', {
    '@/services/supabase/server': { getAuthenticatedAccount: async () => ({
      user: signedIn ? { id: 'signed-in-account' } : null, supabase: { from: () => roleQuery },
    }) },
    '@/app/provider-plans/planCatalog': { getProviderPlan: () => ({ code: 'lead_pack_4', name: 'Test pack', price: 'R29', kind: 'pack' }) },
    '@/services/publicRequestGuard': { enforcePublicRequestLimit: async () => null,
      readBoundedJson: request => request.json(), publicRequestError: () => null },
    '@/services/supabaseAdmin': { getSupabaseAdmin: () => ({ from: table => table === 'artisans'
      ? providerQuery : { insert: async value => { inserted = value; return { error: null }; } } }) },
    '@/services/payments/payfast': { getPayfastConfig: () => ({ processUrl: 'https://sandbox.example', mode: 'sandbox' }),
      normalisePayfastFields: value => value, payfastNotificationUrl: () => 'https://site.example/itn', payfastSignature: () => 'test-signature' },
  });
  return { route, selected: () => selectedProvider, inserted: () => inserted };
}
const purchase = () => new Request('https://site.example/api/payments/payfast/checkout', {
  method: 'POST', body: JSON.stringify({ plan: 'lead-pack-4', providerId: 999, providerIdentity: 'victim@example.com' }),
});
test('provider checkout ignores forged provider identity and charges only the linked artisan', async () => {
  const context = checkout();
  const response = await context.route.POST(purchase());
  assert.equal(response.status, 200);
  assert.equal(context.selected(), 7);
  assert.equal(context.inserted().provider_id, 7);
  assert.equal((await response.json()).fields.custom_str1, '7');
});
test('anonymous and unlinked checkout attempts cannot look up a provider or create a payment', async () => {
  for (const [options, status] of [[{ signedIn: false }, 401], [{ linked: null }, 403]]) {
    const context = checkout(options);
    assert.equal((await context.route.POST(purchase())).status, status);
    assert.equal(context.selected(), undefined);
    assert.equal(context.inserted(), undefined);
  }
});

test('workspace access distinguishes owners, collaborators, viewers and inaccessible projects', async () => {
  for (const [owner, memberRole, visible, permission, allowed] of [
    [true, null, true, 'write', true],
    [false, 'collaborator', true, 'write', true],
    [false, 'viewer', true, 'read', true],
    [false, 'viewer', true, 'write', false],
    [false, 'collaborator', false, 'read', false],
  ]) {
    const account = { id: 'current-user' };
    const supabase = { from: table => {
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ error: null,
        data: table === 'projects' ? (visible ? { id: 'project-id', customer_id: owner ? account.id : 'other-user' } : null)
          : { member_role: memberRole } }) };
      return query;
    } };
    const access = load('../services/projectWorkspaceAccess.ts', {
      'server-only': {},
      '@/services/supabase/server': { getAuthenticatedAccount: async () => ({ user: account, supabase }) },
      '@/services/supabaseAdmin': { getSupabaseAdmin: () => ({}) },
    });
    const result = await access.requireProjectWorkspaceAccess('project-id', permission);
    assert.equal(result.ok, allowed, `${owner}/${memberRole}/${visible}/${permission}`);
    if (result.ok) assert.equal(result.isOwner, owner);
  }
});
