import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAuthenticatedAccount } from '@/services/supabase/server';
import { ConnectProjectForm } from './connect-project-form';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Connect an existing request | Skills Connect Pro' };

type Props = { searchParams: Promise<{ project?: string }> };

export default async function ConnectProjectPage({ searchParams }: Props) {
  const { user } = await getAuthenticatedAccount();
  if (!user) redirect('/sign-in?next=/my-projects/connect');
  const { project } = await searchParams;
  return (
    <main className="min-h-screen bg-[#090909] px-4 py-12 text-[#faf7ed]">
      <div className="mx-auto max-w-xl">
        <Link href="/my-projects" className="text-sm font-bold text-[#f5c518]">← My Projects</Link>
        <section className="mt-8 rounded-3xl border border-[#594d22] bg-[#151515] p-6 sm:p-9">
          <span className="text-xs font-black uppercase tracking-[.14em] text-[#f5c518]">Restore customer dashboard access</span>
          <h1 className="mt-3 text-3xl font-black">Connect an existing request</h1>
          <p className="mt-4 leading-7 text-[#c2bdb2]">Your project brief may already be saved, but its private customer dashboard needs to be linked to your account. Paste the original private customer dashboard link from when you submitted the request. We will verify it securely—no new request will be created.</p>
          <ConnectProjectForm expectedProjectId={typeof project === 'string' ? project : ''} />
        </section>
      </div>
    </main>
  );
}
