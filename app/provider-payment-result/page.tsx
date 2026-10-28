import { ProviderPaymentReturnExperience } from './payment-return-experience';

export const dynamic = 'force-dynamic';

export default async function ProviderPaymentResultPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; cancelled?: string }>;
}) {
  const { payment, cancelled } = await searchParams;
  return <ProviderPaymentReturnExperience
    paymentReference={payment}
    cancelled={cancelled === '1'}
  />;
}
