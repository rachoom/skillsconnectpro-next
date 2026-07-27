import DIYvsProCalculator from '@/components/DIYvsProCalculator';

export default function EstimatorPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8 text-center">
          <p className="text-[11px] uppercase tracking-[0.22em] text-gray-400">Home Improvement</p>
          <h1 className="text-3xl font-bold text-white mt-1">AI Project Calculator</h1>
        </div>
        <DIYvsProCalculator />
      </div>
    </main>
  );
}
