import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('project workspace mutations stay behind authenticated server routes', () => {
  const client = read('../app/my-projects/[id]/project-workspace.tsx');
  assert.doesNotMatch(client, /createBrowserSupabaseClient/);
  assert.doesNotMatch(client, /supabase\.from\(/);
  assert.match(client, /\/api\/account\/projects\/\$\{project\.id\}\/workspace/);
  assert.match(client, /\/api\/account\/projects\/\$\{project\.id\}\/documents/);
});

test('workspace API verifies project access before using service role', () => {
  const route = read('../app/api/account/projects/[id]/workspace/route.ts');
  const access = read('../services/projectWorkspaceAccess.ts');
  assert.match(route, /requireProjectWorkspaceAccess/);
  assert.match(access, /getAuthenticatedAccount/);
  assert.match(access, /project_members/);
  assert.match(access, /status', 'active'/);
  assert.match(access, /getSupabaseAdmin/);
});

test('all manual project tabs have server actions', () => {
  const route = read('../app/api/account/projects/[id]/workspace/route.ts');
  for (const action of ['update_estimate','add_material','remove_material','add_milestone','toggle_milestone','add_expense']) {
    assert.match(route, new RegExp(`body\\.action === '${action}'`));
  }
  const docs = read('../app/api/account/projects/[id]/documents/route.ts');
  assert.match(docs, /export async function POST/);
  assert.match(docs, /export async function GET/);
  assert.match(docs, /export async function DELETE/);
});
