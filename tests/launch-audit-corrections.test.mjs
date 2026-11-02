import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function load(path, overrides = {}) {
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(source, { module, exports: module.exports, console, Date, Set, URL, setTimeout, clearTimeout,
    require: name => { if (name in overrides) return overrides[name]; throw new Error('Unexpected dependency: ' + name); } });
  return module.exports;
}
const ref = '12345678-1234-4234-8234-123456789abc';
const NextResponse = { json: (body, options = {}) => ({ body, status: options.status ?? 200, headers: options.headers }) };
function database(resolve) {
  const calls = [];
  return { calls, from(table) {
    const state = { table, filters: {}, operation: 'select' }; calls.push(state);
    const chain = {
      select() { return chain; }, eq(key, value) { state.filters[key] = value; return chain; },
      in() { return chain; }, lte() { return chain; }, or() { return chain; }, limit() { return chain; }, order() { return chain; },
      update(value) { state.operation = 'update'; state.value = value; return chain; },
      insert(value) { state.operation = 'insert'; state.value = value; return chain; },
      maybeSingle() { return Promise.resolve(resolve(state)); }, single() { return Promise.resolve(resolve(state)); },
      then(success, failure) { return Promise.resolve(resolve(state)).then(success, failure); },
    }; return chain;
  } };
}
function statusRoute(kind, { user = { id: 'owner' }, payment = true, grant = false, event = false, active = true } = {}) {
  const db = database(({ table, filters }) => {
    if (table === 'account_roles') return { data: { linked_artisan_id: 7 } };
    if (table === 'customer_payment_transactions') {
      assert.equal(filters.user_id, 'owner');
      return { data: payment ? { processor_status: 'COMPLETE' } : null };
    }
    if (table === 'payment_transactions') {
      assert.equal(filters.provider_id, 7);
      return { data: payment ? { provider_id: 7, processor_status: 'COMPLETE', plan_code: 'starter_monthly', plan_kind: 'subscription' } : null };
    }
    if (table === 'account_subscriptions') {
      assert.equal(filters.payment_reference, ref);
      return { data: grant ? { status: active ? 'active' : 'expired', starts_at: '2020-01-01', ends_at: active ? '2099-01-01' : '2020-02-01' } : null };
    }
    if (table === 'payment_events') return { data: event ? { payfast_payment_id: 'verified-event' } : null };
    if (table === 'subscription_entitlements') return { data: active ? { id: 'entitlement' } : null };
    throw new Error('Unexpected table ' + table);
  });
  const route = load('../app/api/payments/payfast/' + kind + '-status/route.ts', {
    'next/server': { NextResponse }, '@/services/supabase/server': { getAuthenticatedAccount: async () => ({ user, supabase: db }) },
    '@/services/supabaseAdmin': { getSupabaseAdmin: () => db },
    '@/services/publicRequestGuard': { enforcePublicRequestLimit: async () => null },
    '@/app/provider-plans/planCatalog': { providerPlans: [] },
  });
  return { db, get: () => route.GET(new Request('https://example.com/api?payment=' + ref)) };
}
for (const kind of ['customer', 'provider']) {
  test(kind + ' payment status rejects signed-out requests without touching payment tables', async () => {
    const { db, get } = statusRoute(kind, { user: null });
    assert.equal((await get()).status, 401); assert.equal(db.calls.length, 0);
  });
  test(kind + ' payment lookup scopes records to the signed-in owner', async () => {
    const result = await statusRoute(kind, { payment: false }).get();
    assert.equal(result.status, 404); assert.match(result.headers['Cache-Control'], /no-store/);
  });
  test(kind + ' COMPLETE without an applied grant remains pending', async () => {
    const result = await statusRoute(kind).get();
    assert.equal(result.body.status, 'processing'); assert.equal(result.body.verified, false);
  });
  test(kind + ' verified activation confirms the payment', async () => {
    const result = await statusRoute(kind, { grant: true, event: true }).get();
    assert.equal(result.body.status, 'confirmed'); assert.equal(result.body.accessActive, true);
  });
  test(kind + ' historical paid receipt does not claim current active access', async () => {
    const result = await statusRoute(kind, { grant: true, event: true, active: false }).get();
    assert.equal(result.body.status, 'confirmed'); assert.equal(result.body.accessActive, false);
  });
}
function lifecycle() {
  const project = { id: 'project', status: 'provider_selected', title: 'Test', guest_name: 'Customer' };
  const match = { id: 'match', project_id: 'project', provider_id: 7, status: 'selected', contact_released_at: null };
  const db = database(state => {
    if (state.operation === 'update') {
      if (state.table === 'projects') Object.assign(project, state.value);
      if (state.table === 'project_matches') Object.assign(match, state.value);
      return { data: null };
    }
    if (state.table === 'projects') return { data: project };
    if (state.table === 'project_matches') return { data: match };
    if (state.table === 'artisans') return { data: { name: 'Provider' } };
    return { data: null };
  });
  const route = load('../services/marketplace/lifecycle.ts', {
    '../supabaseAdmin': { getSupabaseAdmin: () => db }, './completionPolicy.js': {
      isProviderCompletionReport: () => false, isCustomerCompletionConfirmation: () => false, isSystemAutoCompletion: () => false,
    }, './completionAutomation': { getCompletionGraceHours: () => 24, completionConfirmationDueAt: () => null },
    './projects': { getProjectByAccessToken: async () => ({ ...project, guestName: 'Customer' }) },
    './providerResponses': { getProviderOpportunity: async () => ({ providerId: 7, project, customerContact: { name: 'Customer' } }) },
  });
  return { db, route };
}
test('customer can cancel a selected provider before contact release and closes invitations', async () => {
  const { db, route } = lifecycle();
  const result = await route.updateCustomerLifecycle({ projectId: 'project', accessToken: 'token', action: 'cancel_project' });
  assert.equal(result.projectStatus, 'cancelled'); assert.equal(result.matchStatus, 'cancelled');
  assert.equal(result.contactReleased, false);
  assert.ok(db.calls.some(call => call.table === 'lead_invitations' && call.value?.status === 'cancelled'));
});
test('provider still cannot cancel a customer project before contact release', async () => {
  const { db, route } = lifecycle();
  await assert.rejects(route.updateProviderLifecycle({ token: 'token', action: 'cancel_project' }));
  assert.equal(db.calls.some(call => call.operation === 'update'), false);
});
test('other lifecycle actions remain locked before contact release', async () => {
  const { route } = lifecycle();
  await assert.rejects(route.updateCustomerLifecycle({ projectId: 'project', accessToken: 'token', action: 'start_work' }), /contact details are released/);
});
test('directory normalises legacy and combined trades without losing additional trades', () => {
  const { directoryServiceCategories: categories } = load('../services/directoryServices.ts');
  assert.equal(JSON.stringify(categories('General Contractor, Builder, Electrician, Plumber')), JSON.stringify(['General Contractor', 'Electrical', 'Plumbing']));
  assert.equal(JSON.stringify(categories('Automotive Mechanic, Cleaning Services, Specialist Plumber')), JSON.stringify(['Mechanics', 'Cleaning', 'Plumbing']));
  assert.equal(categories('Glass and Aluminium')[0], 'Glass and Aluminium');
});

test('multi-trade quick request offers electrical and plumbing problems together', () => {
  const { quickRequestIssueOptions } = load('../services/directoryServices.ts');
  const options = quickRequestIssueOptions('General Contractor, Electrician, Plumber');
  assert.ok(options.includes('No power'));
  assert.ok(options.includes('Blocked drain'));
  assert.ok(options.includes('Service or repair'));
  assert.equal(options.length, new Set(options).size);
  assert.ok(quickRequestIssueOptions('Automotive Mechanic').includes('Car will not start'));
});
