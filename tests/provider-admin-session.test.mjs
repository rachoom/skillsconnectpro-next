import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import ts from 'typescript';

const require = createRequire(import.meta.url);
function sessions() {
  const records = new Map();
  let fail = false;
  const env = { PROVIDER_ADMIN_PASSWORD_SHA256: createHash('sha256').update('test-only-password').digest('hex') };
  const storage = { from: () => {
    const filters = [];
    let update;
    const query = {
      insert: async row => { if (fail) return { error: {} }; records.set(row.token_hash, { ...row, revoked_at: null }); return { error: null }; },
      select: () => query,
      update: value => { update = value; return query; },
      eq: (key, value) => { filters.push(row => row[key] === value); return query; },
      is: (key, value) => { filters.push(row => row[key] === value); return query; },
      gt: (key, value) => { filters.push(row => row[key] > value); return query; },
      maybeSingle: async () => ({ error: fail ? {} : null, data: fail ? null : [...records.values()].find(row => filters.every(filter => filter(row))) }),
      then: resolve => { if (!fail) for (const row of records.values()) if (filters.every(filter => filter(row))) Object.assign(row, update); resolve({ error: fail ? {} : null }); },
    };
    return query;
  } };
  const source = ts.transpileModule(fs.readFileSync(new URL('../services/providerAdminSession.ts', import.meta.url), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInNewContext(source, { module, exports: module.exports, Buffer, Date, process: { env },
    require: name => name === './supabaseAdmin' ? { getSupabaseAdmin: () => storage } : require(name) });
  return { api: module.exports, records, env, failStorage: () => { fail = true; } };
}
const request = token => new Request('https://site.example/api/provider-admin/dashboard', { headers: { cookie: `scp_provider_admin=${token}` } });

test('admin sessions are unique and only a hash of the opaque token is stored', async () => {
  const { api, records } = sessions();
  const first = await api.providerAdminSessionToken();
  const second = await api.providerAdminSessionToken();
  assert.notEqual(first, second);
  assert.match(first, /^[a-f0-9]{64}$/);
  assert.equal(records.has(first), false);
  assert.equal(records.has(createHash('sha256').update(first).digest('hex')), true);
  assert.equal(await api.isProviderAdminRequest(request(first)), true);
});
test('server enforces session expiry even if the browser retains its cookie', async () => {
  const { api, records } = sessions();
  const token = await api.providerAdminSessionToken();
  [...records.values()][0].expires_at = new Date(Date.now() - 1000).toISOString();
  assert.equal(await api.isProviderAdminRequest(request(token)), false);
  await assert.rejects(api.requireProviderAdmin(request(token)), error => error.name === 'UnauthorisedError');
});
test('logout revokes replay of that cookie and keeps other sessions valid', async () => {
  const { api } = sessions();
  const first = await api.providerAdminSessionToken();
  const second = await api.providerAdminSessionToken();
  await api.revokeProviderAdminSession(request(first));
  assert.equal(await api.isProviderAdminRequest(request(first)), false);
  assert.equal(await api.isProviderAdminRequest(request(second)), true);
});
test('password rotation invalidates previously issued admin sessions', async () => {
  const { api, env } = sessions();
  const token = await api.providerAdminSessionToken();
  assert.equal(api.verifyProviderAdminPassword('test-only-password'), true);
  env.PROVIDER_ADMIN_PASSWORD_SHA256 = createHash('sha256').update('replacement-password').digest('hex');
  assert.equal(await api.isProviderAdminRequest(request(token)), false);
});
test('malformed cookies and unknown tokens are rejected; storage failure fails closed', async () => {
  const context = sessions();
  assert.equal(await context.api.isProviderAdminRequest(request('%invalid')), false);
  assert.equal(await context.api.isProviderAdminRequest(request('a'.repeat(64))), false);
  const token = await context.api.providerAdminSessionToken();
  context.failStorage();
  await assert.rejects(context.api.isProviderAdminRequest(request(token)));
  await assert.rejects(context.api.providerAdminSessionToken());
  await assert.rejects(context.api.revokeProviderAdminSession(request(token)));
});
