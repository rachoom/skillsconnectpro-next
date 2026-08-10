import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildBaselineQuestions,
  detectIntakeCategory,
  isLikelyStreetAddress,
  mergeClarifyingQuestions,
  phoneValidationMessage,
} from '../services/marketplace/intakePolicy.js';

test('detects a room construction request as building work', () => {
  assert.equal(detectIntakeCategory('I want to build a room attached to my house'), 'Building');
});

test('building fallback asks useful construction questions instead of fault timing', () => {
  const questions = buildBaselineQuestions('Building', 'build a room');
  assert.ok(questions.length >= 6);
  assert.equal(questions.some((item) => /when did.*start/i.test(item.question)), false);
  assert.equal(questions.some((item) => /plans|approval/i.test(item.question)), true);
  assert.equal(questions.some((item) => /large|size/i.test(item.question)), true);
});

test('first clarification round is supplemented to at least five questions', () => {
  const questions = mergeClarifyingQuestions({
    modelQuestions: [
      { id: 'one', question: 'What will the room be used for?', options: ['Bedroom'], required: true },
      { id: 'two', question: 'Do you have plans?', options: ['Yes', 'No'], required: true },
    ],
    baselineQuestions: buildBaselineQuestions('Building', 'build a room'),
    answeredQuestions: [],
    minimum: 5,
    maximum: 6,
  });
  assert.ok(questions.length >= 5);
  assert.ok(questions.length <= 6);
});

test('answered questions are not repeated', () => {
  const questions = mergeClarifyingQuestions({
    modelQuestions: buildBaselineQuestions('Building', 'build a room'),
    baselineQuestions: buildBaselineQuestions('Building', 'build a room'),
    answeredQuestions: ['What are you planning to build?'],
    minimum: 5,
    maximum: 6,
  });
  assert.equal(questions.some((item) => item.question === 'What are you planning to build?'), false);
});

test('identifies a personal street address but allows a suburb', () => {
  assert.equal(isLikelyStreetAddress('119 Northdene Street'), true);
  assert.equal(isLikelyStreetAddress('119 Northdene'), true);
  assert.equal(isLikelyStreetAddress('Northdene'), false);
  assert.equal(isLikelyStreetAddress('Kempton Park'), false);
});

test('phone validation distinguishes a missing and incomplete number', () => {
  assert.match(phoneValidationMessage(''), /required/i);
  assert.match(phoneValidationMessage('082123'), /incomplete/i);
  assert.equal(phoneValidationMessage('0821234567'), null);
});
