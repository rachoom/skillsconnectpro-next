export type CompletionEvent = {
  event_type: string;
  actor_type: string;
  event_data: Record<string, unknown> | null;
} | null;

export function isProviderCompletionReport(event: CompletionEvent): boolean;

export function isCustomerCompletionConfirmation(event: CompletionEvent): boolean;

export function isSystemAutoCompletion(event: CompletionEvent): boolean;

export function evaluateCustomerCompletionConfirmation(input: {
  actorType: 'customer' | 'provider';
  projectStatus: string;
  completionReportedAt: string | null;
  providerCompletionEvent: CompletionEvent;
  customerCompletionEvent: CompletionEvent;
  systemCompletionEvent: CompletionEvent;
}):
  | { allowed: true; alreadyConfirmed: boolean; reason: null }
  | { allowed: false; reason: string };

export function verifiedReviewEligible(input: {
  hasSelectedProvider: boolean;
  projectStatus: string;
  customerCompletionEvent: CompletionEvent;
}): boolean;
