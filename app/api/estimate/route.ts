import { enforcePublicRequestLimit, publicRequestError, readBoundedJson } from '@/services/publicRequestGuard';
import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const maxDuration = 60; // Allow maximum processing time

export async function POST(req: Request) {
  try {
    const blocked = await enforcePublicRequestLimit(req, 'estimate', 20);
    if (blocked) return blocked;
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "Missing API Key" }, { status: 500 });

    const ai = new GoogleGenAI({ apiKey: apiKey as string });
    const body = await readBoundedJson(req, 1600000);
    const prompt = typeof body.prompt === "string" ? body.prompt.slice(0, 8000) : "General project";
    const imageStr = typeof body.image === "string" ? body.image : "";
    const qaHistory = Array.isArray(body.qaHistory) ? body.qaHistory.slice(0, 9) : [];
    const qaContext = qaHistory
      .map((item: any) => {
        const question = String(item?.question || '').trim().slice(0, 500);
        const answer = String(item?.answer || '').trim().slice(0, 1000);
        if (!question || !answer) return null;
        return `- ${question}: ${answer}`;
      })
      .filter(Boolean)
      .join('\n');

    const contents: any[] = [
      `Act as an expert construction estimator in South Africa. Analyze this project: "${prompt}".${qaContext ? ` Additional confirmed details:\n${qaContext}` : ''} Return ONLY valid JSON with realistic costs in ZAR and actionable follow-up guidance. Use this exact structure and keys: {"materials":[{"name":"Cement 42.5N","quantity":"4 bags","unitCost":120,"total":480}],"materialsTotal":1500,"toolsNeeded":300,"laborHours":8,"laborNotes":"Optional short note","recommendedService":"Plumber","estimateType":"standardized","clarifyingQuestions":[{"question":"What size is the area?","options":["Small area (up to 10 m²)","Medium area (10–25 m²)","Large area (25–50 m²)","Not sure yet"]}]}. Rules: (1) materials must be an array with at least 3 items when enough context exists, (2) each material must include name, quantity, unitCost, total, (3) numbers only for costs/hours, no currency symbols, (4) materialsTotal must equal the sum of material totals, (5) estimateType must be "standardized" if details are incomplete, otherwise "refined", (6) add 2-4 clarifyingQuestions when details are incomplete, (7) every clarifying question must be an object with a concise question and 3-5 mutually exclusive, tap-to-select options; never request free-text answers or numerical typing, (8) include "Not sure" where helpful, (9) if details are sufficient return clarifyingQuestions as an empty array, (10) recommendedService must be a practical artisan trade label such as Plumber, Electrician, Builder, Painter, Cleaner, Tiler.`
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

    const responseText = response.text || '{"materials":[],"materialsTotal":0,"toolsNeeded":0,"laborHours":4,"laborNotes":"","recommendedService":"General Contractor","estimateType":"standardized","clarifyingQuestions":[]}';
    return NextResponse.json({ estimate: responseText });

  } catch (error: any) {
    const invalid = publicRequestError(error);
    if (invalid) return invalid;
    console.error("Backend Error:", error);
    return NextResponse.json({ error: "AI service is temporarily unavailable. Please try again." }, { status: 500 });
  }
}
