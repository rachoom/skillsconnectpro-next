export const translateText = async (text: string, targetLanguage: string = 'en') => {
  try {
    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        targetLanguage,
      }),
    });

    const data = await response.json();
    return response.ok ? data.translation ?? null : null;
  } catch (error) {
    console.error('Translation request failed:', error);
    return null;
  }
};
