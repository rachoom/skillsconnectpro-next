import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('signed-in dashboard access checks project owner instead of trusting the URL marker', () => {
  const source = read('services/marketplace/projects.ts');
  assert.match(source, /ACCOUNT_CUSTOMER_ACCESS_TOKEN = 'account-session'/);
  assert.match(source, /getAuthenticatedAccount\(\)/);
  assert.match(source, /if \(!user\) return null/);
  assert.match(source, /\.eq\('id', projectId\)/);
  assert.match(source, /\.eq\('customer_id', user\.id\)/);
  assert.match(source, /hashOpaqueToken\(accessToken\)/, 'Existing secure guest links must continue to work');
});

test('contact release does not bypass the atomic RPC or expose the guest bearer token', () => {
  const source = read('services/marketplace/matches.ts');
  assert.match(source, /getProjectByAccessToken\(input\.projectId, input\.projectAccessToken\)/);
  assert.match(source, /input\.projectAccessToken === ACCOUNT_CUSTOMER_ACCESS_TOKEN/);
  assert.match(source, /\.eq\('customer_id', project\.customerId\)/);
  assert.match(source, /p_customer_access_token_hash: verifiedTokenHash/);
  assert.doesNotMatch(source, /p_customer_access_token_hash: input\.projectAccessToken/);
});

test('saved projects provide separate dashboard and planning links only to their owners', () => {
  const list = read('app/my-projects/page.tsx');
  const detail = read('app/my-projects/[id]/page.tsx');
  for (const source of [list, detail]) {
    assert.match(source, /project\.customer_id === user\.id/);
    assert.match(source, /\/project\/\$\{project\.id\}\?token=account-session/);
    assert.match(source, /Open Customer Dashboard/);
  }
  assert.match(list, /\/my-projects\/\$\{project\.id\}/);
  assert.match(detail, /<ProjectWorkspace/);
});
