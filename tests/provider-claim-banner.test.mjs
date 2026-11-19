import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../app/api/provider-claim/[token]/route.ts', import.meta.url), 'utf8');
const { outputText } = ts.transpileModule(source, { compilerOptions: {
  module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
} });

async function submit({ file, reset = false, status = 'sent', failUpdate = false } = {}) {
  const state = { uploads: [], removed: [] };
  const bucket = {
    async upload(path) { state.uploads.push(path); return {}; },
    getPublicUrl(path) { return { data: { publicUrl: 'https://storage.example/' + path } }; },
    async remove(paths) { state.removed.push(...paths); },
  };
  const db = {
    storage: { from: () => bucket },
    from(table) {
      const query = {
        select() { return query; },
        eq() { return query; },
        async single() { return { data: { id: 7, portfolio_urls: [] } }; },
        async maybeSingle() { return { data: { id: 11, artisan_id: 7, status, expires_at: new Date(Date.now() + 60000).toISOString() } }; },
        update(values) {
          if (table === 'artisans') state.update = values;
          return { eq: async () => ({ error: table === 'artisans' && failUpdate ? new Error('Save failed') : null }) };
        },
      };
      return query;
    },
  };
  const module = { exports: {} };
  vm.runInNewContext(outputText, { module, exports: module.exports, Buffer, File, console: { error() {} },
    require(name) {
      if (name === '@/services/supabaseAdmin') return { getSupabaseAdmin: () => db };
      if (name === 'next/server') return { NextResponse: Response };
      return require(name);
    },
  });
  const form = new FormData();
  form.set('agreed', 'true');
  if (file) form.set('banner', file);
  if (reset) form.set('resetBanner', 'true');
  const request = new Request('https://example.test/', { method: 'POST', body: form });
  state.response = await module.exports.POST(request, { params: Promise.resolve({ token: 'fixture' }) });
  return state;
}

const jpeg = new File([new Uint8Array([255,216,255,224,255,217])], 'sample.jpg', { type: 'image/jpeg' });

test('claim stores banner on the invited profile independently of its avatar and portfolio', async () => {
  const state = await submit({ file: jpeg });
  assert.equal(state.response.status, 200);
  assert.match(state.uploads[0], /^claims\/7\/banner-[\w-]+\.jpg$/);
  assert.equal(state.update.banner_url, 'https://storage.example/' + state.uploads[0]);
  assert.equal(state.update.portfolio_urls.length, 0);
  assert.equal(state.update.image_url, null);
});

test('skipping the banner preserves it, and requesting the default clears it', async () => {
  const skipped = await submit();
  assert.equal(skipped.response.status, 200);
  assert.equal('banner_url' in skipped.update, false);
  const reset = await submit({ reset: true });
  assert.equal(reset.update.banner_url, null);
});

test('invalid file and closed invitation reject the banner before storage', async () => {
  const invalid = await submit({ file: new File(['invalid'], 'bad.jpg', { type: 'image/jpeg' }) });
  const closed = await submit({ file: jpeg, status: 'claimed' });
  assert.equal(invalid.response.status, 400);
  assert.equal(closed.response.status, 404);
  assert.equal(invalid.uploads.length + closed.uploads.length, 0);
});

test('failed profile save removes its new banner', async () => {
  const state = await submit({ file: jpeg, failUpdate: true });
  assert.equal(state.response.status, 500);
  assert.deepEqual(state.removed, state.uploads);
});
