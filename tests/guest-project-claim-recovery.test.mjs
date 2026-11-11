import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');

test('existing session uses authenticated server claim rather than inaccessible SQL RPC', () => {
  const signin = read('app/sign-in/sign-in-card.tsx');
  assert.match(signin, /fetch\('\/api\/projects\/claim'/);
  assert.doesNotMatch(signin, /supabase\.rpc\('claim_guest_project'/);
});

test('auth callback claims after user identity is verified and never accepts requested user ID', () => {
  const callback = read('app/auth/callback/route.ts');
  assert.match(callback, /supabase\.auth\.exchangeCodeForSession\(code\)/);
  assert.match(callback, /supabase\.auth\.getUser\(\)/);
  assert.match(callback, /claimGuestProjectForUser\(/);
  assert.match(callback, /userId: identity\.user\.id/);
  assert.doesNotMatch(callback, /supabase\.rpc\('claim_guest_project'/);
});

test('project claim endpoint requires same-origin authenticated access and original private token', () => {
  const api = read('app/api/projects/claim/route.ts');
  assert.match(api, /request\.headers\.get\('origin'\)/);
  assert.match(api, /getAuthenticatedAccount\(\)/);
  assert.match(api, /enforcePublicRequestLimit/);
  assert.match(api, /claimGuestProjectForUser\(/);
  assert.match(api, /userId: user\.id/);
  assert.match(api, /token === 'account-session'/);
  const helper = read('services/projectClaim.ts');
  assert.match(helper, /claim_guest_project_as_service/);
});

test('an unclaimed visible project offers verified recovery, not fake dashboard access', () => {
  const list = read('app/my-projects/page.tsx');
  const detail = read('app/my-projects/[id]/page.tsx');
  assert.match(list, /!project\.customer_id/);
  assert.match(detail, /!project\.customer_id/);
  assert.match(list, /Connect Customer Dashboard/);
  assert.match(detail, /Connect Customer Dashboard/);
  const recovery = read('app/my-projects/connect/connect-project-form.tsx');
  assert.match(recovery, /private customer dashboard link/i);
  assert.match(recovery, /'\/api\/projects\/claim'/);
  assert.match(recovery, /token=account-session/);
});
