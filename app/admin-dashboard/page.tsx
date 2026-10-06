'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { AdminDashboard } from '../../components/AdminDashboard';
import { supabase } from '../../services/supabase';

export default function AdminDashboardPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const verify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const result = session ? await supabase.rpc('is_marketplace_admin') : { data: false };
      if (active) { setUnlocked(result.data === true); setChecking(false); }
    };
    void verify();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { void verify(); });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setChecking(true); setError('');
    try {
      const result = await supabase.auth.signInWithPassword({ email, password });
      if (result.error) throw new Error('Sign-in failed. Check your administrator account.');
      const { data } = await supabase.rpc('is_marketplace_admin');
      if (data !== true) throw new Error('This account does not have administrator access.');
      setPassword(''); setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally { setChecking(false); }
  };

  if (unlocked) return <AdminDashboard onBack={() => { void supabase.auth.signOut(); setUnlocked(false); }} />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
      <form onSubmit={signIn} className="w-full max-w-sm rounded-3xl border border-amber-400/30 bg-[#111] p-7 shadow-2xl">
        <LockKeyhole size={28} className="text-amber-300" aria-hidden="true" />
        <h1 className="mt-4 text-2xl font-black">Skills Connect Admin</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">Sign in with your verified administrator account.</p>
        <label htmlFor="admin-email" className="mt-6 block text-sm font-bold">Email</label>
        <input id="admin-email" type="email" autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/15 bg-black px-4 py-3" />
        <label htmlFor="admin-password" className="mt-4 block text-sm font-bold">Password</label>
        <input id="admin-password" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required className="mt-2 w-full rounded-xl border border-white/15 bg-black px-4 py-3" />
        {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}
        <button disabled={checking} className="mt-6 min-h-12 w-full rounded-xl bg-amber-400 font-black text-black disabled:opacity-50">{checking ? 'Checking access…' : 'Sign in'}</button>
        <Link href="/" className="mt-5 block text-center text-sm text-zinc-400">Back to home</Link>
      </form>
    </main>
  );
}
