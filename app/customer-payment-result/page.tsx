import { CustomerPaymentReturnExperience } from './payment-return-experience';

export const dynamic = 'force-dynamic';
export default async function CustomerPaymentResultPage({ searchParams }: {
  searchParams: Promise<{ payment?: string; cancelled?: string }>;
}) {
  const { payment, cancelled } = await searchParams;
  return <CustomerPaymentReturnExperience paymentReference={payment} cancelled={cancelled === '1'} />;
}
