import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('admin WhatsApp summary is restricted to active administrator phones', () => {
  const alerts = read('services/marketplace/adminDispatchAlerts.ts');
  assert.match(alerts, /isAuthorisedAdminRecipient\(recipient, input\.projectId\)/);
  assert.match(alerts, /\.from\('marketplace_admin_users'\)/);
  assert.match(alerts, /\.eq\('is_active', true\)/);
  assert.match(alerts, /\.from\('profiles'\)/);
  assert.match(alerts, /normaliseWhatsAppRecipient\(profile\.phone\) === recipient/);
  assert.match(alerts, /return \{\s*status: 'disabled',[\s\S]*?registered administrator phone/);
});

test('customer phone cannot receive an administrator alert even if configured as the admin destination', () => {
  const alerts = read('services/marketplace/adminDispatchAlerts.ts');
  assert.match(alerts, /\.from\('projects'\)/);
  assert.match(alerts, /\.eq\('id', projectId\)/);
  assert.match(alerts, /normaliseWhatsAppRecipient\(project\.guest_phone\) === recipient/);
  assert.match(alerts, /recipient is also this project customer/);
});

test('admin URL is only composed after validating the recipient and is never part of the customer confirmation', () => {
  const alerts = read('services/marketplace/adminDispatchAlerts.ts');
  assert.ok(alerts.indexOf('await isAuthorisedAdminRecipient') < alerts.indexOf('const adminUrl ='));
  const customer = read('services/marketplace/customerWhatsAppNotifications.ts');
  assert.doesNotMatch(customer, /marketplace-admin/);
  assert.match(customer, /customerProjectUrl/);
  assert.match(customer, /sendMetaWhatsAppTemplate/);
  const provider = read('services/marketplace/whatsappDelivery.ts');
  assert.match(provider, /providerOpportunityUrl/);
  assert.match(provider, /sendMetaWhatsAppTemplate/);
});
