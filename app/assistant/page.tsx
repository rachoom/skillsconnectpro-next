import type { Metadata } from 'next';
import { HomeImprovementAssistant } from '@/components/HomeImprovementAssistant';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export const metadata: Metadata = {
  title: 'AI Home Improvement Assistant | Skills Connect Pro',
  description: 'Describe, photograph or speak about a home-improvement project. Get practical guidance, a preliminary estimate and a tracked route to suitable East Rand professionals.',
};

const firstValue = (value: string | string[] | undefined) =>
  Array.isArray(value) ? value[0] || '' : value || '';

export default async function AssistantPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <HomeImprovementAssistant
      initialPrompt={firstValue(params.prompt)}
      initialIntent={firstValue(params.intent)}
    />
  );
}
