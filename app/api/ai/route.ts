import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(req, 'ai', 20);
    if (blocked) return blocked;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const body = await readBoundedJson(req, 1600000);
    
    const prompt = typeof (body.prompt || body.details) === "string" ? String(body.prompt || body.details).slice(0, 8000) : "Analyze this image.";
    const imageStr = typeof (body.image || body.base64Image) === "string" ? String(body.image || body.base64Image) : "";

    const contents: any[] = [prompt];

    if (imageStr) {
      const cleanBase64 = imageStr.includes(',') ? imageStr.split(',')[1] : imageStr;
      contents.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest', // Upgraded model!
      contents: contents,
      config: { responseMimeType: "application/json" }
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
