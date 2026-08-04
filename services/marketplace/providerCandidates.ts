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
  title: string;
  customer_description: string | null;
  ai_summary: string | null;
  likely_issue: string | null;
  category: string;
  urgency: ProjectUrgency;
  status: string;
  location_text: string;
  suburb: string | null;
  city: string | null;
};

type ProjectMatchRow = {
  provider_id: number;
  status: string;
  contact_released_at: string | null;
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

const ROUTING_CLOSED_PROJECT_STATUSES = new Set([
  'provider_selected',
  'contact_released',
  'in_progress',
  'completed',
  'cancelled',
  'unfulfilled',
]);

const ROUTING_CLOSED_MATCH_STATUSES = new Set([
  'selected',
  'contact_released',
  'accepted',
  'in_progress',
  'completed',
]);

const TRADE_ALIASES: Record<string, string[]> = {
  plumbing: ['plumb', 'plumber', 'plumbers', 'plumbing'],
  electrical: ['electric', 'electrician', 'electricians', 'electrical'],
  building: ['build', 'builder', 'builders', 'building', 'construction'],
  roofing: ['roof', 'roofer', 'roofers', 'roofing'],
  ceiling: ['ceiling', 'ceilings', 'ceiling installer', 'ceiling installation'],
  painting: ['paint', 'painter', 'painters', 'painting'],
  carpentry: ['carpent', 'carpenter', 'carpenters', 'carpentry'],
  tiling: ['tile', 'tiler', 'tilers', 'tiling'],
  welding: ['weld', 'welder', 'welders', 'welding'],
  cleaning: ['clean', 'cleaner', 'cleaners', 'cleaning'],
  automotive: ['auto mechanic', 'automotive', 'mechanic', 'mechanics', 'car repair'],
};

const GENERAL_CONSTRUCTION_ALIASES = [
  'general contractor',
  'general contractors',
  'construction',
  'builder',
  'builders',
  'building contractor',
  'renovation',
  'home improvement',
];

const CONSTRUCTION_FALLBACK_TRADES = new Set([
  'building',
  'roofing',
  'ceiling',
  'painting',
  'carpentry',
  'tiling',
  'welding',
]);

const LOCATION_STOP_WORDS = new Set([
  'street',
  'road',
  'avenue',
  'drive',
  'lane',
  'close',
  'place',
  'unit',
  'house',
  'south',
  'africa',
]);

function normalise(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findTradeSignals(value: string): Set<string> {
  const text = normalise(value);
  const signals = new Set<string>();

  for (const [trade, aliases] of Object.entries(TRADE_ALIASES)) {
    if (aliases.some((alias) => text.includes(alias))) signals.add(trade);
  }

  return signals;
}

function providerMatchesTrade(providerValues: string[], projectSignals: Set<string>): boolean {
  const values = providerValues.map(normalise).filter(Boolean);

  return [...projectSignals].some((trade) =>
    (TRADE_ALIASES[trade] ?? [trade]).some((alias) =>
      values.some((value) => value.includes(alias)),
    ),
  );
}

function isGeneralConstructionProvider(providerValues: string[]): boolean {
  const values = providerValues.map(normalise).filter(Boolean);
  return GENERAL_CONSTRUCTION_ALIASES.some((alias) =>
    values.some((value) => value.includes(alias)),
  );
}

function allowsConstructionFallback(projectSignals: Set<string>): boolean {
  return [...projectSignals].some((trade) => CONSTRUCTION_FALLBACK_TRADES.has(trade));
}

function locationTokens(value: string | null | undefined): string[] {
  return normalise(value)
    .split(' ')
    .filter(
      (token) =>
        token.length >= 4 &&
        !/^\d+$/.test(token) &&
        !LOCATION_STOP_WORDS.has(token),
    );
}

function locationMatches(project: ProjectCandidateRow, providerLocation: string, serviceAreas: string[]): boolean {
  const targets = [project.suburb, project.city, project.location_text]
    .map(normalise)
    .filter(Boolean);
  const providerValues = [providerLocation, ...serviceAreas].map(normalise).filter(Boolean);

  if (
    providerValues.some((providerValue) =>
      targets.some(
        (target) => providerValue.includes(target) || target.includes(providerValue),
      ),
    )
  ) {
    return true;
  }

  const targetTokens = new Set(targets.flatMap(locationTokens));
  return providerValues
    .flatMap(locationTokens)
    .some((token) => targetTokens.has(token));
}

function scoreCandidate(input: {
  project: ProjectCandidateRow;
  projectSignals: Set<string>;
  artisan: ArtisanRow;
  availability?: AvailabilityRow;
  recentHistory: InvitationHistoryRow[];
  alreadyInvited: boolean;
}): { eligible: boolean; score: number; reasons: string[] } {
  const { project, projectSignals, artisan, availability, recentHistory, alreadyInvited } = input;
  let score = 0;
  const reasons: string[] = [];

  const providerValues = [artisan.category ?? '', ...(availability?.categories ?? [])];
  const exactTradeMatch = providerMatchesTrade(providerValues, projectSignals);
  const generalConstructionMatch =
    !exactTradeMatch &&
    allowsConstructionFallback(projectSignals) &&
    isGeneralConstructionProvider(providerValues);

  if (!exactTradeMatch && !generalConstructionMatch && !alreadyInvited) {
    return { eligible: false, score: -1000, reasons: ['Unrelated trade'] };
  }

  if (exactTradeMatch) {
    score += 60;
    reasons.push('Exact trade match');
  } else if (generalConstructionMatch) {
    score += 35;
    reasons.push('General construction fallback');
  } else {
    score -= 60;
    reasons.push('Previously invited before trade filtering');
  }

  if (locationMatches(project, artisan.location ?? '', availability?.service_areas ?? [])) {
    score += 30;
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

  if (
    ['planned', 'large_project'].includes(project.urgency) &&
    availability &&
    !availability.accepts_planned_work
  ) {
    score -= 20;
    reasons.push('Does not accept planned work');
  }

  if (artisan.verified) {
    score += 10;
    reasons.push('Verified profile');
  }

  if (typeof artisan.rating === 'number' && Number.isFinite(artisan.rating)) {
    score += Math.max(0, Math.min(10, artisan.rating * 2));
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

  return { eligible: true, score, reasons };
}

export async function getProviderCandidates(projectId: string): Promise<{
  project: ProjectCandidateRow;
  candidates: ProviderCandidate[];
  routingClosed: boolean;
  routingReason: string | null;
  selectedProviderId: number | null;
}> {
  const supabase = getSupabaseAdmin();

  const [projectResult, matchResult] = await Promise.all([
    supabase
      .from('projects')
      .select('id, title, customer_description, ai_summary, likely_issue, category, urgency, status, location_text, suburb, city')
      .eq('id', projectId)
      .single(),
    supabase
      .from('project_matches')
      .select('provider_id, status, contact_released_at')
      .eq('project_id', projectId)
      .maybeSingle(),
  ]);

  if (projectResult.error) {
    throw new Error(`Unable to load project: ${projectResult.error.message}`);
  }
  if (!projectResult.data) throw new Error('Project not found.');
  if (matchResult.error) {
    throw new Error(`Unable to check current provider selection: ${matchResult.error.message}`);
  }

  const project = projectResult.data as ProjectCandidateRow;
  const match = (matchResult.data as ProjectMatchRow | null) ?? null;
  const routingClosed =
    ROUTING_CLOSED_PROJECT_STATUSES.has(project.status) ||
    Boolean(
      match &&
      (match.contact_released_at !== null || ROUTING_CLOSED_MATCH_STATUSES.has(match.status)),
    );

  if (routingClosed) {
    return {
      project,
      candidates: [],
      routingClosed: true,
      routingReason: match?.contact_released_at
        ? 'Contact details have been released to the selected provider.'
        : 'Provider routing is closed because a provider has already been selected.',
      selectedProviderId: match?.provider_id ?? null,
    };
  }

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

  const projectSignals = findTradeSignals([
    project.category,
    project.title,
    project.customer_description,
    project.ai_summary,
    project.likely_issue,
  ].filter(Boolean).join(' '));

  if (projectSignals.size === 0) {
    const fallbackCategory = normalise(project.category);
    if (fallbackCategory) projectSignals.add(fallbackCategory);
  }

  const candidates = artisans
    .map((artisan): (ProviderCandidate & { eligible: boolean }) => {
      const providerHistory = historyByProvider.get(artisan.id) ?? [];
      const alreadyInvited = providerHistory.some((item) => item.project_id === projectId);
      const providerAvailability = availabilityByProvider.get(artisan.id);
      const { eligible, score, reasons } = scoreCandidate({
        project,
        projectSignals,
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
        eligible,
      };
    })
    .filter((candidate) => candidate.eligible)
    .sort((left, right) => right.score - left.score || left.displayName.localeCompare(right.displayName))
    .slice(0, 20)
    .map(({ eligible: _eligible, ...candidate }) => candidate);

  return {
    project,
    candidates,
    routingClosed: false,
    routingReason: null,
    selectedProviderId: null,
  };
}
