import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Deletion | Skills Connect Pro',
  description: 'How to request deletion of personal information held by Skills Connect Pro.',
  alternates: { canonical: 'https://www.skillsconnectpro.co.za/data-deletion' },
};

export default function DataDeletionPage() {
  return (
    <main className="min-h-screen bg-[#0b0d0c] px-5 py-12 text-[#f4f3ed] sm:py-20">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-[#f9c62b] hover:underline">← Skills Connect Pro</Link>
        <p className="mt-12 text-xs font-bold uppercase tracking-[0.22em] text-[#f9c62b]">Your data</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Request data deletion</h1>
        <p className="mt-5 leading-7 text-[#d6dad5]">You can ask Skills Connect Pro to delete personal information associated with your customer request or provider profile.</p>
        <ol className="mt-8 list-decimal space-y-5 pl-6 leading-7 text-[#d6dad5]">
          <li>Message <a className="font-semibold text-[#f9c62b] underline" href="https://wa.me/27697026088">+27 69 702 6088 on WhatsApp</a> and say “Data deletion request”.</li>
          <li>Tell us whether your request concerns a customer project, provider profile or both, and provide the phone number or other contact detail used with the service. Please do not send identity documents in the first message.</li>
          <li>We will confirm which records we can identify, verify that the request is yours where needed, and explain the deletion or any information we must retain for legal, security or recordkeeping reasons.</li>
        </ol>
        <p className="mt-8 leading-7 text-[#d6dad5]">If you used Facebook or WhatsApp to communicate with us, deleting information from Skills Connect Pro does not by itself remove copies held in your own account or by Meta. You can manage those separately in those services.</p>
        <p className="mt-8 leading-7 text-[#d6dad5]">For more about the information we handle, read our <Link className="font-semibold text-[#f9c62b] underline" href="/privacy-policy">Privacy Policy</Link>.</p>
        <div className="mt-12 border-t border-white/15 pt-6 text-sm text-[#b9beb9]"><Link href="/" className="hover:text-white hover:underline">Return to home</Link></div>
      </article>
    </main>
  );
}
