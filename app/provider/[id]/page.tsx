import { redirect } from 'next/navigation';

type ProviderSharePageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProviderSharePage({ params, searchParams }: ProviderSharePageProps) {
  const { id } = await params;
  const query = await searchParams;

  if (!/^\d+$/.test(id)) redirect('/browse-providers');

  const destination = new URLSearchParams({ provider: id, ref: 'provider-share' });

  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']) {
    const value = query[key];
    if (typeof value === 'string' && value.trim()) destination.set(key, value.trim());
  }

  redirect(`/browse-providers?${destination.toString()}`);
}
