import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isMechanicsRequest,
  normalisePrimaryServiceCategory,
} from '../services/marketplace/serviceTaxonomy.js';

test('promoted legacy building and carpentry categories fall back to general contractor', () => {
  assert.equal(normalisePrimaryServiceCategory('Building'), 'General Contractor');
  assert.equal(normalisePrimaryServiceCategory('Building & renovations'), 'General Contractor');
  assert.equal(normalisePrimaryServiceCategory('Carpentry'), 'General Contractor');
  assert.equal(normalisePrimaryServiceCategory('Carpenters'), 'General Contractor');
});

test('cleaning and mechanics normalise to the new primary service labels', () => {
  assert.equal(normalisePrimaryServiceCategory('Cleaners'), 'Cleaning');
  assert.equal(normalisePrimaryServiceCategory('Mechanic'), 'Mechanics');
});

test('mechanics requests are detected from ordinary vehicle descriptions', () => {
  assert.equal(isMechanicsRequest("My car won't start and I need a mechanic"), true);
  assert.equal(isMechanicsRequest('The vehicle is overheating'), true);
  assert.equal(isMechanicsRequest('I need my kitchen painted'), false);
});
