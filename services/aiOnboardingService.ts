// src/services/aiOnboardingService.ts
export interface ExtractedArtisan {
  success: boolean;
  name?: string;
  trade?: string;
  phone?: string;
  location?: string;
  reason?: string;
}

export const extractBusinessCard = async (base64Image: string, mimeType: string): Promise<ExtractedArtisan> => {
  try {
    const response = await fetch('/api/onboarding/extract-card', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image, mimeType }),
    });

    if (!response.ok) throw new Error('API Processing Error');
    return response.json();
  } catch (error: unknown) {
    console.error('AI Extraction Failed:', error);
    return { success: false, reason: 'processing_error' };
  }
};
