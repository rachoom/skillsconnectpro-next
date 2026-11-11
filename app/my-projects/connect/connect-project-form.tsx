'use client';

import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TOKEN = /^[A-Za-z0-9_-]{32,256}$/;

export function ConnectProjectForm({ expectedProjectId }: { expectedProjectId: string }) {
  const [privateLink, setPrivateLink] = useState('');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function connect(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setWorking(true);
    try {
      const link = new URL(privateLink.trim());
      if (link.protocol !== 'https:' || !['skillsconnectpro.co.za', 'www.skillsconnectpro.co.za'].includes(link.hostname)) {
        throw new Error('Please paste the original Skills Connect Pro private project link.');
      }
      const match = /^\/project\/([0-9a-f-]{36})\/?$/i.exec(link.pathname);
      // The original completion page offers both "Open dashboard" and
      // "Save & manage" links. Either contains the verified guest token.
      const isSavedLink = link.pathname === '/sign-in' && link.searchParams.has('projectId');
      const projectId = match?.[1] || (isSavedLink ? link.searchParams.get('projectId') : '') || '';
      const token = link.searchParams.get('token') || '';
      if (!UUID.test(projectId) || !TOKEN.test(token) || token === 'account-session') {
        throw new Error('This is not a complete private customer dashboard link.');
      }
      if (expectedProjectId && projectId.toLowerCase() !== expectedProjectId.toLowerCase()) {
        throw new Error('This link belongs to a different request. Please use the original link for this project.');
      }
      const response = await fetch('/api/projects/claim', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, token }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.claimed !== true) {
        throw new Error(result.error || 'We could not verify this project link.');
      }
      window.location.assign(`/project/${projectId}?token=account-session`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not link the request.');
      setWorking(false);
    }
  }

  return (
    <form className="mt-7" onSubmit={connect}>
      <label htmlFor="saved-project-link" className="block text-sm font-bold text-[#f1e4bb]">Original private dashboard or Save &amp; manage link</label>
      <input id="saved-project-link" type="url" required autoCapitalize="off" autoComplete="off" spellCheck={false}
        value={privateLink} onChange={(event) => setPrivateLink(event.target.value)}
        placeholder="https://skillsconnectpro.co.za/project/..."
        className="mt-3 min-h-14 w-full rounded-xl border border-[#6d602a] bg-black px-4 text-sm text-white outline-offset-4 focus:outline-[#f5c518]" />
      {error && <p role="alert" className="mt-3 rounded-xl border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-200">{error}</p>}
      <button type="submit" disabled={working} className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-xl bg-[#f5c518] px-4 font-black text-[#111] disabled:opacity-50">
        {working ? <Loader2 size={20} className="animate-spin" /> : <>Connect & Open Customer Dashboard <ArrowRight size={20} /></>}
      </button>
      <p className="mt-5 text-sm leading-6 text-[#aaa]">Your original private dashboard or Save &amp; manage link may be available in your browser history or the page shown after submitting your request. Keep it private: it grants access to the request.</p>
    </form>
  );
}
