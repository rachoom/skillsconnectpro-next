import { redirect } from 'next/navigation';

export default async function ProviderPlansPage({
  searchParams,
}: {
  searchParams: Promise<{ provider?: string }>;
}) {
  const { provider } = await searchParams;
  const providerId = provider && /^\d+$/.test(provider) ? provider : '';
  redirect(providerId
    ? `/plans?audience=providers&provider=${encodeURIComponent(providerId)}`
    : '/plans?audience=providers');
}
