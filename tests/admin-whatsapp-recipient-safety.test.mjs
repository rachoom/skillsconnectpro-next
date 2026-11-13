import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const read = (name) => readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');

test('provider invitations never trigger administrator WhatsApp alerts', () => {
  const invitations = read('services/marketplace/invitations.ts');
  assert.doesNotMatch(invitations, /notifyAdminProviderDispatch|adminDispatchAlerts|notifyAdminDispatch/);
  assert.match(invitations, /dispatchProviderInvitations/);
  assert.match(invitations, /return createdInvitations\.map/);
  assert.equal(existsSync(new URL('../services/marketplace/adminDispatchAlerts.ts', import.meta.url)), false);
});

test('admin console stays browser-only regardless of any legacy environment setting', () => {
  const readiness = read('services/marketplace/whatsappReadiness.ts');
  assert.match(readiness, /enabled: false,\s*required: \[\]/);
  assert.match(readiness, /Admin notifications are browser-only/);
  assert.doesNotMatch(readiness, /MARKETPLACE_ADMIN_WHATSAPP_ALERTS_ENABLED/);
  const example = read('.env.example');
  assert.doesNotMatch(example, /MARKETPLACE_ADMIN_WHATSAPP_(ALERTS_ENABLED|NUMBER)/);
});

test('customer and provider notifications remain separately available without admin console links', () => {
  const customer = read('services/marketplace/customerWhatsAppNotifications.ts');
  const provider = read('services/marketplace/whatsappDelivery.ts');
  assert.match(customer, /sendMetaWhatsAppTemplate/);
  assert.match(provider, /sendMetaWhatsAppTemplate/);
  assert.match(customer, /customerProjectUrl/);
  assert.match(provider, /providerOpportunityUrl/);
  assert.doesNotMatch(customer, /marketplace-admin/);
  assert.doesNotMatch(provider, /marketplace-admin/);
});
