import { redirect } from 'next/navigation';
import { getProviderPlan } from '../planCatalog';

export default async function ProviderPlanLegacyPage({
  params,
  searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ provider?: string }>;
}) {
  const { plan: slug } = await params;
  const { provider } = await searchParams;
  const plan = getProviderPlan(slug);
  const providerId = provider && /^\d+$/.test(provider) ? provider : '';

  if (!plan) {
    redirect(providerId
      ? `/plans?audience=providers&provider=${encodeURIComponent(providerId)}`
      : '/plans?audience=providers');
  }

  redirect(`/provider-checkout?plan=${encodeURIComponent(plan.slug)}${providerId ? `&provider=${encodeURIComponent(providerId)}` : ''}`);
}
