import { NextResponse } from 'next/server';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { getWhatsAppAutomationReadiness } from '@/services/marketplace/whatsappReadiness';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    requireMarketplaceAdmin(request);
    return NextResponse.json({ readiness: getWhatsAppAutomationReadiness() });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to check WhatsApp readiness.';
    const unauthorised = error instanceof Error && error.name === 'UnauthorisedError';
    const configurationError = message.includes('MARKETPLACE_ADMIN_API_KEY');

    console.error('GET /api/admin/whatsapp/readiness failed:', error);

    return NextResponse.json(
      {
        error: unauthorised
          ? 'Unauthorised.'
          : configurationError
            ? 'Marketplace service is not configured.'
            : message,
      },
      { status: unauthorised ? 401 : configurationError ? 503 : 400 },
    );
  }
}
