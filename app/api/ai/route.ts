import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    
    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const body = await req.json();
    
    const prompt = body.prompt || body.details || "Analyze this image.";
    const imageStr = body.image || body.base64Image || "";

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
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
