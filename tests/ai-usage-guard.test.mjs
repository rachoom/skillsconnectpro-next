import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('AI budget migration keeps the ledger server-only and atomically reserves monthly spend', () => {
  const migration = read('../supabase/migrations/202610120001_add_ai_usage_budget_guard.sql');
  assert.match(migration, /create table public\.ai_usage_months/i);
  assert.match(migration, /create table public\.ai_usage_events/i);
  assert.match(migration, /alter table public\.ai_usage_months enable row level security/i);
  assert.match(migration, /alter table public\.ai_usage_events enable row level security/i);
  assert.match(migration, /revoke all on public\.ai_usage_events from public, anon, authenticated/i);
  assert.match(migration, /grant execute on function public\.reserve_ai_usage[\s\S]* to service_role/i);
  assert.match(migration, /pg_advisory_xact_lock\(hashtextextended\('ai_budget:'/i);
  assert.match(migration, /'Africa\/Johannesburg'/i);
});

test('AI routes reserve usage, settle actual tokens and use Lite for inexpensive classification', () => {
  const estimate = read('../app/api/estimate/route.ts');
  const assessment = read('../app/api/project-intake/assess-v2/route.ts');
  const legacyAssessment = read('../app/api/project-intake/assess/route.ts');
  const intent = read('../app/api/ai/intent/route.ts');
  const card = read('../app/api/onboarding/extract-card/route.ts');
  assert.match(estimate, /reserveAiUsage\(req, customerProjectUsage/);
  assert.match(estimate, /settleAiUsage\(reservation, 'gemini-3\.6-flash'/);
  assert.match(assessment, /maxOutputTokens: 1100/);
  assert.match(legacyAssessment, /reserveAiUsage\(request, customerProjectUsage/);
  assert.match(intent, /model: 'gemini-3\.5-flash-lite'/);
  assert.match(card, /model: 'gemini-3\.5-flash-lite'/);
});

test('AI cost guard stores only HMAC hashes and sets an HttpOnly session cookie', () => {
  const guard = read('../services/aiUsageGuard.ts');
  assert.match(guard, /createHmac\('sha256'/);
  assert.match(guard, /httpOnly: true/);
  assert.match(guard, /AI_MONTHLY_BUDGET_CENTS \|\| 50_000/);
  assert.match(guard, /AI_COST_ZAR_PER_USD/);
});
