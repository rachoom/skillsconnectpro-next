import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
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

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('id,title,location_text')
    .eq('id', projectId)
    .maybeSingle();

  if (projectError || !project) {
    return NextResponse.json({ error: 'Project not found or access denied.' }, { status: 404 });
  }

  const { data: materials, error: materialsError } = await supabase
    .from('project_materials')
    .select('id,name,quantity,unit,notes,status')
    .eq('project_id', projectId)
    .neq('status', 'removed')
    .order('created_at');

  if (materialsError) {
    return NextResponse.json({ error: 'Unable to load project materials.' }, { status: 500 });
  }
  if (!materials?.length) {
    return NextResponse.json({ error: 'Add at least one material before requesting hardware quotations.' }, { status: 400 });
  }

  const { data: allowance } = await supabase
    .from('usage_allowances')
    .select('allowed,used,resets_at')
    .eq('user_id', user.id)
    .eq('allowance_type', 'supplier_quote_requests')
    .maybeSingle();

  if (allowance?.allowed !== null && allowance?.allowed !== undefined && allowance.used >= allowance.allowed) {
    return NextResponse.json({ error: 'Your current plan has no hardware quotation requests remaining.' }, { status: 403 });
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
    return NextResponse.json({ error: 'Unable to copy the materials list into the quotation request.' }, { status: 500 });
  }

  if (allowance) {
    await supabase.from('usage_allowances').update({ used: allowance.used + 1 }).eq('user_id', user.id).eq('allowance_type', 'supplier_quote_requests');
  }

  return NextResponse.json({ id: quoteRequest.id }, { status: 201 });
}
