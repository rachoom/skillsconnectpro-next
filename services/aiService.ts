import { GoogleGenAI } from '@google/genai';

const b = String.fromCharCode(96, 96, 96);

export async function analyzeImageIntent(base64Image: string, mimeType = 'image/jpeg') {
  try {
    const key = process.env.NEXT_PUBLIC_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: key });
    const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    const res = await ai.models.generateContent({
      model: 'gemini-flash-latest', // Upgraded model!
      contents: [
        { inlineData: { mimeType, data: cleanBase64 } },
        "Identify the trade (Electrician, Plumber, etc). Return ONLY JSON: { \"category\": \"Name\" }"
      ],
      config: { responseMimeType: "application/json" }
    });
    
    const responseText = res.text ?? '{}';
    return JSON.parse(responseText.replace(new RegExp(b + 'json|' + b, 'gi'), '').trim());
  } catch (error) { return { category: "Unknown" }; }
}

export async function analyzeIntent(transcript: string) {
  try {
    const key = process.env.NEXT_PUBLIC_GEMINI_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    const ai = new GoogleGenAI({ apiKey: key });
    const res = await ai.models.generateContent({
      model: 'gemini-flash-latest', // Upgraded model!
      contents: `Parse: "${transcript}". Return ONLY JSON { "intent": "search", "category": "Name" }`,
      config: { responseMimeType: "application/json" }
    });
    const responseText = res.text ?? '{}';
    return JSON.parse(responseText.replace(new RegExp(b + 'json|' + b, 'gi'), '').trim());
  } catch (error) { return { intent: "search", category: "Unknown" }; }
}
