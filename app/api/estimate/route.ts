import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { customerProjectUsage, readAiResponseCache, releaseAiUsage, reserveAiUsage, settleAiUsage, type UsageReservation, withAiUsageCookie, writeAiResponseCache } from '@/services/aiUsageGuard';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

type EstimatePayload = {
  materials?: Array<{ name?: unknown; quantity?: unknown; unitCost?: unknown; total?: unknown }>;
  materialsTotal?: unknown;
  toolsNeeded?: unknown;
  laborHours?: unknown;
  laborNotes?: unknown;
  recommendedService?: unknown;
  estimateType?: unknown;
  clarifyingQuestions?: unknown[];
};

function cleanModelJson(text: string): EstimatePayload | null {
  try {
    const cleaned = text.replace(/^\s*```json\s*|\s*```\s*$/gi, '').trim();
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as EstimatePayload : null;
  } catch {
    return null;
  }
}

function materialJob(prompt: string) {
  return /(paint|primer|tile|grout|plaster|brick|cement|build|wall|roof|ceiling|floor|pave|door|window|pipe|plumb|geyser|toilet|tap|wiring|electric|socket|fence|deck|cabinet|cupboard)/i.test(prompt);
}

function usableEstimate(text: string, prompt: string) {
  const parsed = cleanModelJson(text);
  if (!parsed) return false;
  const materials = Array.isArray(parsed.materials)
    ? parsed.materials.filter((item) => String(item?.name || '').trim())
    : [];
  const questions = Array.isArray(parsed.clarifyingQuestions) ? parsed.clarifyingQuestions.filter(Boolean) : [];
  if (materialJob(prompt)) return materials.length > 0 || questions.length > 0;
  return true;
}

function baselineEstimate(prompt: string): EstimatePayload | null {
  const lower = prompt.toLowerCase();

  if (/(paint|primer|wall coat)/.test(lower)) {
    return {
      materials: [
        { name: 'Interior wall paint', quantity: '10 L', unitCost: 1200, total: 1200 },
        { name: 'Primer / sealer', quantity: '5 L', unitCost: 550, total: 550 },
        { name: 'Wall filler', quantity: '2 kg', unitCost: 180, total: 180 },
        { name: 'Masking tape', quantity: '2 rolls', unitCost: 50, total: 100 },
        { name: 'Sandpaper', quantity: '1 pack', unitCost: 120, total: 120 },
      ],
      materialsTotal: 2150,
      toolsNeeded: 250,
      laborHours: 8,
      laborNotes: 'Standardized painting baseline used because the AI response was incomplete. Refine with room size and surface condition for a better estimate.',
      recommendedService: 'Painter',
      estimateType: 'standardized',
      clarifyingQuestions: [
        { question: 'How large is the area to be painted?', options: ['Small area (up to 10 m²)', 'Medium area (10–25 m²)', 'Large area (25–50 m²)', 'Not sure yet'] },
        { question: 'What condition is the surface in?', options: ['Good condition', 'Minor cracks or peeling', 'Damp or damaged', 'Not sure'] },
        { question: 'Is this indoors or outdoors?', options: ['Indoors', 'Outdoors', 'Both', 'Not sure'] },
      ],
    };
  }

  if (/(tile|grout)/.test(lower)) {
    return {
      materials: [
        { name: 'Tiles', quantity: '10 m²', unitCost: 220, total: 2200 },
        { name: 'Tile adhesive', quantity: '2 x 20 kg bags', unitCost: 180, total: 360 },
        { name: 'Grout', quantity: '5 kg', unitCost: 180, total: 180 },
        { name: 'Tile spacers', quantity: '1 pack', unitCost: 80, total: 80 },
      ],
      materialsTotal: 2820,
      toolsNeeded: 250,
      laborHours: 8,
      laborNotes: 'Standardized tiling baseline used because the AI response was incomplete. Refine with the exact tiled area and tile size.',
      recommendedService: 'Tiler',
      estimateType: 'standardized',
      clarifyingQuestions: [
        { question: 'How large is the area to be tiled?', options: ['Up to 10 m²', '10–25 m²', '25–50 m²', 'Not sure yet'] },
        { question: 'What surface will be tiled?', options: ['Floor', 'Wall', 'Both', 'Not sure'] },
      ],
    };
  }

  if (/(roof|ibr|roofing)/.test(lower)) {
    return {
      materials: [
        { name: 'IBR roof sheets', quantity: '6 sheets', unitCost: 400, total: 2400 },
        { name: 'Roofing screws with washers', quantity: '1 box', unitCost: 250, total: 250 },
        { name: 'Ridge / flashing allowance', quantity: '1 lot', unitCost: 300, total: 300 },
        { name: 'Timber battens', quantity: '6 lengths', unitCost: 150, total: 900 },
      ],
      materialsTotal: 3850,
      toolsNeeded: 300,
      laborHours: 10,
      laborNotes: 'Standardized roofing baseline used because the AI response was incomplete. Final quantities depend on roof dimensions, pitch and sheet length.',
      recommendedService: 'Builder',
      estimateType: 'standardized',
      clarifyingQuestions: [
        { question: 'What is the approximate roof size?', options: ['Small (up to 20 m²)', 'Medium (20–50 m²)', 'Large (50–100 m²)', 'Not sure yet'] },
        { question: 'Is this a new roof or replacement?', options: ['New roof', 'Replacement', 'Repair / partial replacement', 'Not sure'] },
      ],
    };
  }

  if (/(plaster|brick|cement|build|wall)/.test(lower)) {
    return {
      materials: [
        { name: 'Cement 42.5N', quantity: '4 bags', unitCost: 140, total: 560 },
        { name: 'Building / plaster sand', quantity: '0.5 m³', unitCost: 450, total: 450 },
        { name: 'Bricks / blocks allowance', quantity: '200 units', unitCost: 2.5, total: 500 },
        { name: 'Waterproofing / bonding allowance', quantity: '1 lot', unitCost: 250, total: 250 },
      ],
      materialsTotal: 1760,
      toolsNeeded: 300,
      laborHours: 10,
      laborNotes: 'Standardized masonry baseline used because the AI response was incomplete. Refine with wall dimensions and whether this is new work or repair.',
      recommendedService: 'Builder',
      estimateType: 'standardized',
      clarifyingQuestions: [
        { question: 'What size is the work area?', options: ['Small (up to 10 m²)', 'Medium (10–25 m²)', 'Large (25–50 m²)', 'Not sure yet'] },
        { question: 'What type of work is needed?', options: ['New wall / structure', 'Plastering', 'Repair', 'Not sure'] },
      ],
    };
  }

  if (/(pipe|plumb|geyser|toilet|tap)/.test(lower)) {
    return {
      materials: [
        { name: 'Pipe / tubing allowance', quantity: '10 m', unitCost: 35, total: 350 },
        { name: 'Plumbing fittings allowance', quantity: '1 lot', unitCost: 400, total: 400 },
        { name: 'Isolation valve', quantity: '1', unitCost: 180, total: 180 },
        { name: 'PTFE thread tape', quantity: '2 rolls', unitCost: 40, total: 80 },
      ],
      materialsTotal: 1010,
      toolsNeeded: 200,
      laborHours: 4,
      laborNotes: 'Standardized plumbing baseline used because the AI response was incomplete. Exact fittings depend on the fault and pipe type.',
      recommendedService: 'Plumber',
      estimateType: 'standardized',
      clarifyingQuestions: [
        { question: 'What kind of plumbing work is this?', options: ['Leak repair', 'New installation', 'Fixture replacement', 'Not sure'] },
        { question: 'What pipe type is involved?', options: ['Copper', 'PVC / plastic', 'Mixed / other', 'Not sure'] },
      ],
    };
  }

  if (/(wiring|electric|socket|power|light)/.test(lower)) {
    return {
      materials: [
        { name: 'Electrical cable allowance', quantity: '20 m', unitCost: 25, total: 500 },
        { name: 'Conduit / trunking', quantity: '10 m', unitCost: 20, total: 200 },
        { name: 'Electrical accessory allowance', quantity: '1 lot', unitCost: 300, total: 300 },
        { name: 'Connectors / terminals', quantity: '1 pack', unitCost: 120, total: 120 },
      ],
      materialsTotal: 1120,
      toolsNeeded: 250,
      laborHours: 5,
      laborNotes: 'Standardized electrical baseline used because the AI response was incomplete. A qualified electrician should confirm cable size and protection requirements.',
      recommendedService: 'Electrician',
      estimateType: 'standardized',
      clarifyingQuestions: [
        { question: 'What type of electrical work is needed?', options: ['New socket / light', 'Wiring extension', 'Fault repair', 'Not sure'] },
        { question: 'How far is the new wiring likely to run?', options: ['Under 5 m', '5–15 m', 'More than 15 m', 'Not sure'] },
      ],
    };
  }

  if (/(ceiling|gypsum|drywall)/.test(lower)) {
    return {
      materials: [
        { name: 'Gypsum ceiling boards', quantity: '4 boards', unitCost: 180, total: 720 },
        { name: 'Brandering / battens', quantity: '10 lengths', unitCost: 80, total: 800 },
        { name: 'Drywall screws', quantity: '1 box', unitCost: 150, total: 150 },
        { name: 'Jointing compound', quantity: '5 kg', unitCost: 180, total: 180 },
      ],
      materialsTotal: 1850,
      toolsNeeded: 250,
      laborHours: 8,
      laborNotes: 'Standardized ceiling baseline used because the AI response was incomplete. Refine with ceiling dimensions and board type.',
      recommendedService: 'Builder',
      estimateType: 'standardized',
      clarifyingQuestions: [
        { question: 'What is the approximate ceiling area?', options: ['Up to 10 m²', '10–25 m²', '25–50 m²', 'Not sure yet'] },
      ],
    };
  }

  return null;
}

export async function POST(req: Request) {
  let reservation: UsageReservation | null = null;
  try {
    const blocked = await enforcePublicRequestLimit(req, 'estimate', 20);
    if (blocked) return blocked;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey });
    const body = await readBoundedJson(req, 1600000);
    const prompt = typeof body.prompt === 'string' ? body.prompt.slice(0, 3000) : 'General project';
    const imageStr = typeof body.image === 'string' ? body.image : '';
    const qaHistory = Array.isArray(body.qaHistory) ? body.qaHistory.slice(0, 9) : [];
    const qaContext = qaHistory
      .map((item: any) => {
        const question = String(item?.question || '').trim().slice(0, 500);
        const answer = String(item?.answer || '').trim().slice(0, 500);
        if (!question || !answer) return null;
        return `- ${question}: ${answer}`;
      })
      .filter(Boolean)
      .join('\n');

    // Version the cache source so previously cached empty/truncated estimates are ignored.
    const cacheSource = JSON.stringify({ version: 2, prompt, image: imageStr, qaHistory });
    const cachedEstimate = await readAiResponseCache<{ estimate?: string }>('estimate', cacheSource);
    if (cachedEstimate?.estimate && usableEstimate(cachedEstimate.estimate, prompt)) {
      return NextResponse.json(cachedEstimate);
    }

    const guarded = await reserveAiUsage(req, customerProjectUsage(Boolean(imageStr)));
    if (!guarded.allowed) return guarded.response;
    reservation = guarded.reservation;

    const contents: any[] = [
      `Act as an expert construction estimator in South Africa. Analyze this project: "${prompt}".${qaContext ? ` Additional confirmed details:\n${qaContext}` : ''} Return ONLY concise valid JSON with realistic costs in ZAR. Use exactly these keys: {"materials":[{"name":"Cement 42.5N","quantity":"4 bags","unitCost":120,"total":480}],"materialsTotal":1500,"toolsNeeded":300,"laborHours":8,"laborNotes":"Optional short note","recommendedService":"Plumber","estimateType":"standardized","clarifyingQuestions":[{"question":"What size is the area?","options":["Small area (up to 10 m²)","Medium area (10–25 m²)","Large area (25–50 m²)","Not sure yet"]}]}. Rules: (1) for any job that normally needs physical materials, NEVER return an empty materials array; if dimensions are incomplete, provide a conservative standardized baseline material list with provisional quantities and ask clarifying questions, (2) provide at least 3 material items for material-bearing jobs, (3) each material must include name, quantity, unitCost and total, (4) numbers only for costs/hours, no currency symbols, (5) materialsTotal must equal the sum of material totals, (6) estimateType is "standardized" if assumptions are needed and "refined" when details are sufficient, (7) add 2-4 concise multiple-choice clarifying questions when details are incomplete, (8) never ask for free-text or numerical typing in clarifying questions, (9) include "Not sure" where useful, (10) keep the JSON compact and under the token limit, (11) recommendedService must be a practical trade label such as Plumber, Electrician, Builder, Painter, Cleaner or Tiler.`
    ];

    if (imageStr) {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageStr.includes(',') ? imageStr.split(',')[1] : imageStr,
        },
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: { responseMimeType: 'application/json', maxOutputTokens: 1600 },
    });

    await settleAiUsage(reservation, 'gemini-3.6-flash', response);

    let responseText = response.text?.trim() || '';
    if (!usableEstimate(responseText, prompt)) {
      const fallback = baselineEstimate(prompt);
      if (!fallback) {
        console.warn('Estimator returned unusable output', {
          hasText: Boolean(responseText),
          outputTokens: (response as any)?.usageMetadata?.candidatesTokenCount ?? null,
          finishReason: (response as any)?.candidates?.[0]?.finishReason ?? null,
        });
        return withAiUsageCookie(
          NextResponse.json({ error: 'The estimator could not build a reliable materials list. Please add a little more project detail and try again.' }, { status: 502 }),
          reservation,
        );
      }
      responseText = JSON.stringify(fallback);
    }

    await writeAiResponseCache('estimate', cacheSource, { estimate: responseText });
    return withAiUsageCookie(NextResponse.json({ estimate: responseText }), reservation);
  } catch (error: any) {
    await releaseAiUsage(reservation);
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('Backend Error:', error);
    return NextResponse.json({ error: 'AI service is temporarily unavailable. Please try again.' }, { status: 500 });
  }
}
