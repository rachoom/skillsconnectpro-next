import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | Skills Connect Pro',
  description: 'How Skills Connect Pro handles information shared by customers and service providers.',
  alternates: { canonical: 'https://www.skillsconnectpro.co.za/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#0b0d0c] px-5 py-12 text-[#f4f3ed] sm:py-20">
      <article className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm font-semibold text-[#f9c62b] hover:underline">← Skills Connect Pro</Link>
        <p className="mt-12 text-xs font-bold uppercase tracking-[0.22em] text-[#f9c62b]">Your information</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Privacy Policy</h1>
        <p className="mt-4 text-sm text-[#b9beb9]">Last updated: 29 September 2026</p>
        <div className="mt-10 space-y-10 leading-7 text-[#d6dad5]">
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">Who this covers</h2>
            <p>Skills Connect Pro helps customers describe projects and connect with independent local service providers. This notice explains the information handled through our website, project requests and related WhatsApp communications.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">Information you provide</h2>
            <p>Customers may provide a name, phone number, optional email address, suburb or town, project description, preferred date and photos or other details about a job. Providers may provide a business name, contact details, service area, skills, profile information and portfolio images. Reviews, support requests and messages may contain information you choose to share. Please do not include a street address in a public project description.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">How it is used</h2>
            <p>We use this information to prepare and manage project requests, identify relevant providers, arrange responses and contact sharing for a selected provider, communicate about the service, handle support requests and protect the platform from misuse. Supplying the details needed for a project or provider profile is voluntary, but we cannot provide the corresponding service without them.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">Sharing and service providers</h2>
            <p>Project information may be shown to providers invited to respond. Customer and provider contact details are shared for the job when the relevant contact sharing step is completed. We also use technology providers to host the website, store data and deliver communications. If you communicate with us through WhatsApp, Meta processes those communications under its own terms and privacy practices. We do not publish private contact details in the public provider directory.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">Storage and your choices</h2>
            <p>Information is kept for as long as needed for the service, support, legitimate records or applicable legal requirements. Some technology providers may process information outside South Africa. You can ask about the personal information we hold about you, request a correction or deletion where applicable, or raise a privacy concern using the contact below. We may need to confirm your identity before acting on a request.</p>
          </section>
          <section>
            <h2 className="mb-3 text-xl font-semibold text-white">Contact</h2>
            <p>For privacy questions or requests, contact Skills Connect Pro via <a className="font-semibold text-[#f9c62b] underline" href="https://wa.me/27697026088">WhatsApp at +27 69 702 6088</a>.</p>
          </section>
        </div>
        <div className="mt-12 border-t border-white/15 pt-6 text-sm text-[#b9beb9]">
          <Link href="/" className="hover:text-white hover:underline">Return to home</Link>
        </div>
      </article>
    </main>
  );
}
