import Link from 'next/link';
import { CircleCheckBig, Clock3, XCircle } from 'lucide-react';

type Props = { searchParams: Promise<{ cancelled?: string }> };

export default async function CustomerPaymentResultPage({ searchParams }: Props) {
  const { cancelled } = await searchParams;
  const cancelledPayment = cancelled === '1';
  return <main className="min-h-screen bg-[#f8f3e5] px-4 py-10 text-[#172016] md:px-8 md:py-16"><section className="mx-auto max-w-xl rounded-[1.8rem] border border-[#d9d0aa] bg-white p-7 text-center shadow-xl shadow-[#302609]/10 md:p-10">
    {cancelledPayment ? <XCircle className="mx-auto text-[#9d342c]" size={44} /> : <Clock3 className="mx-auto text-[#957100]" size={44} />}
    <h1 className="mt-5 text-3xl font-black">{cancelledPayment ? 'Payment cancelled' : 'We are confirming your payment'}</h1>
    <p className="mt-4 text-sm leading-7 text-[#53604e]">{cancelledPayment ? 'No project-plan access has changed. You can return to the plans whenever you are ready.' : 'Your project plan activates only after Skills Connect Pro receives and verifies Payfast’s payment confirmation. This normally takes a moment.'}</p>
    {!cancelledPayment && <div className="mt-6 flex items-start gap-3 rounded-2xl bg-[#fff9e8] p-4 text-left text-sm leading-6 text-[#625a42]"><CircleCheckBig className="mt-0.5 shrink-0 text-[#957100]" size={19} />Open My Projects shortly to see your active plan and continue planning.</div>}
    <Link href={cancelledPayment ? '/plans#homeowners' : '/my-projects'} className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#172016] px-5 py-3.5 text-sm font-black text-white">{cancelledPayment ? 'Back to project plans' : 'Open My Projects'}</Link>
  </section></main>;
}
