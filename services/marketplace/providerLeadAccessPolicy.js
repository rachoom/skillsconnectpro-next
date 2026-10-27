export const PROVIDER_SUBSCRIPTION_PLANS = [
  {
    code: 'starter_monthly',
    name: 'Starter',
    price: 49,
    cadence: 'month',
    description: 'Keep receiving local customer opportunities.',
  },
  {
    code: 'growth_monthly',
    name: 'Growth',
    price: 99,
    cadence: 'month',
    description: 'Standard provider access; higher-tier visibility is not yet enabled.',
  },
  {
    code: 'pro_monthly',
    name: 'Pro',
    price: 199,
    cadence: 'month',
    description: 'Standard provider access; Pro priority ranking is not yet enabled.',
  },
];

export const PROVIDER_LEAD_PACKS = [
  { code: 'lead_pack_4', name: '4 lead credits', price: 99, credits: 4 },
  { code: 'lead_pack_10', name: '10 lead credits', price: 199, credits: 10 },
  { code: 'lead_pack_25', name: '25 lead credits', price: 399, credits: 25 },
];

export const DEFAULT_FREE_LEAD_LIMIT = 3;

export function parseFreeLeadLimit(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : DEFAULT_FREE_LEAD_LIMIT;
}

export function activeEntitlement(entitlements, now = new Date()) {
  const currentTime = now.getTime();
  return (entitlements || []).find((entitlement) => {
    if (!['trial', 'active'].includes(String(entitlement.status || '').toLowerCase())) return false;
    if (entitlement.starts_at && new Date(entitlement.starts_at).getTime() > currentTime) return false;
    if (entitlement.ends_at && new Date(entitlement.ends_at).getTime() <= currentTime) return false;
    return true;
  }) || null;
}

export function buildProviderLeadAccess({
  usedFreeLeads = 0,
  freeLeadLimit = DEFAULT_FREE_LEAD_LIMIT,
  entitlements = [],
  now,
} = {}) {
  const subscriptionCodes = new Set(PROVIDER_SUBSCRIPTION_PLANS.map((plan) => plan.code));
  const leadPackCodes = new Set(PROVIDER_LEAD_PACKS.map((pack) => pack.code));
  const activeEntitlements = (entitlements || []).filter((entitlement) => activeEntitlement([entitlement], now));
  const paidSubscription = activeEntitlements.find((entitlement) => subscriptionCodes.has(entitlement.plan_code)) || null;
  const leadPack = activeEntitlements.find((entitlement) => (
    leadPackCodes.has(entitlement.plan_code)
    && Number(entitlement.qualified_leads_used || 0) < Number(entitlement.qualified_leads_limit || 0)
  )) || null;
  const leadPackRemaining = leadPack
    ? Math.max(0, Number(leadPack.qualified_leads_limit || 0) - Number(leadPack.qualified_leads_used || 0))
    : 0;
  const normalisedLimit = parseFreeLeadLimit(freeLeadLimit);
  const freeLeadsUsed = Math.min(Math.max(0, usedFreeLeads), normalisedLimit);
  const freeLeadsRemaining = Math.max(0, normalisedLimit - freeLeadsUsed);
  const hasPaidAccess = Boolean(paidSubscription) || leadPackRemaining > 0;

  return {
    freeLeadLimit: normalisedLimit,
    freeLeadsUsed,
    freeLeadsRemaining,
    hasPaidAccess,
    locked: freeLeadsRemaining === 0 && !hasPaidAccess,
    activePlan: paidSubscription
      ? { id: paidSubscription.id, code: paidSubscription.plan_code, type: 'subscription' }
      : leadPack
        ? {
            id: leadPack.id,
            code: leadPack.plan_code,
            type: 'lead_pack',
            remaining: leadPackRemaining,
            qualifiedLeadsUsed: Number(leadPack.qualified_leads_used || 0),
            qualifiedLeadsLimit: Number(leadPack.qualified_leads_limit || 0),
          }
        : null,
  };
}
