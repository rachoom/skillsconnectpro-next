// src/services/aiOnboardingService.ts
import { supabase } from './supabase'; // Assuming you need this later, or just use the API key

// Using your dedicated Gemini API key
const API_KEY = "AIzaSyAjaXrOUa3jVKH_ZD7amk2CVK5lEuEXB_8";

export interface ExtractedArtisan {
  success: boolean;
  name?: string;
  trade?: string;
  phone?: string;
  location?: string;
  reason?: string;
}

export const extractBusinessCard = async (base64Image: string, mimeType: string): Promise<ExtractedArtisan> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `
                You are an ultra-strict data validator and OCR engine for a South African artisan directory.
                Analyze the provided image (which should be a business card, flyer, or handwritten advert).
                
                YOUR INSTRUCTIONS:
                1. IF the image is NOT a business-related card, flyer, or list of services (e.g., it's a selfie, a meme, landscape, or inappropriate), you MUST reject it.
                   Return ONLY: { "success": false, "reason": "invalid_image_type" }
                2. If it IS valid, extract the following:
                   - name: The person's name or business name.
                   - trade: The main service they provide (e.g., Plumber, Electrician, Builder, Welder, Painter). Standardize this to a single primary trade.
                   - phone: Extract the phone number. Format it cleanly (e.g., 082 123 4567).
                   - location: Any mentioned East Rand towns (e.g., Tsakane, Springs, Brakpan, KwaThema). If none is found, return "East Rand".
                
                Return ONLY valid JSON. No markdown, no conversational text.
                Format: { "success": true, "name": "...", "trade": "...", "phone": "...", "location": "..." }
              `
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }]
      })
    });

    clearTimeout(timeoutId);

   if (!response.ok) {
      const errorText = await response.text();
      console.error("🛑 Gemini Onboarding API Error:", errorText);
      throw new Error("API Processing Error");
    }

    const data = await response.json();
    let aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiText) throw new Error("Empty AI response");

    return JSON.parse(aiText.replace(/```json|```/g, "").trim());
  } catch (error: any) {
    if (error.name === 'AbortError') {
      return { success: false, reason: "network_timeout" };
    }
    console.error("AI Extraction Failed:", error);
    return { success: false, reason: "processing_error" };
  }
};