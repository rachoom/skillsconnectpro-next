'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { createBrowserSupabaseClient } from '@/services/supabase/client';
import styles from './sign-in.module.css';

type Props = {
  nextPath: string;
  projectId: string;
  projectToken: string;
  initialError: string;
};

const errorMessages: Record<string, string> = {
  missing_code: 'That sign-in link is incomplete. Please request a fresh one.',
  auth_callback: 'That sign-in link has expired or was already used. Please try again.',
};

export function SignInCard({ nextPath, projectId, projectToken, initialError }: Props) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const googleAuthEnabled = process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_ENABLED !== 'false';
  const [email, setEmail] = useState('');
  const [working, setWorking] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(errorMessages[initialError] ?? '');

  const callbackUrl = () => {
    const url = new URL('/auth/callback', window.location.origin);
    url.searchParams.set('next', nextPath);
    if (projectId && projectToken) {
      url.searchParams.set('projectId', projectId);
      url.searchParams.set('token', projectToken);
    }
    return url.toString();
  };

  useEffect(() => {
    let active = true;
    const continueExistingSession = async () => {
      const { data } = await supabase.auth.getUser();
      if (!active || !data.user) return;
      if (projectId && projectToken) {
        const { data: claimed } = await supabase.rpc('claim_guest_project', {
          target_project_id: projectId,
          raw_access_token: projectToken,
        });
        window.location.replace(`${nextPath}${nextPath.includes('?') ? '&' : '?'}claim=${claimed ? 'saved' : 'failed'}`);
        return;
      }
      window.location.replace(nextPath);
    };
    void continueExistingSession();
    return () => { active = false; };
  }, [nextPath, projectId, projectToken, supabase]);

  const sendMagicLink = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setWorking(true);
    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: callbackUrl(), shouldCreateUser: true },
    });
    setWorking(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    setSent(true);
  };

  const signInWithGoogle = async () => {
    setError('');
    setWorking(true);
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl(), queryParams: { access_type: 'offline', prompt: 'consent' } },
    });
    if (signInError) {
      setWorking(false);
      setError(signInError.message);
    }
  };

  return (
    <main className={styles.page}>
      <div className={styles.glow} aria-hidden="true" />
      <nav className={styles.nav}>
        <Link href="/" className={styles.back}><ArrowLeft size={18} /> Home</Link>
        <Image src="/logo-new.svg" alt="Skills Connect Pro" width={218} height={58} priority />
      </nav>

      <section className={styles.shell}>
        <div className={styles.promise}>
          <span className={styles.eyebrow}>Accounts & My Projects</span>
          <h1>Keep the whole job together.</h1>
          <p>Save your AI brief, estimates, materials, milestones and documents in one private project workspace.</p>
          <div className={styles.benefits}>
            <span><CheckCircle2 /> Reopen any saved project</span>
            <span><CheckCircle2 /> Track materials and spending</span>
            <span><CheckCircle2 /> Keep plans, quotes and receipts</span>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.lock}><LockKeyhole /></div>
          <span className={styles.kicker}>Private workspace</span>
          <h2>{projectId ? 'Save this project' : 'Sign in to continue'}</h2>
          <p className={styles.cardCopy}>{projectId ? 'Your current project will be attached to your account after sign-in.' : googleAuthEnabled ? 'Use Google or receive a secure sign-in link by email.' : 'Receive a secure sign-in link by email.'}</p>

          {error && <div role="alert" className={styles.error}>{error}</div>}
          {sent ? (
            <div className={styles.sent}>
              <Mail size={28} />
              <strong>Check your email</strong>
              <span>We sent a secure sign-in link to {email}.</span>
            </div>
          ) : (
            <>
              {googleAuthEnabled && (
                <>
                  <button type="button" className={styles.google} onClick={signInWithGoogle} disabled={working}>
                    <span aria-hidden="true">G</span> Continue with Google
                  </button>
                  <div className={styles.divider}><span>or use email</span></div>
                </>
              )}
              <form onSubmit={sendMagicLink}>
                <label htmlFor="account-email">Email address</label>
                <div className={styles.emailField}><Mail size={18} /><input id="account-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
                <button className={styles.primary} disabled={working}>
                  {working ? <Loader2 className={styles.spin} /> : <>Email me a secure link <ArrowRight size={18} /></>}
                </button>
              </form>
            </>
          )}

          <p className={styles.privacy}><ShieldCheck size={16} /> Your public provider profile and private project workspace remain separate.</p>
        </div>
      </section>
    </main>
  );
}
