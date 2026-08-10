'use client';

import { FormEvent, useEffect, useState } from 'react';
import { LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '../../components/AdminDashboard';

const ADMIN_SESSION_KEY = 'skillsConnectAdminUnlocked';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setUnlocked(window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true');
  }, []);

  const unlock = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (pin !== '2026') {
      setError('Access denied. Please check the admin PIN.');
      return;
    }

    window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    setError('');
    setUnlocked(true);
  };

  const lockAndExit = () => {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    setUnlocked(false);
    setPin('');
    router.push('/');
  };

  if (unlocked) {
    return <AdminDashboard onBack={lockAndExit} />;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#080808] px-4 text-white">
      <form
        onSubmit={unlock}
        className="w-full max-w-sm rounded-3xl border border-amber-400/30 bg-[#111] p-7 shadow-2xl"
      >
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400 text-black">
          <LockKeyhole size={23} aria-hidden="true" />
        </div>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-amber-300">
          Restricted access
        </p>
        <h1 className="mt-2 text-2xl font-black">Skills Connect Admin</h1>
        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Enter the administrator PIN to open the operations dashboard.
        </p>

        <label htmlFor="admin-pin" className="mt-6 block text-sm font-bold">
          Admin PIN
        </label>
        <input
          id="admin-pin"
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          className="mt-2 w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-white outline-none focus:border-amber-400"
          required
        />

        {error && <p className="mt-3 text-sm text-red-300" role="alert">{error}</p>}

        <button
          type="submit"
          className="mt-5 w-full rounded-xl bg-amber-400 px-4 py-3 font-black text-black transition hover:bg-amber-300"
        >
          Open admin dashboard
        </button>
      </form>
    </main>
  );
}
