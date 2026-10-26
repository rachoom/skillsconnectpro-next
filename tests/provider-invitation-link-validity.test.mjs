import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');
test('invitation reply deadline and secure link expiry are separate', () => {
  const invitations = read('../services/marketplace/invitations.ts');
  assert.match(invitations, /const deadline = getInvitationResponseDeadline/);
  assert.match(invitations, /const linkExpiry = new Date\(Date\.now\(\) \+ 72 \* 60 \* 60 \* 1000\)/);
  assert.match(invitations, /response_deadline: deadline/);
  assert.match(invitations, /response_token_expires_at: linkExpiry/);
});
test('closed or connected projects do not accept new provider responses', () => {
  const providerResponses = read('../services/marketplace/providerResponses.ts');
  assert.match(providerResponses, /provider_selected', 'contact_released', 'in_progress', 'disputed'/);
  assert.match(providerResponses, /cancelled', 'completed', 'unfulfilled'/);
  assert.match(providerResponses, /ensureTokenActive\(invitation\)/);
});
