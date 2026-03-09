// src/services/translationService.ts

// Assuming you are using Vite, so we use import.meta.env
// If you are using Create React App, change this to process.env.REACT_APP_GOOGLE_CLOUD_API_KEY
const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_CLOUD_API_KEY; 

export const translateText = async (text: string, targetLanguage: string = 'en') => {
  if (!API_KEY) {
    console.error("Google Cloud API Key is missing!");
    return null;
  }

  try {
    const response = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
        console.error("Google Translation API Error:", data.error.message);
        return null;
    }

    // Google returns an array of translations, we want the first one
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error("Translation request failed:", error);
    return null;
  }
};