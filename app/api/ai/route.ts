import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key is not configured on the server." }, { status: 501 });
    }

    const { image, rate, details, taskType } = await req.json();
    
    // Initialize the official modern Google Gen AI SDK
    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = "Analyze this image for a local service marketplace.";
    if (taskType === 'estimate' || rate) {
      prompt = `You are an expert local trade estimator. Analyze this work site or job photo. 
      The artisan's hourly rate is R${rate || '0'}. Provide a professional, concise breakdown including:
      1. Estimated hours required
      2. Material considerations
      3. Total estimated cost breakdown in South African Rand (ZAR).
      Additional context: ${details || 'None provided'}`;
    }

    // Clean up base64 data prefix if present
    const cleanBase64 = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: [
        prompt,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cleanBase64
          }
        }
      ]
    });

    return NextResponse.json({ result: response.text });
  } catch (error: any) {
    console.error("AI Route Error:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
