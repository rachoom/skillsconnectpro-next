import DIYvsProCalculator from '@/components/DIYvsProCalculator';

export default function EstimatorPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Project Cost Estimator
        </h1>
        <DIYvsProCalculator />
      </div>
    </main>
  );
}
