export async function analyzeImageIntent(base64Image: string, mimeType = 'image/jpeg') {
  const response = await fetch('/api/ai/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'image', image: base64Image, mimeType }),
  });

  if (!response.ok) return { category: 'Unknown' };
  return response.json();
}

export async function analyzeIntent(transcript: string) {
  const response = await fetch('/api/ai/intent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'transcript', transcript }),
  });

  if (!response.ok) return { intent: 'search', category: 'Unknown' };
  return response.json();
}
