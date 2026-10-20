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

function resolveAuthReturnPath(requestedPath, rememberedPath) {
  const requested = safeInternalPath(requestedPath, '');
  if (requested) return requested;
  return safeInternalPath(rememberedPath);
}

test('safeInternalPath accepts local account routes', () => {
  assert.equal(safeInternalPath('/my-projects/123?tab=materials'), '/my-projects/123?tab=materials');
});

test('safeInternalPath rejects protocol-relative and external URLs', () => {
  assert.equal(safeInternalPath('//attacker.example/path'), '/my-projects');
  assert.equal(safeInternalPath('https://attacker.example/path'), '/my-projects');
});

test('resolveAuthReturnPath restores checkout when a provider drops the query parameter', () => {
  assert.equal(
    resolveAuthReturnPath(null, '/customer-checkout?plan=basic_30'),
    '/customer-checkout?plan=basic_30',
  );
});

test('resolveAuthReturnPath still rejects an unsafe remembered destination', () => {
  assert.equal(resolveAuthReturnPath(null, 'https://attacker.example'), '/my-projects');
});
