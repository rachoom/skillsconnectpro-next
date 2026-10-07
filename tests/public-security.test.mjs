import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHmac } from 'node:crypto';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function loadSource(path, overrides = {}, env = {}) {
  const code = ts.transpileModule(fs.readFileSync(new URL(path, import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  vm.runInNewContext(code, {
    module: loaded, exports: loaded.exports, Buffer, URL, console,
    process: { env }, require: name => overrides[name] || require(name),
  });
  return loaded.exports;
}
const request = body => new Request('https://site.example/api/test', {
  method: 'POST', body, headers: { 'Content-Type': 'application/json' },
});

test('JSON guard rejects malformed, array and null payloads before processing', async () => {
  const guard = loadSource('../services/publicRequestGuard.ts', { './supabaseAdmin': {} });
  for (const body of ['{', '[]', 'null']) {
    await assert.rejects(guard.readBoundedJson(request(body)), error => error.status === 400);
  }
});
test('JSON guard bounds actual bytes without relying on Content-Length', async () => {
  const guard = loadSource('../services/publicRequestGuard.ts', { './supabaseAdmin': {} });
  await assert.rejects(guard.readBoundedJson(request('{"x":"' + 'x'.repeat(100) + '"}'), 30), error => error.status === 413);
  assert.equal((await guard.readBoundedJson(request('{"ok":true}'))).ok, true);
});
test('cross-origin requests are denied without using the database', async () => {
  const guard = loadSource('../services/publicRequestGuard.ts', { './supabaseAdmin': {} });
  const response = await guard.enforcePublicRequestLimit(new Request('https://site.example/api/test', {
    headers: { Origin: 'https://attacker.example' },
  }), 'ai', 20);
  assert.equal(response.status, 403);
});
test('request limits hash client addresses, allow valid requests and return 429 with retry advice', async () => {
  let allowed = true, args;
  const guard = loadSource('../services/publicRequestGuard.ts', {
    './supabaseAdmin': { getSupabaseAdmin: () => ({ rpc: async (_, input) => {
      args = input; return { data: allowed, error: null };
    } }) },
  }, { SUPABASE_SERVICE_ROLE_KEY: 'test-only-secret' });
  const req = new Request('https://site.example/api/test', { headers: { 'x-vercel-forwarded-for': '192.0.2.7' } });
  assert.equal(await guard.enforcePublicRequestLimit(req, 'ai', 2), null);
  assert.match(args.p_key_hash, /^[a-f0-9]{64}$/);
  assert.equal(args.p_key_hash.includes('192.0.2.7'), false);
  allowed = false;
  const response = await guard.enforcePublicRequestLimit(req, 'ai', 2);
  assert.equal(response.status, 429);
  assert.equal(response.headers.get('Retry-After'), '3600');
});
test('rate-limit storage failure fails closed without exposing a database error', async () => {
  const guard = loadSource('../services/publicRequestGuard.ts', {
    './supabaseAdmin': { getSupabaseAdmin: () => ({ rpc: async () => ({ data: null, error: new Error('private database detail') }) }) },
  }, { SUPABASE_SERVICE_ROLE_KEY: 'test-only-secret' });
  const response = await guard.enforcePublicRequestLimit(request('{}'), 'ai', 2);
  assert.equal(response.status, 503);
  assert.equal((await response.text()).includes('private database detail'), false);
});

test('WhatsApp webhook rejects missing signatures and signed malformed JSON', async () => {
  const route = loadSource('../app/api/webhooks/whatsapp/route.ts', { '@/services/supabaseAdmin': {} }, {
    META_WHATSAPP_APP_SECRET: 'webhook-test-secret',
  });
  assert.equal((await route.POST(request('{}'))).status, 401);
  const body = '{';
  const signed = new Request('https://site.example/api/webhooks/whatsapp', {
    method: 'POST', body, headers: { 'x-hub-signature-256': 'sha256=' + createHmac('sha256', 'webhook-test-secret').update(body).digest('hex') },
  });
  assert.equal((await route.POST(signed)).status, 400);
});
test('late WhatsApp delivery receipts preserve an accepted provider invitation', async () => {
  const invitation = { status: 'accepted' };
  const route = loadSource('../app/api/webhooks/whatsapp/route.ts', {
    '@/services/supabaseAdmin': { getSupabaseAdmin: () => ({ from: table => ({
      update: update => ({ eq: () => ({ in: async (_, statuses) => {
        if (table === 'lead_invitations' && statuses.includes(invitation.status)) Object.assign(invitation, update);
      } }) }),
    }) }) },
  }, { META_WHATSAPP_APP_SECRET: 'webhook-test-secret' });
  for (const status of ['sent', 'delivered', 'read', 'failed']) {
    const body = JSON.stringify({ entry: [{ changes: [{ value: { statuses: [{ id: 'test-message', status }] } }] }] });
    const signed = new Request('https://site.example/api/webhooks/whatsapp', {
      method: 'POST', body, headers: { 'x-hub-signature-256': 'sha256=' + createHmac('sha256', 'webhook-test-secret').update(body).digest('hex') },
    });
    assert.equal((await route.POST(signed)).status, 200);
    assert.equal(invitation.status, 'accepted');
  }
});

test('scheduler requires a bearer credential and verifies the stored hash', async () => {
  const tokens = loadSource('../services/marketplace/tokens.ts');
  let queried = false;
  const auth = loadSource('../services/marketplace/cronAuth.ts', {
    './tokens': tokens,
    '../supabaseAdmin': { getSupabaseAdmin: () => ({ from: () => {
      queried = true;
      const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data: null, error: null }) };
      return query;
    } }) },
  }, { CRON_SECRET: 'test-only-long-scheduler-credential' });
  assert.equal(await auth.isCronAuthorised(new Request('https://site.example')), false);
  assert.equal(queried, false);
  assert.equal(await auth.isCronAuthorised(new Request('https://site.example', {
    headers: { Authorization: 'Bearer test-only-long-scheduler-credential' },
  })), true);
  assert.equal(queried, false);
  assert.equal(await auth.isCronAuthorised(new Request('https://site.example', {
    headers: { Authorization: 'Bearer wrong-test-only-long-credential' },
  })), false);
  assert.equal(queried, true);
});

function controlledTestRoute(authorised, configured = true, blocked = null) {
  let sentTo = null;
  const route = loadSource('../app/api/admin/whatsapp/test/route.ts', {
    '@/services/supabaseAdmin': { getSupabaseAdmin: () => ({ from: () => {
      const query = { insert: () => query, select: () => query, single: async () => ({ data: { id: 'test-ledger-id' }, error: null }),
        update: () => query, eq: async () => ({ error: null }) };
      return query;
    } }) },
    '@/services/marketplace/adminAuth': { requireMarketplaceAdmin: () => { if (!authorised) throw new Error('Denied'); } },
    '@/services/marketplace/cronAuth': { isCronAuthorised: async () => false },
    '@/services/marketplace/whatsappPolicy.js': { normaliseWhatsAppRecipient: value => value || '', isPlausibleWhatsAppRecipient: value => value === 'approved-test-recipient' },
    '@/services/marketplace/whatsappReadiness': { getWhatsAppAutomationReadiness: () => ({ provider: { configured: true, templateName: 'test-template', templateLanguage: 'en' } }) },
    '@/services/marketplace/metaWhatsApp': {
      getMetaWhatsAppConfiguration: () => ({}), publicMarketplaceUrl: () => 'https://site.example', bodyComponent: values => values,
      sendMetaWhatsAppTemplate: async input => { sentTo = input.to; return { status: 'sent', externalMessageId: 'test-message' }; },
    },
    '@/services/publicRequestGuard': { enforcePublicRequestLimit: async () => blocked },
  }, configured ? { MARKETPLACE_CONTROLLED_TEST_WHATSAPP_NUMBER: 'approved-test-recipient' } : {});
  return { route, sentTo: () => sentTo };
}
test('controlled delivery test requires authentication and explicit recipient configuration', async () => {
  const denied = controlledTestRoute(false);
  assert.equal((await denied.route.POST(request('{}'))).status, 401);
  assert.equal(denied.sentTo(), null);
  const unconfigured = controlledTestRoute(true, false);
  assert.equal((await unconfigured.route.POST(request('{}'))).status, 503);
  assert.equal(unconfigured.sentTo(), null);
});
test('controlled test ignores caller-supplied recipients and sends only to the configured recipient', async () => {
  const configured = controlledTestRoute(true);
  assert.equal((await configured.route.POST(request('{"recipient":"attacker-recipient"}'))).status, 200);
  assert.equal(configured.sentTo(), 'approved-test-recipient');
});
test('controlled delivery rate cap blocks repeated sends', async () => {
  const configured = controlledTestRoute(true, true, new Response('{}', { status: 429 }));
  assert.equal((await configured.route.POST(request('{}'))).status, 429);
  assert.equal(configured.sentTo(), null);
});
