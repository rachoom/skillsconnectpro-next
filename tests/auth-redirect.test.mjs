import assert from 'node:assert/strict';
import test from 'node:test';

function safeInternalPath(value, fallback = '/my-projects') {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return fallback;
  try {
    const parsed = new URL(value, 'https://skillsconnectpro.co.za');
    if (parsed.origin !== 'https://skillsconnectpro.co.za') return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

test('safeInternalPath accepts local account routes', () => {
  assert.equal(safeInternalPath('/my-projects/123?tab=materials'), '/my-projects/123?tab=materials');
});

test('safeInternalPath rejects protocol-relative and external URLs', () => {
  assert.equal(safeInternalPath('//attacker.example/path'), '/my-projects');
  assert.equal(safeInternalPath('https://attacker.example/path'), '/my-projects');
});
