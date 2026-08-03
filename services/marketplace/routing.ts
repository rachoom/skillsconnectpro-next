import type { ProjectServiceLevel, ProjectUrgency } from '../../types/marketplace';

export interface ProviderCandidate {
  providerId: string;
  categoryMatch: boolean;
  distanceKm: number | null;
  withinPreferredArea: boolean;
  availabilityStatus: 'available_now' | 'available_today' | 'available_later' | 'unavailable' | 'unknown';
  acceptsEmergencyJobs: boolean;
  verified: boolean;
  responseRate: number | null;
  averageResponseMinutes: number | null;
  activeLeadCount: number;
  maximumActiveLeads: number;
  relevantCompletedJobs: number;
}

export interface ScoredProviderCandidate extends ProviderCandidate {
  eligible: boolean;
  score: number;
  reasons: string[];
}

const RESPONSE_TARGET_MINUTES: Record<ProjectUrgency, number> = {
  emergency: 10,
  urgent: 30,
  planned: 360,
  large_project: 1440,
};

const RESPONSE_DEADLINE_MINUTES: Record<ProjectUrgency, number> = {
  emergency: 5,
  urgent: 20,
  planned: 120,
  large_project: 720,
};

export function getProjectResponseTarget(
  urgency: ProjectUrgency,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + RESPONSE_TARGET_MINUTES[urgency] * 60_000);
}

export function getInvitationResponseDeadline(
  urgency: ProjectUrgency,
  from: Date = new Date(),
): Date {
  return new Date(from.getTime() + RESPONSE_DEADLINE_MINUTES[urgency] * 60_000);
}

export function getInitialWaveSize(
  urgency: ProjectUrgency,
  serviceLevel: ProjectServiceLevel,
): number {
  if (urgency === 'emergency') return serviceLevel === 'priority' ? 4 : 3;
  if (serviceLevel === 'managed') return 3;
  if (serviceLevel === 'priority') return 3;
  return 2;
}

export function getMaximumResponseCount(
  urgency: ProjectUrgency,
  serviceLevel: ProjectServiceLevel,
): number {
  if (urgency === 'emergency') return 2;
  if (serviceLevel === 'free') return 1;
  if (serviceLevel === 'assisted') return 3;
  return 3;
}

export function scoreProviderCandidate(
  candidate: ProviderCandidate,
  urgency: ProjectUrgency,
): ScoredProviderCandidate {
  const reasons: string[] = [];

  if (!candidate.categoryMatch) {
    return { ...candidate, eligible: false, score: 0, reasons: ['Category does not match'] };
  }

  if (candidate.activeLeadCount >= candidate.maximumActiveLeads) {
    return { ...candidate, eligible: false, score: 0, reasons: ['Provider is at active lead capacity'] };
  }

  if (candidate.availabilityStatus === 'unavailable') {
    return { ...candidate, eligible: false, score: 0, reasons: ['Provider marked unavailable'] };
  }

  if (urgency === 'emergency' && !candidate.acceptsEmergencyJobs) {
    return { ...candidate, eligible: false, score: 0, reasons: ['Provider does not accept emergency work'] };
  }

  let score = 30;
  reasons.push('Category match +30');

  if (candidate.withinPreferredArea) {
    score += 25;
    reasons.push('Within preferred area +25');
  } else if (candidate.distanceKm !== null && candidate.distanceKm <= 30) {
    score += 12;
    reasons.push('Within extended travel range +12');
  }

  if (candidate.availabilityStatus === 'available_now') {
    score += 20;
    reasons.push('Available now +20');
  } else if (candidate.availabilityStatus === 'available_today') {
    score += 15;
    reasons.push('Available today +15');
  } else if (candidate.availabilityStatus === 'available_later') {
    score += 8;
    reasons.push('Available later +8');
  }

  if (candidate.verified) {
    score += 10;
    reasons.push('Verified +10');
  }

  if (candidate.responseRate !== null) {
    const responsePoints = Math.round(Math.max(0, Math.min(1, candidate.responseRate)) * 10);
    score += responsePoints;
    reasons.push(`Response history +${responsePoints}`);
  }

  if (candidate.averageResponseMinutes !== null) {
    if (candidate.averageResponseMinutes <= 10) {
      score += 5;
      reasons.push('Fast average response +5');
    } else if (candidate.averageResponseMinutes <= 30) {
      score += 3;
      reasons.push('Good average response +3');
    }
  }

  const completedJobPoints = Math.min(5, candidate.relevantCompletedJobs);
  if (completedJobPoints > 0) {
    score += completedJobPoints;
    reasons.push(`Relevant completed jobs +${completedJobPoints}`);
  }

  return { ...candidate, eligible: true, score, reasons };
}

export function rankProviderCandidates(
  candidates: ProviderCandidate[],
  urgency: ProjectUrgency,
): ScoredProviderCandidate[] {
  return candidates
    .map((candidate) => scoreProviderCandidate(candidate, urgency))
    .filter((candidate) => candidate.eligible)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;

      const aResponse = a.averageResponseMinutes ?? Number.POSITIVE_INFINITY;
      const bResponse = b.averageResponseMinutes ?? Number.POSITIVE_INFINITY;
      return aResponse - bResponse;
    });
}

export function shouldExpandProviderWave(input: {
  urgency: ProjectUrgency;
  invitationsSent: number;
  validResponsesReceived: number;
  maximumResponses: number;
  earliestOutstandingDeadline: Date | null;
  now?: Date;
}): boolean {
  const now = input.now ?? new Date();

  if (input.validResponsesReceived >= input.maximumResponses) return false;
  if (input.invitationsSent === 0) return true;
  if (!input.earliestOutstandingDeadline) return true;

  return now.getTime() >= input.earliestOutstandingDeadline.getTime();
}
