import { notFound } from 'next/navigation';
import { growthSandboxEnabled } from '@/services/payments/sandboxGrowthTest';
import { GrowthSandboxCheckout } from './sandbox-checkout';

export const dynamic = 'force-dynamic';
export default function GrowthSandboxTestPage() {
  if (!growthSandboxEnabled()) notFound();
  return <GrowthSandboxCheckout />;
}
