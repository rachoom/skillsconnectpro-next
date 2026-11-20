import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';

export const dynamic = 'force-dynamic';

const inactiveProjectStatuses = new Set(['completed', 'cancelled']);

export async function GET() {
  const { supabase, user } = await getAuthenticatedAccount();

  if (!user) {
    return NextResponse.json(
      { authenticated: false, latestProject: null, providerAccess: false },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const [{ data: projects, error: projectError }, { data: roles, error: roleError }] = await Promise.all([
    supabase
      .from('projects')
      .select('id,title,category,status,location_text,updated_at')
      .order('updated_at', { ascending: false })
      .limit(8),
    supabase
      .from('account_roles')
      .select('role,status,linked_artisan_id')
      .eq('user_id', user.id),
  ]);

  if (projectError || roleError) {
    return NextResponse.json(
      {
        authenticated: true,
        latestProject: null,
        providerAccess: false,
        partial: true,
      },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  }

  const latestProject = (projects ?? []).find(
    (project) => !inactiveProjectStatuses.has(String(project.status ?? '').toLowerCase()),
  );

  const providerAccess = (roles ?? []).some(
    (role) => role.role === 'artisan' && role.status === 'active' && Boolean(role.linked_artisan_id),
  );

  return NextResponse.json(
    {
      authenticated: true,
      providerAccess,
      latestProject: latestProject
        ? {
            id: latestProject.id,
            title: latestProject.title,
            category: latestProject.category,
            status: latestProject.status,
            locationText: latestProject.location_text,
            updatedAt: latestProject.updated_at,
          }
        : null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } },
  );
}
