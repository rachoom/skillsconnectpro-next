import assert from 'node:assert/strict';
import test from 'node:test';

import { normaliseSupabaseProjectUrl } from '../services/supabase/config.ts';

test('normaliseSupabaseProjectUrl removes copied Supabase API paths', () => {
  const origin = 'https://example-project.supabase.co';

  assert.equal(normaliseSupabaseProjectUrl(`${origin}/rest/v1/`), origin);
  assert.equal(normaliseSupabaseProjectUrl(`${origin}/auth/v1`), origin);
  assert.equal(normaliseSupabaseProjectUrl(`${origin}/storage/v1/`), origin);
});

test('normaliseSupabaseProjectUrl keeps a valid project origin unchanged', () => {
  assert.equal(
    normaliseSupabaseProjectUrl('https://example-project.supabase.co/'),
    'https://example-project.supabase.co',
  );
});

test('normaliseSupabaseProjectUrl rejects insecure remote URLs', () => {
  assert.throws(
    () => normaliseSupabaseProjectUrl('http://example-project.supabase.co/rest/v1'),
    /must use HTTPS/,
  );
});
