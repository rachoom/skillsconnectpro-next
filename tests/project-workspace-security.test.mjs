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
  assert.match(access, /getAuthenticatedAccount/);
  assert.match(access, /supabase[\s\S]*from\('projects'\)/);
  assert.match(access, /maybeSingle\(\)/);
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


test('legacy procurement disclaimers never render as project safety warnings', () => {
  const page = read('../app/my-projects/[id]/page.tsx');
  const intake = read('../app/api/projects/intake/route.ts');
  assert.match(page, /hardware quotation\|supplier pricing\|procurement/);
  assert.match(intake, /hardware quotation\|supplier pricing\|procurement/);
});


test('persisted child records are reloaded after parent RLS access succeeds', () => {
  const page = read('../app/my-projects/[id]/page.tsx');
  assert.match(page, /getSupabaseAdmin/);
  assert.match(page, /admin\.from\('project_documents'\)/);
  assert.match(page, /admin\.from\('project_materials'\)/);
  assert.match(page, /admin\.from\('project_expenses'\)/);
  assert.match(page, /admin\.from\('project_milestones'\)/);
  assert.match(page, /projectResult[\s\S]*notFound\(\)[\s\S]*getSupabaseAdmin/);
});

test('My Projects supports a persistent light and dark theme', () => {
  const toggle = read('../app/my-projects/workspace-theme-toggle.tsx');
  const css = read('../app/my-projects/workspace.module.css');
  assert.match(toggle, /skills-connect-workspace-theme/);
  assert.match(toggle, /prefers-color-scheme: light/);
  assert.match(toggle, /dataset\.workspaceTheme/);
  assert.match(css, /data-workspace-theme='light'/);
  assert.match(css, /#f3eee3/);
});
