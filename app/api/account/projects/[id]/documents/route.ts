import { NextResponse } from 'next/server';
import { requireProjectWorkspaceAccess } from '@/services/projectWorkspaceAccess';

const ALLOWED_TYPES = new Set(['image/jpeg','image/png','image/webp','application/pdf','text/plain']);

function uuidLike(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  if (!uuidLike(projectId)) return NextResponse.json({ error: 'Invalid project.' }, { status: 400 });

  const access = await requireProjectWorkspaceAccess(projectId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a document to upload.' }, { status: 400 });
  if (file.size <= 0 || file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: 'Documents must be 10 MB or smaller.' }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Use PDF, JPG, PNG, WEBP or text files.' }, { status: 400 });
  }

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-').slice(-120) || 'document';
  const storagePath = `${projectId}/${crypto.randomUUID()}-${safeName}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { admin, user } = access;
  const { error: uploadError } = await admin.storage.from('project-documents').upload(storagePath, bytes, {
    upsert: false,
    contentType: file.type,
  });
  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 400 });

  const { data, error } = await admin.from('project_documents').insert({
    project_id: projectId,
    uploaded_by: user.id,
    file_name: file.name.slice(0, 240),
    storage_path: storagePath,
    mime_type: file.type,
    size_bytes: file.size,
    document_type: file.type.startsWith('image/') ? 'photo' : file.type === 'application/pdf' ? 'floor_plan' : 'other',
  }).select('*').single();

  if (error || !data) {
    await admin.storage.from('project-documents').remove([storagePath]);
    return NextResponse.json({ error: error?.message ?? 'Unable to save document.' }, { status: 400 });
  }

  return NextResponse.json({ item: data });
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  if (!uuidLike(projectId)) return NextResponse.json({ error: 'Invalid project.' }, { status: 400 });

  const access = await requireProjectWorkspaceAccess(projectId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const url = new URL(request.url);
  const path = url.searchParams.get('path') ?? '';
  if (!path.startsWith(`${projectId}/`)) return NextResponse.json({ error: 'Invalid document path.' }, { status: 400 });

  const { data, error } = await access.admin.storage.from('project-documents').createSignedUrl(path, 60);
  if (error || !data?.signedUrl) return NextResponse.json({ error: error?.message ?? 'Unable to open document.' }, { status: 400 });
  return NextResponse.json({ url: data.signedUrl });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: projectId } = await params;
  if (!uuidLike(projectId)) return NextResponse.json({ error: 'Invalid project.' }, { status: 400 });

  const access = await requireProjectWorkspaceAccess(projectId);
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const body = await request.json().catch(() => null) as { id?: string; storagePath?: string } | null;
  if (!body || !uuidLike(body.id) || typeof body.storagePath !== 'string' || !body.storagePath.startsWith(`${projectId}/`)) {
    return NextResponse.json({ error: 'Invalid document.' }, { status: 400 });
  }

  const { admin } = access;
  const { data: row } = await admin.from('project_documents')
    .select('id,storage_path')
    .eq('id', body.id)
    .eq('project_id', projectId)
    .maybeSingle();

  if (!row || row.storage_path !== body.storagePath) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 });
  }

  const { error } = await admin.from('project_documents').delete().eq('id', body.id).eq('project_id', projectId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  await admin.storage.from('project-documents').remove([body.storagePath]);

  return NextResponse.json({ ok: true });
}
