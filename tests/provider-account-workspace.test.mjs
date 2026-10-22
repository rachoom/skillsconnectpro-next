import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('customer accounts cannot self-activate an artisan role', () => {
  const route = read('../app/api/account/roles/artisan/route.ts');
  assert.doesNotMatch(route, /account_roles'[\s\S]*upsert/);
  assert.match(route, /Provider tools are activated after your service-provider application/);
  assert.match(route, /joinHref: '\/join'/);
});

test('signed-in provider applications retain their auth-user link', () => {
  const route = read('../app/api/onboarding/apply/route.ts');
  assert.match(route, /getAuthenticatedAccount/);
  assert.match(route, /user_id: user\?\.id \?\? null/);
});

test('provider approval links the approved artisan profile back to the account', () => {
  const route = read('../app/api/provider-admin/dashboard/route.ts');
  assert.match(route, /select\('id'\)\.single\(\)/);
  assert.match(route, /linked_artisan_id: artisan\.id/);
  assert.match(route, /role: 'artisan'/);
  assert.match(route, /status: 'active'/);
});

test('My Projects shows provider workspace only for linked artisan roles', () => {
  const page = read('../app/my-projects/page.tsx');
  assert.match(page, /role\.role === 'artisan'/);
  assert.match(page, /role\.linked_artisan_id/);
  assert.match(page, /Join as a provider/);
  assert.match(page, /Artisan Business Workspace/);
});

test('Artisan Business is a provider dashboard, not a customer-project redirect', () => {
  const page = read('../app/artisan-business/page.tsx');
  assert.match(page, /Incoming work/);
  assert.match(page, /Selected & current jobs/);
  assert.match(page, /Free leads remaining/);
  assert.match(page, /subscription_entitlements/);
  assert.match(page, /lead_invitations/);
  assert.match(page, /provider_responses/);
  assert.match(page, /project_matches/);
  assert.doesNotMatch(page, /Open project manager/);
});
