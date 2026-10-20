import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function servesArea(areas: string[] | null, deliveryArea: string) {
  if (!areas?.length) return true;
  const target = deliveryArea.toLowerCase();
  return areas.some((area) => {
    const normalised = area.trim().toLowerCase();
    return normalised === target || target.includes(normalised) || normalised.includes(target);
  });
}

export async function POST(request: Request) {
  const { supabase, user } = await getAuthenticatedAccount();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const value = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const projectId = text(value.projectId, 80);
  const deliveryArea = text(value.deliveryArea, 160);
  const notes = text(value.notes, 1200) || null;

  if (!projectId || !deliveryArea) {
    return NextResponse.json({ error: 'Project and delivery area are required.' }, { status: 400 });
  }

  const [{ data: project, error: projectError }, { data: materials, error: materialsError }, { data: partners, error: partnersError }] = await Promise.all([
    supabase.from('projects').select('id,title,location_text').eq('id', projectId).maybeSingle(),
    supabase.from('project_materials').select('id,name,quantity,unit,notes,status').eq('project_id', projectId).neq('status', 'removed').order('created_at'),
    supabase.from('hardware_partners').select('id,service_areas').eq('status', 'active'),
  ]);

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied.' }, { status: 404 });
  }
  if (materialsError) {
    return NextResponse.json({ error: 'Unable to load project materials.' }, { status: 500 });
  }
  if (!materials?.length) {
    return NextResponse.json({ error: 'Add at least one material before requesting hardware quotations.' }, { status: 400 });
  }
  if (partnersError) {
    return NextResponse.json({ error: 'Unable to check participating hardware stores.' }, { status: 503 });
  }

  const eligible = (partners ?? []).filter((partner) => servesArea(partner.service_areas, deliveryArea)).slice(0, 5);
  const admin = getSupabaseAdmin();
  let allowanceConsumed = false;

  if (eligible.length) {
    const { data: allowanceResult, error: allowanceError } = await admin.rpc('consume_supplier_quote_allowance', {
      target_user_id: user.id,
    });
    const allowance = Array.isArray(allowanceResult) ? allowanceResult[0] : allowanceResult;
    if (allowanceError) {
      console.error('Unable to consume supplier quote allowance:', allowanceError.message);
      return NextResponse.json({ error: 'Unable to verify your hardware quotation allowance.' }, { status: 503 });
    }
    if (!allowance?.is_allowed) {
      return NextResponse.json({
        error: 'You have used the hardware quotation requests included with your current plan.',
        upgradeUrl: '/plans#homeowners',
      }, { status: 403 });
    }
    allowanceConsumed = true;
  }

  const { data: quoteRequest, error: requestError } = await supabase
    .from('material_quote_requests')
    .insert({
      project_id: projectId,
      requested_by: user.id,
      request_title: `${project.title} materials`,
      delivery_area: deliveryArea,
      notes,
      status: 'open',
    })
    .select('id')
    .single();

  if (requestError || !quoteRequest) {
    if (allowanceConsumed) await admin.rpc('release_supplier_quote_allowance', { target_user_id: user.id });
    return NextResponse.json({ error: requestError?.message ?? 'Unable to create quotation request.' }, { status: 500 });
  }

  const items = materials.map((item, index) => ({
    request_id: quoteRequest.id,
    project_material_id: item.id,
    description: item.name,
    quantity: item.quantity,
    unit: item.unit,
    notes: item.notes,
    sort_order: index,
  }));

  const { error: itemsError } = await supabase.from('material_quote_request_items').insert(items);
  if (itemsError) {
    await supabase.from('material_quote_requests').update({ status: 'cancelled' }).eq('id', quoteRequest.id);
    if (allowanceConsumed) await admin.rpc('release_supplier_quote_allowance', { target_user_id: user.id });
    return NextResponse.json({ error: 'Unable to copy the materials list into the quotation request.' }, { status: 500 });
  }

  if (eligible.length) {
    const { error: inviteError } = await supabase.from('hardware_quote_invitations').insert(
      eligible.map((partner) => ({ request_id: quoteRequest.id, partner_id: partner.id })),
    );
    if (inviteError) {
      await supabase.from('material_quote_requests').update({ status: 'cancelled' }).eq('id', quoteRequest.id);
      if (allowanceConsumed) await admin.rpc('release_supplier_quote_allowance', { target_user_id: user.id });
      return NextResponse.json({ error: 'Unable to send this request to hardware partners.' }, { status: 500 });
    }
  }

  return NextResponse.json({
    id: quoteRequest.id,
    invitedPartners: eligible.length,
    allowanceUsed: allowanceConsumed,
    message: eligible.length
      ? `Request sent to ${eligible.length} participating hardware partner${eligible.length === 1 ? '' : 's'}.`
      : 'Your quotation request was saved, but there are no eligible participating hardware partners in that area yet. Your plan allowance was not used.',
  }, { status: 201 });
}
