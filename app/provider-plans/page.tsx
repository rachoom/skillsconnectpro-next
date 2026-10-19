import { redirect } from 'next/navigation';

export default async function ProviderPlansPage({ searchParams }: { searchParams: Promise<{ provider?: string }> }) {
  const { provider } = await searchParams;
  const query = provider && /^\d+$/.test(provider) ? `?provider=${encodeURIComponent(provider)}` : '';
  redirect(`/plans${query}#providers`);
}
