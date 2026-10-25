import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (path) => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('successful Quick Request opens the secure customer dashboard directly', () => {
  const quick = read('../components/QuickProviderRequest.tsx');
  const dashboard = read('../app/project/[id]/page.tsx');
  assert.match(quick, /const trackingUrl = '\/project\/' \+ encodeURIComponent\(payload\.project\.id\) \+ '\?token=' \+ encodeURIComponent\(payload\.accessToken\)/);
  assert.match(quick, /window\.location\.replace\(trackingUrl\)/);
  assert.match(dashboard, /new URLSearchParams\(window\.location\.search\)\.get\('token'\)/);
});

test('Quick Request retains a tab-scoped recovery link after an interrupted redirect', () => {
  const quick = read('../components/QuickProviderRequest.tsx');
  assert.match(quick, /window\.sessionStorage\.setItem\(RECENT_REQUEST_STORAGE_KEY/);
  assert.match(quick, /RECOVERY_AGE_MS/);
  assert.match(quick, /safeTrackingUrl\(saved\.url\)/);
  assert.match(quick, /Open tracking dashboard/);
  assert.match(quick, /Start a different request/);
  assert.doesNotMatch(quick, /localStorage/);
});

test('Quick Request prevents duplicate submission while navigating', () => {
  const quick = read('../components/QuickProviderRequest.tsx');
  assert.match(quick, /if \(submittingRef\.current \|\| submitted\) return/);
  assert.match(quick, /submittingRef\.current = true/);
  assert.match(quick, /setSubmitted\(/);
  assert.match(quick, /disabled=\{busy \|\| photoBusy\}/);
});
