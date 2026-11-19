'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

const maxChecks = 6;

export function PaymentStatusCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checks, setChecks] = useState(0);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (pending || checks >= maxChecks) return;
    const timer = window.setTimeout(() => {
      setChecks(count => count + 1);
      startTransition(() => router.refresh());
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [checks, pending, router]);

  return (
    <div className="mt-6">
      <p role="status" className="text-sm text-white/75">
        {pending ? 'Checking payment status…' : checks < maxChecks
          ? 'This page checks automatically for a short time.'
          : 'Automatic checks have finished. You can check again below.'}
      </p>
      <button type="button" disabled={pending} onClick={() => startTransition(() => router.refresh())}
        className="mt-3 rounded-xl border border-[#ffd75f]/50 px-5 py-3 text-sm font-black text-[#ffe17a] disabled:opacity-60">
        {children}
      </button>
    </div>
  );
}
