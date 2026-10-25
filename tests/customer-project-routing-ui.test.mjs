import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('direct invitations remain exclusive unless the customer opts into urgent fallback', () => {
  const intake = read('../app/api/projects/intake/route.ts');
  const routing = read('../services/marketplace/automaticRouting.ts');

  assert.match(intake, /if \(preferredProviderId\)[\s\S]*queuePreferredProvider/);
  assert.match(intake, /The customer selected a specific provider, so only that provider was invited/);
  assert.match(intake, /else if \(process\.env\.MARKETPLACE_AUTOROUTING_ENABLED/);

  assert.match(routing, /assessment\.intakeOrigin === 'controlled_provider_browse'/);
  assert.match(routing, /directInviteMode/);
  assert.match(intake, /allowAlternativeProviders: Boolean/);
  assert.match(routing, /assessment\.allowAlternativeProviders === true/);
  assert.match(routing, /allowDirectFallback && validResponses > 0/);
  assert.match(routing, /directInviteMode && !input\.force && !allowDirectFallback/);
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

test('quick request bypasses AI assessment and routes selected providers through the original project API', () => {
  const quick = read('../components/QuickProviderRequest.tsx');
  const directory = read('../components/ControlledProviderDirectory.tsx');
  const home = read('../components/PremiumLanding.tsx');
  assert.match(quick, /fetch\('\/api\/projects\/intake'/);
  assert.doesNotMatch(quick, /assess-v[23]/);
  assert.match(quick, /allowAlternativeProviders: Boolean/);
  assert.match(directory, /return `\/quick-request\?/);
  assert.match(home, /Find a Provider Now/);
  assert.match(home, /quick-request\?mode=emergency/);
});
