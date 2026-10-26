import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { phoneValidationMessage } from '@/services/marketplace/intakePolicy.js';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson, PublicRequestError } from '@/services/publicRequestGuard';

export const runtime = 'nodejs';
const BUCKET = 'provider-application-proofs';
const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 1_500_000;
const MAX_BODY_BYTES = 4_400_000;

async function readFormWithinLimit(request: Request): Promise<FormData> {
  if (!request.body) throw new PublicRequestError('An application is required.', 400);
  const chunks: Buffer[] = [];
  let size = 0;
  const reader = request.body.getReader();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new PublicRequestError('Too many or overly large photos. Please use up to three smaller images.', 413);
    }
    chunks.push(Buffer.from(value));
  }
  return new Request(request.url, {
    method: 'POST',
    headers: { 'content-type': request.headers.get('content-type') || '' },
    body: Buffer.concat(chunks),
  }).formData();
}

function clean(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

export async function POST(request: Request) {
  const uploaded: string[] = [];
  let saved = false;
  try {
    const blocked = await enforcePublicRequestLimit(request, 'provider_application', 5);
    if (blocked) return blocked;

    const isMultipart = (request.headers.get('content-type') || '').toLowerCase().startsWith('multipart/form-data');
    const form = isMultipart ? await readFormWithinLimit(request) : null;
    const json = form ? null : await readBoundedJson(request, 10_000);
    const pick = (key: string) => form ? form.get(key) : json?.[key];

    const name = clean(pick('name'), 120);
    const trade = clean(pick('trade'), 100);
    const phone = clean(pick('phone'), 40);
    const location = clean(pick('location'), 120);
    if (!name || !trade || !location || phoneValidationMessage(phone)) {
      return NextResponse.json({ error: 'A name, trade, valid phone number and service area are required.' }, { status: 400 });
    }

    const photos = form?.getAll('workPhotos') ?? [];
    if (photos.length > MAX_PHOTOS) throw new PublicRequestError('Please select at most three work photos.', 400);
    if (photos.length && pick('photoConsent') !== 'true') {
      throw new PublicRequestError('Please confirm you have permission to share these work photos.', 400);
    }

    const buffers: Buffer[] = [];
    for (const entry of photos) {
      if (!(entry instanceof File) || entry.type !== 'image/jpeg' || !entry.size || entry.size > MAX_PHOTO_BYTES) {
        throw new PublicRequestError('Work photos must be JPEG images smaller than 1.5 MB.', 400);
      }
      const buffer = Buffer.from(await entry.arrayBuffer());
      if (buffer.length < 4 || buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
        throw new PublicRequestError('One work photo is not a valid JPEG image.', 400);
      }
      buffers.push(buffer);
    }

    const supabase = getSupabaseAdmin();
    const folder = randomUUID();
    for (let index = 0; index < buffers.length; index += 1) {
      const path = folder + '/work-' + (index + 1) + '.jpg';
      const { error } = await supabase.storage.from(BUCKET).upload(path, buffers[index], {
        contentType: 'image/jpeg', upsert: false, cacheControl: '0',
      });
      if (error) throw error;
      uploaded.push(path);
    }

    // Public visitors can apply without signing in; existing authenticated
    // accounts retain their link for subsequent provider-role activation.
    const { user } = await getAuthenticatedAccount();
    const referral = clean(pick('referralSource'), 80);
    const referralSource = /^[a-zA-Z0-9:_-]{1,80}$/.test(referral) ? referral : 'join:direct';
    const { error } = await supabase.from('artisan_applications').insert({
      first_name: name, last_name: '', trade, phone, location, status: 'pending',
      bio: 'Submitted through the provider photo application.',
      user_id: user?.id ?? null,
      referral_source: referralSource,
      portfolio_images: uploaded,
    });
    if (error) throw error;
    saved = true;
    return NextResponse.json({ submitted: true, status: 'pending', workPhotoCount: uploaded.length }, { status: 201 });
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('Provider application could not be saved:', error instanceof Error ? error.message : 'unknown error');
    return NextResponse.json({ error: 'Unable to save your application. Please try again.' }, { status: 503 });
  } finally {
    if (!saved && uploaded.length) {
      await getSupabaseAdmin().storage.from(BUCKET).remove(uploaded).catch(() => undefined);
    }
  }
}
