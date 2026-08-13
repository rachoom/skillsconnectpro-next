import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isPlausibleWhatsAppRecipient,
  normaliseWhatsAppRecipient,
} from '../services/marketplace/whatsappPolicy.js';

test('normalises a South African mobile number to international digits', () => {
  assert.equal(normaliseWhatsAppRecipient('082 123 4567'), '27821234567');
});

test('preserves an international South African number', () => {
  assert.equal(normaliseWhatsAppRecipient('+27 82 123 4567'), '27821234567');
});

test('normalises an international access prefix', () => {
  assert.equal(normaliseWhatsAppRecipient('0027 82 123 4567'), '27821234567');
});

test('rejects incomplete and implausibly long recipients', () => {
  assert.equal(isPlausibleWhatsAppRecipient('082 123'), false);
  assert.equal(isPlausibleWhatsAppRecipient('1234567890123456'), false);
});
