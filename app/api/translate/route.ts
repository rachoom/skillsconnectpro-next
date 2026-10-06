import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { text, targetLanguage = 'en' } = await request.json() as { text?: unknown; targetLanguage?: unknown };
    const value = String(text ?? '').trim();
    const target = String(targetLanguage ?? 'en').trim();
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;

    if (!value || value.length > 5_000 || !/^[a-z-]{2,12}$/i.test(target)) {
      return NextResponse.json({ error: 'Invalid translation request.' }, { status: 400 });
    }
    if (!apiKey) return NextResponse.json({ error: 'Translation is not configured.' }, { status: 503 });

    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: value, target }),
    });
    const data = await response.json() as { data?: { translations?: Array<{ translatedText?: string }> } };
    const translation = data.data?.translations?.[0]?.translatedText;
    if (!response.ok || !translation) return NextResponse.json({ error: 'Translation failed.' }, { status: 502 });
    return NextResponse.json({ translation });
  } catch (error) {
    console.error('POST /api/translate failed:', error);
    return NextResponse.json({ error: 'Translation failed.' }, { status: 500 });
  }
}
