export async function getGeminiResponse(prompt: string) {
  const response = await fetch('/api/ai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error('AI service is unavailable.');
  const data = await response.json();
  return data.result as string | undefined;
}

export async function getConstructionEstimate(prompt: string) {
  const response = await fetch('/api/estimate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error('Estimate service is unavailable.');
  const data = await response.json();
  return JSON.parse(data.estimate ?? '{}');
}
