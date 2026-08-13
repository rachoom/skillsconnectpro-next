const MATCHING_ENTRY_STATUSES = new Set(['draft', 'assessment_complete']);

export function projectStatusAfterInvitation(currentStatus) {
  return MATCHING_ENTRY_STATUSES.has(currentStatus) ? 'matching' : currentStatus;
}
