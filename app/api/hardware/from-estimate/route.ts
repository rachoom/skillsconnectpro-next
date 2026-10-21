import { NextResponse } from 'next/server';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { isCustomerPlanLimitError } from '@/services/customerPlanUsage';
import { createProject, updateProjectMedia } from '@/services/marketplace/projects';
import { storeProjectImage } from '@/services/marketplace/projectMedia';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type EstimateMaterial = {
  name?: unknown;
  quantity?: unknown;
  unitCost?: unknown;
  total?: unknown;
};

function cleanText(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function safeNumber(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function parseQuantity(value: unknown): { quantity: number | undefined; unit: string | undefined } {
  const raw = cleanText(value, 120);
  if (!raw) return { quantity: undefined, unit: undefined };
  const match = raw.match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
  if (!match) return { quantity: 1, unit: raw };
  const quantity = Number(match[1]);
  const unit = match[2]?.trim() || 'item';
  return { quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1, unit };
}

export async function POST(request: Request) {
  const { user } = await getAuthenticatedAccount();
  if (!user) return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
  const value = body && typeof body === 'object' && !Array.isArray(body) ? body as Record<string, unknown> : {};
  const description = cleanText(value.description, 2000);
  const service = cleanText(value.service, 120) || 'General Contractor';
  const deliveryArea = cleanText(value.deliveryArea, 160);
  const image = cleanText(value.image, 3_000_000);
  const estimate = value.estimate && typeof value.estimate === 'object' && !Array.isArray(value.estimate)
    ? value.estimate as Record<string, unknown>
    : {};

  if (description.length < 3 || !deliveryArea) {
    return NextResponse.json({ error: 'Project description and delivery area are required.' }, { status: 400 });
  }

  const rawMaterials = Array.isArray(estimate.materialsList) ? estimate.materialsList.slice(0, 30) as EstimateMaterial[] : [];
  const materials = rawMaterials
    .map((item, index) => {
      const name = cleanText(item?.name, 180) || `Material ${index + 1}`;
      const parsed = parseQuantity(item?.quantity);
      const unitPrice = safeNumber(item?.unitCost);
      const total = safeNumber(item?.total);
      return {
        name,
        quantity: parsed.quantity,
        unit: parsed.unit,
        estimatedUnitPrice: unitPrice ?? undefined,
        estimatedTotal: total ?? undefined,
      };
    })
    .filter((item) => item.name);

  if (!materials.length) {
    return NextResponse.json({
      error: 'This estimate has no itemised materials to send to hardware stores. Add or refine the materials first.',
    }, { status: 400 });
  }

  const total = safeNumber(estimate.trueCost) ?? safeNumber(estimate.materials) ?? 0;
  const range = total > 0 ? Math.round(total * 0.1) : 0;

  let created: Awaited<ReturnType<typeof createProject>>;
  try {
    created = await createProject({
      customerId: user.id,
      title: `${service} materials project`,
      customerDescription: description,
      aiSummary: 'Created from the AI Project Assistant for materials procurement only.',
      likelyIssue: description,
      category: service,
      urgency: 'planned',
      serviceLevel: 'free',
      locationText: deliveryArea,
      estimatedMin: total > 0 ? Math.max(0, total - range) : null,
      estimatedMax: total > 0 ? total + range : null,
      estimateCurrency: 'ZAR',
      confidence: 0.75,
      professionalInspectionRequired: true,
      safetyNotes: ['Hardware quotations confirm supplier pricing only. Final quantities and installation scope should be checked before purchase.'],
      materials,
      assessmentPayload: {
        intakeOrigin: 'calculator_hardware_quote',
        procurementOnly: true,
        estimateType: cleanText(estimate.estimateType, 30) || 'standardized',
        toolsEstimate: safeNumber(estimate.tools),
        labourEstimate: safeNumber(estimate.laborTotal),
      },
      sourceChannel: 'web',
      consentToShare: false,
    });
  } catch (error) {
    if (isCustomerPlanLimitError(error, 'ACTIVE_PROJECTS')) {
      return NextResponse.json({
        error: 'You already have the active projects included with your current plan. Upgrade to keep this procurement project and its quotes together.',
        code: 'ACTIVE_PROJECT_LIMIT',
        upgradeUrl: '/plans#homeowners',
      }, { status: 403 });
    }
    console.error('Unable to create procurement project:', error);
    return NextResponse.json({ error: 'Unable to save this procurement project.' }, { status: 500 });
  }

  const { project } = created;

  let mediaStored = false;
  if (image) {
    try {
      const stored = await storeProjectImage(project.id, image, `Reference image for ${project.title}`);
      if (stored) {
        await updateProjectMedia(project.id, [stored]);
        mediaStored = true;
      }
    } catch (error) {
      console.error('Procurement project image could not be stored:', error);
    }
  }

  return NextResponse.json({ projectId: project.id, mediaStored }, { status: 201 });
}
