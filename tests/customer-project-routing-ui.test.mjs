import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('browsed provider requests remain direct invitations instead of normal waves', () => {
  const intake = read('../app/api/projects/intake/route.ts');
  const routing = read('../services/marketplace/automaticRouting.ts');

  assert.match(intake, /if \(preferredProviderId\)[\s\S]*queuePreferredProvider/);
  assert.match(intake, /The customer selected a specific provider, so only that provider was invited/);
  assert.match(intake, /else if \(process\.env\.MARKETPLACE_AUTOROUTING_ENABLED/);

  assert.match(routing, /assessment\.intakeOrigin === 'controlled_provider_browse'/);
  assert.match(routing, /directInviteMode/);
  assert.match(routing, /never expand[\s\S]*direct-provider request automatically/);
});

test('closed projects cannot offer or execute provider connection actions', () => {
  const page = read('../app/project/[id]/page.tsx');
  const matches = read('../services/marketplace/matches.ts');

  assert.match(page, /projectClosed/);
  assert.match(page, /Project closed/);
  assert.match(page, /disabled=\{projectClosed \|\| contactsReleased/);
  assert.match(page, /showReleaseConfirm && selectedResponse && !projectClosed/);

  assert.match(matches, /Contact details cannot be released while the project is/);
  assert.match(matches, /A provider cannot be selected while the project is/);
});

test('project journey is compact and user-expandable', () => {
  const page = read('../app/project/[id]/page.tsx');
  const css = read('../app/project/[id]/project-overview.module.css');

  assert.match(page, /journeyOpen/);
  assert.match(page, /Show activity/);
  assert.match(page, /Hide activity/);
  assert.match(page, /aria-controls="project-journey-timeline"/);
  assert.match(css, /\.activityToggle/);
});
