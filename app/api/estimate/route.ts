import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Allow maximum processing time

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const body = await req.json();
    const prompt = body.prompt || "General project";
    const imageStr = body.image || "";

    const contents: any[] = [
      `Act as an expert construction estimator. Analyze this project: "${prompt}". Return ONLY a valid JSON object with realistic estimated costs in South African Rand (ZAR). Format EXACTLY like this: {"materialsTotal": 1500, "toolsNeeded": 300, "laborHours": 8}.`
    ];

    if (imageStr) {
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: imageStr.includes(',') ? imageStr.split(',')[1] : imageStr
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: contents,
      config: { responseMimeType: "application/json" }
    });

    const responseText = response.text || '{"materialsTotal": 0, "toolsNeeded": 0, "laborHours": 4}';
    return NextResponse.json({ estimate: responseText });

  } catch (error: any) {
    console.error("Backend Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
