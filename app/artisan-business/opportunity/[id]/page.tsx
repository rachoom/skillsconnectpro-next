import { redirect } from 'next/navigation';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { ProviderOpportunityWorkspace } from './opportunity-workspace';

export const dynamic = 'force-dynamic';

export default async function ProviderBusinessOpportunityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, user } = await getAuthenticatedAccount();

  if (!user) {
    redirect(`/sign-in?next=${encodeURIComponent(`/artisan-business/opportunity/${id}`)}`);
  }

  const { data: role } = await supabase
    .from('account_roles')
    .select('linked_artisan_id')
    .eq('user_id', user.id)
    .eq('role', 'artisan')
    .eq('status', 'active')
    .not('linked_artisan_id', 'is', null)
    .limit(1)
    .maybeSingle();

  if (!role?.linked_artisan_id) redirect('/artisan-business');

  return <ProviderOpportunityWorkspace invitationId={id} />;
}
