import { NextResponse } from 'next/server';
import { isCronAuthorised } from '@/services/marketplace/cronAuth';
import { requireMarketplaceAdmin } from '@/services/marketplace/adminAuth';
import { bodyComponent, getMetaWhatsAppConfiguration, publicMarketplaceUrl, sendMetaWhatsAppTemplate } from '@/services/marketplace/metaWhatsApp';
import { getWhatsAppAutomationReadiness } from '@/services/marketplace/whatsappReadiness';
import { normaliseWhatsAppRecipient, isPlausibleWhatsAppRecipient } from '@/services/marketplace/whatsappPolicy.js';
import { enforcePublicRequestLimit } from '@/services/publicRequestGuard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// No caller-supplied recipient or project data is accepted. Test recipient
// configuration requires the owner's explicit approval and is currently unset.
export async function POST(request: Request) {
  try {
    let authorised = false;
    try { requireMarketplaceAdmin(request); authorised = true; } catch { /* Check cron credential below. */ }
    if (!authorised) authorised = await isCronAuthorised(request);
    if (!authorised) return NextResponse.json({ error: 'Unauthorised.' }, { status: 401 });
    const recipient = normaliseWhatsAppRecipient(process.env.MARKETPLACE_CONTROLLED_TEST_WHATSAPP_NUMBER);
    const config = getMetaWhatsAppConfiguration('Controlled provider template test');
    const readiness = getWhatsAppAutomationReadiness();
    if (!config || !isPlausibleWhatsAppRecipient(recipient) || !readiness.provider.configured) {
      return NextResponse.json({ error: 'Controlled test recipient and provider template must be configured.' }, { status: 503 });
    }
    const blocked = await enforcePublicRequestLimit(request, 'controlled_whatsapp_test', 1, 86_400);
    if (blocked) return blocked;
    const delivery = await sendMetaWhatsAppTemplate({
      config, to: recipient,
      templateName: readiness.provider.templateName!, templateLanguage: readiness.provider.templateLanguage!,
      components: [bodyComponent(['Controlled test', 'System delivery test', 'Test only',
        'Skills Connect Pro automation test — no work or response required',
        'Test only — no appointment', publicMarketplaceUrl()])],
    });
    return NextResponse.json({ delivery }, { status: delivery.status === 'sent' ? 200 : 502 });
  } catch {
    console.error('Controlled WhatsApp test failed.');
    return NextResponse.json({ error: 'Controlled WhatsApp test failed.' }, { status: 503 });
  }
}
