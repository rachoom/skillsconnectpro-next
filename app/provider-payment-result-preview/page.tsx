import { notFound } from 'next/navigation';
import { ProviderPaymentReturnExperience } from '../provider-payment-result/payment-return-experience';

export const dynamic = 'force-dynamic';

// Visual review only, never enabled on the public production website.
// This route uses sample data and cannot mark or create payments.
export default async function ProviderPaymentPreviewPage({
  searchParams,
}: { searchParams: Promise<{ state?: string }> }) {
  if (process.env.VERCEL_ENV !== 'preview') notFound();
  const { state } = await searchParams;
  const demoState = state === 'confirmed' || state === 'cancelled' ? state : 'processing';
  return <ProviderPaymentReturnExperience demoState={demoState} />;
}
