import type { Metadata } from 'next';
import { Suspense } from 'react';
import { QuickProviderRequest } from '../../components/QuickProviderRequest';

export const metadata: Metadata = {
  title: 'Quick Request | Skills Connect Pro',
  description: 'Request an available local professional with a short, no-AI service form. Emergency and direct-invite options.',
};

export default function QuickRequestPage() {
  return <Suspense fallback={<main className="min-h-screen bg-[#0c100e] text-white p-8">Opening Quick Request…</main>}>
    <QuickProviderRequest />
  </Suspense>;
}
