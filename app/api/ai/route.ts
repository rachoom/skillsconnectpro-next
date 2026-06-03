import { NextResponse } from 'next/server';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

const buildVisionPayload = (base64Image: string, mimeType: string) => ({
  generationConfig: { responseMimeType: 'application/json' },
  contents: [{
    parts: [
      {
        inlineData: {
          mimeType,
          data: base64Image.includes(',') ? base64Image.split(',')[1] : base64Image,
        },
      },
      {
        text: `
          You are a master South African artisan inspector. 
          Look at this image and tell me:
          1. What is broken or needs fixing? (Short description, e.g. "Burnt wall socket")
          2. What TRADE is needed? (Choose ONLY from: Plumber, Electrician, Builder, Mechanic, Welder, Painter, Tiler, Carpenter, Locksmith, Appliance Repair).
          Format as JSON: { "trade": "string or null", "problem": "string", "success": true }
        `,
      },
    ],
  }],
});

const buildIntentPayload = (userText: string) => ({
  generationConfig: { responseMimeType: 'application/json' },
  contents: [{
    parts: [{
      text: `
        You are a search assistant. Map the user's problem to a TRADE and LOCATION.
        Trades: Plumber, Electrician, Builder, Mechanic, Welder, Painter, Tiler, Carpenter, Locksmith.
        Examples: "Geyser burst in Tsakane" -> { "trade": "Plumber", "location": "Tsakane" }
        Return ONLY JSON.
        User: "${userText}"
      `,
    }],
  }],
});

export async function POST(request: Request) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return NextResponse.json({ error: 'Missing GEMINI_API_KEY on server' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { type, userText, base64Image, mimeType } = body as {
    type?: string;
    userText?: string;
    base64Image?: string;
    mimeType?: string;
  };

  if (type !== 'vision' && type !== 'intent') {
    return NextResponse.json({ error: 'Invalid ai request type' }, { status: 400 });
  }

  if (type === 'vision' && (!base64Image || !mimeType)) {
    return NextResponse.json({ error: 'Missing image payload' }, { status: 400 });
  }

  if (type === 'intent' && !userText) {
    return NextResponse.json({ error: 'Missing userText payload' }, { status: 400 });
  }

  try {
    const payload = type === 'vision'
      ? buildVisionPayload(base64Image!, mimeType!)
      : buildIntentPayload(userText!);

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const resultText = await response.text();
    if (!response.ok) {
      console.error('🛑 Gemini Proxy Error:', resultText);
      return new Response(resultText, { status: response.status, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(resultText, { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('🛑 Gemini Proxy Exception:', error);
    return NextResponse.json({ error: 'Server failed to contact Gemini' }, { status: 502 });
  }
}
