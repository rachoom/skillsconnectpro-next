import { NextRequest, NextResponse } from 'next/server';
import { createAccountProjectAccessToken } from '@/services/marketplace/accountProjectAccess';
import { getAuthenticatedAccount } from '@/services/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { supabase, user } = await getAuthenticatedAccount();

  if (!user) {
    const next = `/my-projects/${encodeURIComponent(id)}/dashboard`;
    return NextResponse.redirect(new URL(`/sign-in?next=${encodeURIComponent(next)}`, request.url));
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('id,customer_id')
    .eq('id', id)
    .maybeSingle();

  if (error || !project || project.customer_id !== user.id) {
    return NextResponse.redirect(new URL('/my-projects?dashboard=not-authorised', request.url));
  }

  const token = createAccountProjectAccessToken({
    projectId: id,
    userId: user.id,
  });

  const destination = new URL(`/project/${encodeURIComponent(id)}`, request.url);
  destination.searchParams.set('token', token);
  destination.searchParams.set('source', 'my-projects');
  return NextResponse.redirect(destination);
}
