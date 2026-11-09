import { notFound } from 'next/navigation';
import { growthSandboxEnabled } from '@/services/payments/sandboxGrowthTest';
import { GrowthSandboxReturn } from './growth-sandbox-return';
export const dynamic = 'force-dynamic';
export default async function GrowthSandboxReturnPage({ searchParams }: {
  searchParams: Promise<{ payment?: string; cancelled?: string }>;
}) {
  if (!growthSandboxEnabled()) notFound();
  const { payment, cancelled } = await searchParams;
  return <GrowthSandboxReturn reference={payment || null} cancelled={cancelled === '1'}/>;
}
