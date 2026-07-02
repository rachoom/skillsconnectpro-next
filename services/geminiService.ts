import { GoogleGenAI } from '@google/genai';

export async function getGeminiResponse(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('Missing GEMINI_API_KEY');

  const ai = new GoogleGenAI({ apiKey: key });
  const res = await ai.models.generateContent({
    model: 'gemini-1.5-flash-8b',
    contents: prompt,
  });

  return res.text;
}

export async function getConstructionEstimate(prompt: string) {
  const key = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey: key as string });
  
  const res = await ai.models.generateContent({
    model: 'gemini-1.5-flash-8b',
    contents: `Act as a construction estimator. Analyze: "${prompt}". Return JSON with: materialsTotal, toolsNeeded, laborTotal, riskBuffer.`,
    config: { responseMimeType: "application/json" }
  });
  
  const responseText = res.text ?? '{}';
  return JSON.parse(responseText.replace(/```json|```/g, '').trim());
}
