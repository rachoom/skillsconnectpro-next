import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | Skills Connect Pro',
  description: 'Terms for using the Skills Connect Pro local services marketplace.',
  alternates: { canonical: 'https://www.skillsconnectpro.co.za/terms' },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[#0b0d0c] px-5 py-12 text-[#f4f3ed] sm:py-20">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-[#f9c62b] hover:underline">← Skills Connect Pro</Link>
        <p className="mt-12 text-xs font-bold uppercase tracking-[0.22em] text-[#f9c62b]">Using the service</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Terms of Service</h1>
        <p className="mt-4 text-sm text-[#b9beb9]">Last updated: 29 September 2026</p>
        <div className="mt-10 space-y-10 leading-7 text-[#d6dad5]">
          <section><h2 className="mb-3 text-xl font-semibold text-white">What Skills Connect Pro does</h2><p>Skills Connect Pro helps customers describe a service job, invite local providers and manage their responses. Providers are independent from Skills Connect Pro. A customer and a chosen provider agree the scope, price, timing and performance of a job directly with each other.</p></section>
          <section><h2 className="mb-3 text-xl font-semibold text-white">Your information</h2><p>Give accurate contact and project or business information that you are entitled to share. Do not upload unlawful, misleading or harmful material, or include sensitive details that are unnecessary for a service request. How we handle personal information is described in our <Link className="font-semibold text-[#f9c62b] underline" href="/privacy-policy">Privacy Policy</Link>.</p></section>
          <section><h2 className="mb-3 text-xl font-semibold text-white">Quotes and estimates</h2><p>Any preliminary estimate or AI assisted suggestion on the site is for planning. It is not a provider quote or a promise of a final price, outcome or availability. Confirm the details of the work directly with the provider before it starts.</p></section>
          <section><h2 className="mb-3 text-xl font-semibold text-white">Acceptable use</h2><p>Use the service for genuine requests and responses. Do not impersonate another person, misuse someone else’s contact details, send spam, attempt to access restricted parts of the service or scrape provider and customer information. We may restrict misuse of the service.</p></section>
          <section><h2 className="mb-3 text-xl font-semibold text-white">WhatsApp communications</h2><p>If you choose to contact us or receive project updates through WhatsApp, those communications also depend on WhatsApp’s service and its terms. You can contact us about a message or your information using the channel below.</p></section>
          <section><h2 className="mb-3 text-xl font-semibold text-white">Questions</h2><p>Contact Skills Connect Pro at <a className="font-semibold text-[#f9c62b] underline" href="https://wa.me/27697026088">+27 69 702 6088 on WhatsApp</a> for help with these terms.</p></section>
        </div>
        <div className="mt-12 border-t border-white/15 pt-6 text-sm text-[#b9beb9]"><Link href="/" className="hover:text-white hover:underline">Return to home</Link></div>
      </article>
    </main>
  );
}
