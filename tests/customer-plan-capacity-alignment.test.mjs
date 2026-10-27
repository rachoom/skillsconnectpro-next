import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('Basic benefits describe expanded limits without falsely including milestones or shared artisan access', () => {
  const source = read('../services/planPresentation.ts');
  const basic = source.split('basic_30: [')[1].split('],')[0];
  const pass = source.split('project_pass_90: [')[1].split('],')[0];
  assert.match(basic, /2 project photo analyses/);
  assert.match(basic, /20 project documents/);
  assert.match(basic, /200 MB per project/);
  assert.match(basic, /Review provider replies and contact your chosen artisan/);
  assert.doesNotMatch(basic, /Milestones and progress tracking|Basic artisan collaboration|Full materials calculations/);
  assert.match(pass, /Project milestones and progress tracking/);
  assert.doesNotMatch(pass, /Collaborate with artisans across the project|Project reports and handover record/);
});

test('plan comparison distinguishes actual quotas and the Pass-only milestone entitlement', () => {
  const source = read('../app/plans/page.tsx');
  assert.match(source, /\['Documents per project', '5', '20', '50'\]/);
  assert.match(source, /\['Milestone management', '—', '—', 'Included'\]/);
  assert.doesNotMatch(source, /\['Collaborate with artisans'/);
});

test('paid photo allowance is verified on server before the AI rate guard uses paid headroom', () => {
  const guard = read('../services/aiUsageGuard.ts');
  const assessment = read('../app/api/project-intake/assess-v2/route.ts');
  assert.match(guard, /verifiedPlanCode === 'basic_30' \|\| verifiedPlanCode === 'project_pass_90'/);
  assert.match(guard, /sessionLimit: paid \? 30 : 4/);
  assert.match(guard, /imageLimit: paid \? 30 : 1/);
  assert.match(assessment, /verifiedPlanCode = photoUsage\.planCode/);
  assert.match(assessment, /\.from\('account_subscriptions'\)/);
  assert.match(assessment, /\.gt\('ends_at', new Date\(\)\.toISOString\(\)\)/);
  assert.match(assessment, /customerProjectUsage\(Boolean\(image\), verifiedPlanCode\)/);
  assert.match(assessment, /releaseCustomerPhotoAssessment\(photoReservation\)/);
});
