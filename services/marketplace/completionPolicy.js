export function isProviderCompletionReport(event) {
  return Boolean(
    event &&
      event.event_type === 'completion_reported' &&
      event.actor_type === 'provider' &&
      event.event_data?.action === 'report_completion',
  );
}

export function isCustomerCompletionConfirmation(event) {
  return Boolean(
    event &&
      event.event_type === 'project_completed' &&
      event.actor_type === 'customer' &&
      event.event_data?.action === 'confirm_completion',
  );
}

export function isSystemAutoCompletion(event) {
  return Boolean(
    event &&
      event.event_type === 'project_auto_completed' &&
      event.actor_type === 'system' &&
      event.event_data?.action === 'auto_complete_after_timeout',
  );
}

export function evaluateCustomerCompletionConfirmation(input) {
  if (input.actorType !== 'customer') {
    return {
      allowed: false,
      reason: 'The customer must confirm final completion.',
    };
  }

  if (input.projectStatus === 'completed') {
    if (isCustomerCompletionConfirmation(input.customerCompletionEvent)) {
      return { allowed: true, alreadyConfirmed: true, reason: null };
    }

    if (isSystemAutoCompletion(input.systemCompletionEvent)) {
      return { allowed: true, alreadyConfirmed: false, reason: null };
    }

    return {
      allowed: false,
      reason: 'This project was closed without a verified customer confirmation. Please contact support.',
    };
  }

  if (!['contact_released', 'in_progress'].includes(input.projectStatus)) {
    return {
      allowed: false,
      reason: 'This job cannot be confirmed from its current status.',
    };
  }

  // The provider may report completion first, but that report is not a gate.
  // The customer controls final completion and can close an active connected
  // job once they have personally verified that the work is finished.
  return { allowed: true, alreadyConfirmed: false, reason: null };
}

export function verifiedReviewEligible(input) {
  return Boolean(
    input.hasSelectedProvider &&
      input.projectStatus === 'completed' &&
      isCustomerCompletionConfirmation(input.customerCompletionEvent),
  );
}