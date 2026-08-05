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

export function evaluateCustomerCompletionConfirmation(input) {
  if (input.actorType !== 'customer') {
    return {
      allowed: false,
      reason: 'The customer must confirm final completion.',
    };
  }

  if (!input.completionReportedAt || !isProviderCompletionReport(input.providerCompletionEvent)) {
    return {
      allowed: false,
      reason: 'The provider must report that the work is complete before you can confirm completion.',
    };
  }

  if (input.projectStatus === 'completed') {
    if (isCustomerCompletionConfirmation(input.customerCompletionEvent)) {
      return { allowed: true, alreadyConfirmed: true, reason: null };
    }

    return {
      allowed: false,
      reason: 'This project was closed without a verified customer confirmation. Please contact support.',
    };
  }

  if (input.projectStatus !== 'in_progress') {
    return {
      allowed: false,
      reason: 'This job cannot be confirmed from its current status.',
    };
  }

  return { allowed: true, alreadyConfirmed: false, reason: null };
}

export function verifiedReviewEligible(input) {
  return Boolean(
    input.hasSelectedProvider &&
      input.projectStatus === 'completed' &&
      isCustomerCompletionConfirmation(input.customerCompletionEvent),
  );
}
