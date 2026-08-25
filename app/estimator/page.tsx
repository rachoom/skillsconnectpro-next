import DIYvsProCalculator from '@/components/DIYvsProCalculator';

type Props = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EstimatorPage({ searchParams }: Props) {
  const params = await searchParams;
  const descriptionValue = params.description;
  const initialDescription = Array.isArray(descriptionValue)
    ? descriptionValue[0] || ''
    : descriptionValue || '';

  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400">Home Improvement</p>
          <h1 className="text-3xl font-bold text-white mt-1">AI Project Assistant</h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.18em] text-brand-yellow">Home Improvement Calculator</p>
        </div>
        <DIYvsProCalculator initialDescription={initialDescription} />
      </div>
    </main>
  );
}
