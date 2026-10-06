import { GoogleGenAI } from '@google/genai';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const maxDuration = 30;

const prompt = `You are an ultra-strict data validator and OCR engine for a South African artisan directory.
Analyse the uploaded image. It must be a business card, flyer, or list of services. Reject selfies, memes, landscapes, and unrelated images.
If valid, extract the person's or business name, primary trade, phone number, and an East Rand location when supplied. Use "East Rand" when no location is supplied.
Return ONLY JSON in one of these forms:
{"success":false,"reason":"invalid_image_type"}
{"success":true,"name":"...","trade":"...","phone":"...","location":"..."}`;

export async function POST(request: Request) {
  try {
    const { image, mimeType = 'image/jpeg' } = await request.json() as { image?: unknown; mimeType?: unknown };
    const data = String(image ?? '');
    if (!data || data.length > 1_500_000) return NextResponse.json({ error: 'Invalid image.' }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'Gemini is not configured.' }, { status: 503 });

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: [{ parts: [
        { text: prompt },
        { inlineData: { mimeType: String(mimeType), data: data.includes(',') ? data.split(',').pop() ?? '' : data } },
      ] }],
      config: { responseMimeType: 'application/json' },
    });

    return NextResponse.json(JSON.parse((response.text ?? '{}').replace(/^```json\s*|\s*```$/gi, '').trim()));
  } catch (error) {
    console.error('POST /api/onboarding/extract-card failed:', error);
    return NextResponse.json({ error: 'Could not process the business card.' }, { status: 500 });
  }
}
