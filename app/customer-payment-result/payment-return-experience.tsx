'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { CircleCheckBig, Clock3, RefreshCw, ShieldCheck } from 'lucide-react';

type Payment = { status: 'processing' | 'confirmed' | 'cancelled'; accessActive: boolean; verified: boolean };
export function CustomerPaymentReturnExperience({ paymentReference, cancelled = false }: {
  paymentReference?: string; cancelled?: boolean;
}) {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [attempts, setAttempts] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [needsSignIn, setNeedsSignIn] = useState(false);
  const refresh = useCallback(async () => {
    if (!paymentReference) return;
    setBusy(true);
    try {
      const response = await fetch('/api/payments/payfast/customer-status?payment=' + encodeURIComponent(paymentReference), { cache: 'no-store', credentials: 'same-origin' });
      if (response.status === 401) {
        setNeedsSignIn(true);
        throw new Error('Sign in to the account used for this purchase to check its status.');
      }
      if (!response.ok) throw new Error(response.status === 404 ? 'This payment was not found for your account. Contact support if you have been charged.' : 'We could not check your payment. Please try again shortly.');
      const data = await response.json() as Payment;
      if (!['processing', 'confirmed', 'cancelled'].includes(data.status)) throw new Error('Payment status is temporarily unavailable.');
      setPayment(data); setError(''); setNeedsSignIn(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Payment status is temporarily unavailable.'); }
    finally { setBusy(false); setAttempts(count => count + 1); }
  }, [paymentReference]);
  useEffect(() => {
    if (!paymentReference || needsSignIn || attempts >= 12 || (payment && payment.status !== 'processing')) return;
    const timer = setTimeout(() => { void refresh(); }, attempts === 0 ? 100 : 5000);
    return () => clearTimeout(timer);
  }, [paymentReference, payment, needsSignIn, attempts, refresh]);
  const confirmed = payment?.status === 'confirmed' && payment.verified;
  const pending = !confirmed && payment?.status !== 'cancelled';
  const next = '/customer-payment-result?payment=' + encodeURIComponent(paymentReference || '');
  return <main className="min-h-screen bg-[#0c130f] px-4 py-10 text-[#f8f3e5] md:py-16">
    <section className="mx-auto max-w-xl rounded-[1.8rem] border border-[#d5b94b]/40 bg-[#172019] p-7 shadow-xl md:p-10" aria-live="polite">
      <ShieldCheck className="text-[#f5c518]" size={28}/><p className="mt-3 text-xs font-bold uppercase tracking-widest text-[#f5c518]">Skills Connect Pro · Secure payment</p>
      {confirmed ? <CircleCheckBig className="mt-6 text-emerald-300" size={42}/> : <Clock3 className="mt-6 text-[#f5c518]" size={42}/>}
      <h1 className="mt-5 text-3xl font-black">{confirmed ? 'Payment confirmed' : payment?.status === 'cancelled' ? 'Payment not completed' : 'Checking your payment'}</h1>
      <p className="mt-4 text-sm leading-7">{confirmed ? payment.accessActive ? 'Your project plan is active. Open My Projects to continue.' : 'This purchase was activated previously. Its access period has ended or a newer plan has replaced it. Check My Projects for your current plan.' : 'Paid access activates only after a verified Payfast confirmation. If you have been charged, please do not pay again while we check.'}</p>
      {cancelled && !confirmed && <p className="mt-3 text-sm text-amber-200">You returned using the checkout cancellation link. We are checking the recorded payment status; this link alone does not establish whether a charge occurred.</p>}
      {!paymentReference && <p role="alert" className="mt-4 text-amber-200">No payment reference was supplied. Reopen your original return link or contact support.</p>}
      {error && <p role="alert" className="mt-4 text-amber-200">{error}</p>}
      {pending && attempts >= 12 && <p className="mt-4 text-amber-200">Verification is taking longer than expected. Contact support before attempting another payment.</p>}
      {needsSignIn ? <Link href={'/sign-in?next=' + encodeURIComponent(next)} className="mt-6 inline-block rounded-xl bg-[#f5c518] px-5 py-3 font-bold text-black">Sign in to check payment</Link> : pending && paymentReference && <button disabled={busy} onClick={() => { setAttempts(0); void refresh(); }} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#f5c518] px-5 py-3 font-bold text-black disabled:opacity-60"><RefreshCw size={17}/>{busy ? 'Checking…' : 'Check payment status'}</button>}
      <div className="mt-6 flex flex-wrap gap-5 text-sm font-bold"><Link href="/my-projects">Open My Projects</Link><Link href="/plans#homeowners">View project plans</Link><a href="https://wa.me/27697026088">Contact support</a></div>
    </section>
  </main>;
}
