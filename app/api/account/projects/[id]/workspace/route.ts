import { NextResponse } from 'next/server';
import { requireProjectWorkspaceAccess } from '@/services/projectWorkspaceAccess';

function finiteNumber(value: unknown) {
  const number = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function uuidLike(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  if (!uuidLike(projectId)) return NextResponse.json({ error: 'Invalid project.' }, { status: 400 });

  const access = await requireProjectWorkspaceAccess(projectId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body || typeof body.action !== 'string') {
    return NextResponse.json({ error: 'Invalid workspace request.' }, { status: 400 });
  }

  const { admin, user } = access;

  if (body.action === 'update_project_status') {
    const nextStatus = body.status === 'completed' || body.status === 'cancelled' ? body.status : null;
    if (!nextStatus) {
      return NextResponse.json({ error: 'Choose completed or cancelled.' }, { status: 400 });
    }

    const now = new Date().toISOString();
    const { error: projectError } = await admin
      .from('projects')
      .update({ status: nextStatus, updated_at: now })
      .eq('id', projectId);

    if (projectError) return NextResponse.json({ error: projectError.message }, { status: 400 });

    // Once a project is closed, providers should not keep receiving/responding
    // to still-open invitations for it.
    const { error: invitationError } = await admin
      .from('lead_invitations')
      .update({ status: 'cancelled', updated_at: now })
      .eq('project_id', projectId)
      .in('status', ['queued', 'sent', 'delivered', 'viewed']);

    if (invitationError) {
      console.error('Project close invitation cleanup failed:', invitationError.message);
    }

    if (nextStatus === 'cancelled') {
      const { error: matchError } = await admin
        .from('project_matches')
        .update({ status: 'cancelled', updated_at: now })
        .eq('project_id', projectId)
        .in('status', ['selected', 'contact_released', 'accepted', 'in_progress']);
      if (matchError) console.error('Project cancellation match cleanup failed:', matchError.message);
    } else {
      const { error: matchError } = await admin
        .from('project_matches')
        .update({ status: 'completed', completion_reported_at: now, updated_at: now })
        .eq('project_id', projectId)
        .in('status', ['selected', 'contact_released', 'accepted', 'in_progress']);
      if (matchError) console.error('Project completion match cleanup failed:', matchError.message);
    }

    return NextResponse.json({ ok: true, status: nextStatus });
  }

  if (body.action === 'update_estimate') {
    const min = body.min === null || body.min === '' ? null : finiteNumber(body.min);
    const max = body.max === null || body.max === '' ? null : finiteNumber(body.max);
    if ((min !== null && min < 0) || (max !== null && max < 0) || (min !== null && max !== null && min > max)) {
      return NextResponse.json({ error: 'Enter a valid project range.' }, { status: 400 });
    }
    const { error } = await admin.from('projects').update({
      estimated_min: min,
      estimated_max: max,
      updated_at: new Date().toISOString(),
    }).eq('id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'add_material') {
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 180) : '';
    const quantity = finiteNumber(body.quantity);
    const unitPrice = body.unitPrice === null || body.unitPrice === '' ? null : finiteNumber(body.unitPrice);
    if (!name || quantity === null || quantity <= 0 || (unitPrice !== null && unitPrice < 0)) {
      return NextResponse.json({ error: 'Add a material name and valid quantity.' }, { status: 400 });
    }
    const { data, error } = await admin.from('project_materials').insert({
      project_id: projectId,
      name,
      quantity,
      unit: 'item',
      estimated_unit_price: unitPrice,
      estimated_total: unitPrice === null ? null : quantity * unitPrice,
      created_by: user.id,
    }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  }

  if (body.action === 'remove_material') {
    if (!uuidLike(body.itemId)) return NextResponse.json({ error: 'Invalid material.' }, { status: 400 });
    const { error } = await admin.from('project_materials').update({
      status: 'removed',
      updated_at: new Date().toISOString(),
    }).eq('id', body.itemId).eq('project_id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'add_milestone') {
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 180) : '';
    const sortOrder = Math.max(0, Math.trunc(finiteNumber(body.sortOrder) ?? 0));
    if (!title) return NextResponse.json({ error: 'Add a milestone title.' }, { status: 400 });
    const { data, error } = await admin.from('project_milestones').insert({
      project_id: projectId,
      title,
      sort_order: sortOrder,
      created_by: user.id,
    }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  }

  if (body.action === 'toggle_milestone') {
    if (!uuidLike(body.itemId)) return NextResponse.json({ error: 'Invalid milestone.' }, { status: 400 });
    const nextStatus = body.status === 'completed' ? 'completed' : 'not_started';
    const { error } = await admin.from('project_milestones').update({
      status: nextStatus,
      completed_at: nextStatus === 'completed' ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq('id', body.itemId).eq('project_id', projectId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'add_expense') {
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 220) : '';
    const amount = finiteNumber(body.amount);
    if (!description || amount === null || amount < 0) {
      return NextResponse.json({ error: 'Add an expense description and valid amount.' }, { status: 400 });
    }
    const { data, error } = await admin.from('project_expenses').insert({
      project_id: projectId,
      description,
      category: 'other',
      amount,
      created_by: user.id,
    }).select('*').single();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ item: data });
  }

  return NextResponse.json({ error: 'Unsupported workspace action.' }, { status: 400 });
}
