export const CUSTOMER_PROJECTS_STORAGE_KEY = 'scp-customer-projects-v1';

export type StoredCustomerProject = {
  id: string;
  token: string;
  title: string;
  category: string | null;
  status: string | null;
  locationText: string | null;
  createdAt: string | null;
  lastOpenedAt: string;
};

type RememberCustomerProjectInput = {
  id: string;
  token: string;
  title?: string | null;
  category?: string | null;
  status?: string | null;
  locationText?: string | null;
  createdAt?: string | null;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function safeText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normaliseEntry(value: unknown): StoredCustomerProject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const item = value as Record<string, unknown>;
  const id = safeText(item.id);
  const token = safeText(item.token);
  if (!id || token.length < 20) return null;

  return {
    id,
    token,
    title: safeText(item.title, 'Customer project') || 'Customer project',
    category: safeText(item.category) || null,
    status: safeText(item.status) || null,
    locationText: safeText(item.locationText) || null,
    createdAt: safeText(item.createdAt) || null,
    lastOpenedAt: safeText(item.lastOpenedAt) || new Date(0).toISOString(),
  };
}

export function listCustomerProjects(): StoredCustomerProject[] {
  if (!isBrowser()) return [];
  try {
    const raw = window.localStorage.getItem(CUSTOMER_PROJECTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(normaliseEntry)
      .filter((item): item is StoredCustomerProject => Boolean(item))
      .sort((a, b) => new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime())
      .slice(0, 30);
  } catch {
    return [];
  }
}

export function rememberCustomerProject(input: RememberCustomerProjectInput): StoredCustomerProject | null {
  if (!isBrowser()) return null;
  const id = safeText(input.id);
  const token = safeText(input.token);
  if (!id || token.length < 20) return null;

  const current = listCustomerProjects();
  const existing = current.find((item) => item.id === id);
  const entry: StoredCustomerProject = {
    id,
    token,
    title: safeText(input.title) || existing?.title || 'Customer project',
    category: safeText(input.category) || existing?.category || null,
    status: safeText(input.status) || existing?.status || null,
    locationText: safeText(input.locationText) || existing?.locationText || null,
    createdAt: safeText(input.createdAt) || existing?.createdAt || null,
    lastOpenedAt: new Date().toISOString(),
  };

  const next = [entry, ...current.filter((item) => item.id !== id)].slice(0, 30);
  try {
    window.localStorage.setItem(CUSTOMER_PROJECTS_STORAGE_KEY, JSON.stringify(next));
    return entry;
  } catch {
    return null;
  }
}

export function removeCustomerProject(id: string): void {
  if (!isBrowser()) return;
  const next = listCustomerProjects().filter((item) => item.id !== id);
  try {
    window.localStorage.setItem(CUSTOMER_PROJECTS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // A storage failure should not block the rest of the customer journey.
  }
}

export function customerProjectHref(project: Pick<StoredCustomerProject, 'id' | 'token'>): string {
  return `/project/${encodeURIComponent(project.id)}?token=${encodeURIComponent(project.token)}`;
}
