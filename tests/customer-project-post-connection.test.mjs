import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('customer sees an obvious next step only once provider contact is released', () => {
  const dashboard = read('../app/project/[id]/page.tsx');
  assert.match(dashboard, /\{contactsReleased && releasedProvider && \(/);
  assert.match(dashboard, /Manage your project here/);
  assert.match(dashboard, /What happens next\?/);
  assert.match(dashboard, /Open project controls/);
  assert.match(dashboard, /aria-controls="job-status-controls"/);
  assert.match(dashboard, /id="manage-project-next-step"/);
});

test('manage button calls the resilient lifecycle host rather than scrolling to page bottom', () => {
  const dashboard = read('../app/project/[id]/page.tsx');
  const host = read('../components/MarketplaceLifecycleHost.tsx');
  assert.match(dashboard, /window\.dispatchEvent\(new Event\('marketplace-open-job-controls'\)\)/);
  assert.match(host, /window\.addEventListener\('marketplace-open-job-controls', onOpenRequest\)/);
  assert.match(host, /setRevision\(\(current\) => current \+ 1\)/);
  assert.match(host, /controls\.scrollIntoView/);
  assert.doesNotMatch(dashboard, /window\.scrollTo\(\{ top: document\.documentElement\.scrollHeight/);
});

test('existing private contact release and safe connected-only controls remain intact', () => {
  const dashboard = read('../app/project/[id]/page.tsx');
  assert.match(dashboard, /\/release-contact/);
  assert.match(dashboard, /'x-project-access-token': accessToken/);
  assert.match(dashboard, /projectClosed \? null : feed\.releasedContact\?\.provider \?\? null/);
  assert.match(dashboard, /\.actionConnected/);
  assert.match(dashboard, /className=\{styles\.callButton\}/);
  assert.match(dashboard, /className=\{styles\.whatsappButton\}/);
});
