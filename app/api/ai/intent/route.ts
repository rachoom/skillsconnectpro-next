import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

function model() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Gemini is not configured.');
  return new GoogleGenAI({ apiKey });
}

function cleanJson(text: string) {
  return JSON.parse(text.replace(/^```json\s*|\s*```$/gi, '').trim());
}

export async function POST(request: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(request, 'ai_intent', 20);
    if (blocked) return blocked;
    const body = await readBoundedJson(request, 1600000) as Record<string, unknown>;
    const type = body.type;
    const ai = model();

    if (type === 'image') {
      const image = String(body.image ?? '');
      if (!image || image.length > 1_000_000) return NextResponse.json({ error: 'Invalid image.' }, { status: 400 });
      const mimeType = String(body.mimeType ?? 'image/jpeg');
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: [
          { inlineData: { mimeType, data: image.includes(',') ? image.split(',').pop() ?? '' : image } },
          'Identify the trade (Electrician, Plumber, etc). Return ONLY JSON: {"category":"Name"}.',
        ],
        config: { responseMimeType: 'application/json' },
      });
      return NextResponse.json(cleanJson(response.text ?? '{}'));
    }

    if (type === 'transcript') {
      const transcript = String(body.transcript ?? '').slice(0, 2_000);
      if (!transcript) return NextResponse.json({ error: 'Transcript is required.' }, { status: 400 });
      const response = await ai.models.generateContent({
        model: 'gemini-flash-latest',
        contents: `Parse: "${transcript}". Return ONLY JSON {"intent":"search","category":"Name"}.`,
        config: { responseMimeType: 'application/json' },
      });
      return NextResponse.json(cleanJson(response.text ?? '{}'));
    }

    return NextResponse.json({ error: 'Unsupported AI request.' }, { status: 400 });
  } catch (error) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error('POST /api/ai/intent failed:', error);
    return NextResponse.json({ error: 'AI request failed.' }, { status: 500 });
  }
}
