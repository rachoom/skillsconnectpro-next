const CONTACT_ACCESS_CLOSED_STATUSES = new Set([
  'cancelled',
  'unfulfilled',
]);

export function isContactAccessActive(projectStatus, contactReleasedAt) {
  if (!contactReleasedAt) return false;
  return !CONTACT_ACCESS_CLOSED_STATUSES.has(String(projectStatus || '').toLowerCase());
}
