import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/services/supabaseAdmin';
import { phoneValidationMessage } from '@/services/marketplace/intakePolicy.js';
import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await readBoundedJson(request, 10_000);
    const text = (value: unknown, max: number) => typeof value === 'string' ? value.trim().slice(0, max) : '';
    const name = text(body.name, 120), trade = text(body.trade, 100);
    const phone = text(body.phone, 40), location = text(body.location, 120);
    if (!name || !trade || !location || phoneValidationMessage(phone)) {
      return NextResponse.json({ error: 'A name, trade, valid phone number and service area are required.' }, { status: 400 });
    }
    const blocked = await enforcePublicRequestLimit(request, 'provider_application', 5);
    if (blocked) return blocked;
    const { error } = await getSupabaseAdmin().from('artisan_applications').insert({
      first_name: name, last_name: '', trade, phone, location, status: 'pending',
      bio: 'Submitted through the provider photo application.',
    });
    if (error) throw error;
    return NextResponse.json({ submitted: true, status: 'pending' }, { status: 201 });
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('Provider application could not be saved.');
    return NextResponse.json({ error: 'Unable to save your application. Please try again.' }, { status: 503 });
  }
}
