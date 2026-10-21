import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = path => fs.readFileSync(new URL(path, import.meta.url), 'utf8');

test('estimator refuses silent empty-material success for material-bearing jobs', () => {
  const route = read('../app/api/estimate/route.ts');
  assert.match(route, /version:\s*2/);
  assert.match(route, /maxOutputTokens:\s*1600/);
  assert.match(route, /NEVER return an empty materials array/);
  assert.match(route, /baselineEstimate\(prompt\)/);
  assert.match(route, /Interior wall paint/);
  assert.match(route, /Tile adhesive/);
  assert.doesNotMatch(route, /response\.text\s*\|\|\s*'\{\\"materials\\":\[\]/);
});

test('calculator surfaces malformed estimator JSON instead of falling back to zero materials', () => {
  const calculator = read('../components/DIYvsProCalculator.tsx');
  assert.match(calculator, /The estimator returned incomplete data/);
  assert.match(calculator, /The estimator returned no project data/);
});
