import { getSupabaseAdmin } from '../supabaseAdmin';
import type { ProjectUrgency } from '../../types/marketplace';

export interface ProviderCandidate {
  providerId: number;
  firstName: string;
  lastName: string;
  displayName: string;
  category: string;
  location: string;
  phone: string | null;
  imageUrl: string | null;
  verified: boolean;
  rating: number | null;
  claimed: boolean;
  availabilityStatus: string;
  acceptsEmergencyJobs: boolean;
  score: number;
  scoreReasons: string[];
  alreadyInvited: boolean;
}

type ProjectCandidateRow = {
  id: string;
  category: string;
  urgency: ProjectUrgency;
  location_text: string;
  suburb: string | null;
  city: string | null;
};

type ArtisanRow = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  category: string | null;
  location: string | null;
  phone: string | null;
  image_url: string | null;
  verified: boolean | null;
  rating: number | null;
  is_claimed: boolean | null;
};

type AvailabilityRow = {
  provider_id: number;
  availability_status: string;
  accepts_emergency_jobs: boolean;
  accepts_planned_work: boolean;
  service_areas: string[] | null;
  categories: string[] | null;
  last_confirmed_at: string | null;
};

type InvitationHistoryRow = {
  provider_id: number;
  status: string;
  project_id: string;
  created_at: string;
};

const CATEGORY_GROUPS: Record<string, string[]> = {
  plumbing: ['plumbing', 'plumber', 'plumbers'],
  electrical: ['electrical', 'electrician', 'electricians'],
  building: ['builder', 'builders', 'building', 'construction', 'general contractor', 'general contractors'],
  general: ['general', 'handyman', 'handymen', 'general contractor', 'general contractors'],
  painting: ['painting', 'painter', 'painters'],
  roofing: ['roofing', 'roofer', 'roofers'],
  carpentry: ['carpentry', 'carpenter', 'carpenters'],
  tiling: ['tiling', 'tiler', 'tilers'],
  welding: ['welding', 'welder', 'welders'],
};

function normalise(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ');
}

function categoryAliases(value: string): Set<string> {
  const cleaned = normalise(value);
  const aliases = new Set<string>([cleaned]);

  for (const group of Object.values(CATEGORY_GROUPS)) {
    if (group.some((item) => cleaned.includes(item) || item.includes(cleaned))) {
      for (const item of group) aliases.add(item);
    }
  }

  return aliases;
}

function categoryMatches(projectCategory: string, providerCategory: string, extraCategories: string[]): boolean {
  const projectAliases = categoryAliases(projectCategory);
  const providerValues = [providerCategory, ...extraCategories].map(normalise).filter(Boolean);

  return providerValues.some((providerValue) =>
    [...projectAliases].some(
      (projectValue) =>
        providerValue === projectValue ||
        providerValue.includes(projectValue) ||
        projectValue.includes(providerValue),
    ),
  );
}

function locationMatches(project: ProjectCandidateRow, providerLocation: string, serviceAreas: string[]): boolean {
  const targets = [project.suburb, project.city, project.location_text]
    .map(normalise)
    .filter(Boolean);
  const providerValues = [providerLocation, ...serviceAreas].map(normalise).filter(Boolean);

  return providerValues.some((providerValue) =>
    targets.some(
      (target) =>
        providerValue === target ||
        providerValue.includes(target) ||
        target.includes(providerValue),
    ),
  );
}

function scoreCandidate(input: {
  project: ProjectCandidateRow;
  artisan: ArtisanRow;
  availability?: AvailabilityRow;
  recentHistory: InvitationHistoryRow[];
  alreadyInvited: boolean;
}): { score: number; reasons: string[] } {
  const { project, artisan, availability, recentHistory, alreadyInvited } = input;
  let score = 0;
  const reasons: string[] = [];

  const extraCategories = availability?.categories ?? [];
  if (categoryMatches(project.category, artisan.category ?? '', extraCategories)) {
    score += 35;
    reasons.push('Strong trade match');
  } else if (categoryMatches(project.category, 'general contractor', extraCategories)) {
    score += 12;
    reasons.push('Possible multi-trade fit');
  } else {
    score -= 25;
    reasons.push('Weak trade match');
  }

  if (locationMatches(project, artisan.location ?? '', availability?.service_areas ?? [])) {
    score += 25;
    reasons.push('Local or declared service-area match');
  }

  const availabilityStatus = availability?.availability_status ?? 'unknown';
  if (availabilityStatus === 'available_now') {
    score += 20;
    reasons.push('Available now');
  } else if (availabilityStatus === 'available_today') {
    score += 15;
    reasons.push('Available today');
  } else if (availabilityStatus === 'available_later') {
    score += 8;
    reasons.push('Availability recorded');
  } else if (availabilityStatus === 'unavailable') {
    score -= 40;
    reasons.push('Marked unavailable');
  }

  if (project.urgency === 'emergency' && availability && !availability.accepts_emergency_jobs) {
    score -= 30;
    reasons.push('Does not accept emergency work');
  }

  if (artisan.verified) {
    score += 10;
    reasons.push('Verified profile');
  }

  if (typeof artisan.rating === 'number' && Number.isFinite(artisan.rating)) {
    score += Math.max(0, Math.min(5, artisan.rating));
    if (artisan.rating >= 4) reasons.push('Strong customer rating');
  }

  const answered = recentHistory.filter((item) => ['accepted', 'declined'].includes(item.status)).length;
  const accepted = recentHistory.filter((item) => item.status === 'accepted').length;
  if (recentHistory.length >= 2) {
    const responseRate = answered / recentHistory.length;
    score += Math.round(responseRate * 8);
    if (responseRate >= 0.7) reasons.push('Responsive to past opportunities');
  }
  if (accepted > 0) score += Math.min(5, accepted);

  if (alreadyInvited) {
    score -= 100;
    reasons.push('Already invited to this project');
  }

  return { score, reasons };
}

export async function getProviderCandidates(projectId: string): Promise<{
  project: ProjectCandidateRow;
  candidates: ProviderCandidate[];
}> {
  const supabase = getSupabaseAdmin();

  const { data: projectData, error: projectError } = await supabase
    .from('projects')
    .select('id, category, urgency, location_text, suburb, city')
    .eq('id', projectId)
    .single();

  if (projectError) throw new Error(`Unable to load project: ${projectError.message}`);
  if (!projectData) throw new Error('Project not found.');

  const project = projectData as ProjectCandidateRow;
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

  const [artisanResult, availabilityResult, invitationResult] = await Promise.all([
    supabase
      .from('artisans')
      .select('id, first_name, last_name, category, location, phone, image_url, verified, rating, is_claimed')
      .order('verified', { ascending: false })
      .order('rating', { ascending: false })
      .limit(250),
    supabase
      .from('provider_availability')
      .select('provider_id, availability_status, accepts_emergency_jobs, accepts_planned_work, service_areas, categories, last_confirmed_at'),
    supabase
      .from('lead_invitations')
      .select('provider_id, status, project_id, created_at')
      .gte('created_at', ninetyDaysAgo),
  ]);

  if (artisanResult.error) {
    throw new Error(`Unable to load artisans: ${artisanResult.error.message}`);
  }
  if (availabilityResult.error) {
    throw new Error(`Unable to load provider availability: ${availabilityResult.error.message}`);
  }
  if (invitationResult.error) {
    throw new Error(`Unable to load invitation history: ${invitationResult.error.message}`);
  }

  const artisans = (artisanResult.data ?? []) as ArtisanRow[];
  const availability = (availabilityResult.data ?? []) as AvailabilityRow[];
  const history = (invitationResult.data ?? []) as InvitationHistoryRow[];
  const availabilityByProvider = new Map(availability.map((row) => [row.provider_id, row]));
  const historyByProvider = new Map<number, InvitationHistoryRow[]>();

  for (const row of history) {
    const list = historyByProvider.get(row.provider_id) ?? [];
    list.push(row);
    historyByProvider.set(row.provider_id, list);
  }

  const candidates = artisans
    .map((artisan): ProviderCandidate => {
      const providerHistory = historyByProvider.get(artisan.id) ?? [];
      const alreadyInvited = providerHistory.some((item) => item.project_id === projectId);
      const providerAvailability = availabilityByProvider.get(artisan.id);
      const { score, reasons } = scoreCandidate({
        project,
        artisan,
        availability: providerAvailability,
        recentHistory: providerHistory.filter((item) => item.project_id !== projectId),
        alreadyInvited,
      });

      const firstName = artisan.first_name?.trim() || 'Provider';
      const lastName = artisan.last_name?.trim() || '';

      return {
        providerId: artisan.id,
        firstName,
        lastName,
        displayName: `${firstName} ${lastName}`.trim(),
        category: artisan.category?.trim() || 'Uncategorised',
        location: artisan.location?.trim() || 'Location not supplied',
        phone: artisan.phone,
        imageUrl: artisan.image_url,
        verified: artisan.verified === true,
        rating: artisan.rating,
        claimed: artisan.is_claimed === true,
        availabilityStatus: providerAvailability?.availability_status ?? 'unknown',
        acceptsEmergencyJobs: providerAvailability?.accepts_emergency_jobs ?? false,
        score,
        scoreReasons: reasons,
        alreadyInvited,
      };
    })
    .filter((candidate) => candidate.score > -20 || candidate.alreadyInvited)
    .sort((left, right) => right.score - left.score)
    .slice(0, 30);

  return { project, candidates };
}
