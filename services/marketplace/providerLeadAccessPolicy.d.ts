export const DEFAULT_FREE_LEAD_LIMIT: number;
export const PROVIDER_SUBSCRIPTION_PLANS: Array<{
  code: string;
  name: string;
  price: number;
  cadence: string;
  description: string;
}>;
export const PROVIDER_LEAD_PACKS: Array<{
  code: string;
  name: string;
  price: number;
  credits: number;
}>;

export function parseFreeLeadLimit(value: unknown): number;
export function activeEntitlement(entitlements: unknown[], now?: Date): unknown | null;
export function buildProviderLeadAccess(input?: {
  usedFreeLeads?: number;
  freeLeadLimit?: number;
  entitlements?: unknown[];
  now?: Date;
}): {
  freeLeadLimit: number;
  freeLeadsUsed: number;
  freeLeadsRemaining: number;
  hasPaidAccess: boolean;
  locked: boolean;
  activePlan: {
    id?: string;
    code: string;
    type: 'subscription' | 'lead_pack';
    remaining?: number;
    qualifiedLeadsUsed?: number;
    qualifiedLeadsLimit?: number;
  } | null;
};
