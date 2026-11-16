"use client";

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  UploadCloud,
  X,
} from 'lucide-react';

type ClaimProvider = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  category: string | null;
  location: string | null;
  phone: string | null;
  bio: string | null;
  image_url: string | null;
  portfolio_urls: string[] | null;
};

export const ClaimProfile: React.FC = () => {
  const [token, setToken] = useState('');
  const [provider, setProvider] = useState<ClaimProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [profile, setProfile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [portfolio, setPortfolio] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('claim') || params.get('invite') || '';
    setToken(value);

    if (!value) {
      setError('This invitation is missing a valid claim token.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const response = await fetch(`/api/provider-claim/${encodeURIComponent(value)}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Unable to load this invitation.');
        setProvider(payload.provider as ClaimProvider);
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to load this invitation.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const chooseProfile = (file?: File) => {
    if (!file) return;
    setProfile(file);
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfilePreview(URL.createObjectURL(file));
  };

  const choosePortfolio = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, Math.max(0, 5 - portfolio.length));
    setPortfolio(current => [...current, ...incoming].slice(0, 5));
    setPortfolioPreviews(current => [
      ...current,
      ...incoming.map(file => URL.createObjectURL(file)),
    ].slice(0, 5));
  };

  const removePortfolio = (index: number) => {
    setPortfolio(current => current.filter((_, itemIndex) => itemIndex !== index));
    setPortfolioPreviews(current => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = async () => {
    if (!agreed || !token) return;
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      form.set('agreed', 'true');
      if (profile) form.set('profile', profile);
      portfolio.forEach(file => form.append('portfolio', file));

      const response = await fetch(`/api/provider-claim/${encodeURIComponent(token)}`, {
        method: 'POST',
        body: form,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Unable to submit your confirmation.');
      setSuccess(payload.message || 'Your profile has been confirmed and sent for final approval.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit your confirmation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] p-6 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-300" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-amber-300">Loading invitation</p>
        </div>
      </main>
    );
  }

  if (error && !provider) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] p-6 text-white">
        <div className="max-w-md text-center">
          <AlertCircle className="mx-auto h-14 w-14 text-red-400" />
          <h1 className="mt-5 text-3xl font-black">Invitation unavailable</h1>
          <p className="mt-3 text-sm leading-6 text-zinc-400">{error}</p>
          <a href="/" className="mt-6 inline-block rounded-xl bg-amber-300 px-5 py-3 text-xs font-black uppercase tracking-wider text-black">
            Visit SkillsConnect Pro
          </a>
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] p-6 text-white">
        <div className="max-w-xl rounded-3xl border border-emerald-400/20 bg-[#111] p-8 text-center shadow-2xl">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
            <ShieldCheck className="h-10 w-10 text-emerald-300" />
          </div>
          <h1 className="mt-6 text-3xl font-black">Thank you — profile confirmed.</h1>
          <p className="mt-4 leading-7 text-zinc-300">{success}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            Your listing is not public yet. SkillsConnect Pro will review the information and approve the profile before it appears to customers.
          </p>
          <a href="/" className="mt-7 inline-block rounded-xl bg-amber-300 px-6 py-3 text-xs font-black uppercase tracking-wider text-black">
            Visit SkillsConnect Pro
          </a>
        </div>
      </main>
    );
  }

  const displayName = [provider?.first_name, provider?.last_name].filter(Boolean).join(' ').trim()
    || provider?.name
    || 'Your business';

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-10 text-white md:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
            <ShieldCheck className="h-4 w-4" /> Provider consent & profile claim
          </div>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
            Confirm your free <span className="text-amber-300">SkillsConnect Pro</span> profile
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
            SkillsConnect Pro helps customers discover trusted local service providers. A basic profile has been prepared from information supplied or captured for your business. Please confirm that it belongs to you before anything is published.
          </p>
        </header>

        <section className="mt-10 overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
          <div className="grid md:grid-cols-[1fr_280px]">
            <div className="p-7 md:p-10">
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Profile awaiting your confirmation</div>
              <h2 className="mt-3 text-3xl font-black">{displayName}</h2>
              <div className="mt-5 grid gap-3 text-sm text-zinc-300">
                <div className="flex items-center gap-3"><Briefcase className="h-4 w-4 text-amber-300" /> {provider?.category || 'Local service provider'}</div>
                <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-amber-300" /> {provider?.location || 'Local service area'}</div>
                {provider?.phone ? <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-amber-300" /> {provider.phone}</div> : null}
              </div>
              {provider?.bio ? <p className="mt-6 rounded-2xl bg-black/35 p-4 text-sm leading-6 text-zinc-400">{provider.bio}</p> : null}
            </div>

            <div className="relative min-h-64 bg-black">
              {profilePreview || provider?.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePreview || provider?.image_url || ''} alt={displayName} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full min-h-64 items-center justify-center text-zinc-700">
                  <ImageIcon className="h-16 w-16" />
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-6 md:p-8">
          <h3 className="text-xl font-black">Optional: improve your profile</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">You may add a business/profile image and up to five proof-of-work photos. You can also submit the claim without images.</p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 p-5 text-center hover:border-amber-300/40">
              <UploadCloud className="h-6 w-6 text-amber-300" />
              <span className="mt-2 text-xs font-bold">Profile photo or business logo</span>
              <span className="mt-1 text-[10px] text-zinc-500">JPG, PNG, WEBP or HEIC · max 6MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={event => chooseProfile(event.target.files?.[0])} />
            </label>

            <label className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 p-5 text-center hover:border-amber-300/40">
              <UploadCloud className="h-6 w-6 text-amber-300" />
              <span className="mt-2 text-xs font-bold">Proof-of-work images</span>
              <span className="mt-1 text-[10px] text-zinc-500">Up to five images</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={event => choosePortfolio(event.target.files)} />
            </label>
          </div>

          {portfolioPreviews.length ? (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-5">
              {portfolioPreviews.map((src, index) => (
                <div key={src} className="relative aspect-square overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removePortfolio(index)} className="absolute right-1 top-1 rounded-lg bg-black/75 p-1.5" aria-label="Remove image">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setAgreed(value => !value)}
            className={`mt-7 w-full rounded-2xl border p-5 text-left transition ${agreed ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/30'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border ${agreed ? 'border-emerald-400 bg-emerald-400 text-black' : 'border-zinc-500'}`}>
                {agreed ? <CheckCircle className="h-4 w-4" /> : null}
              </div>
              <div>
                <div className="font-bold">Yes, this profile represents me or my business.</div>
                <p className="mt-2 text-xs leading-6 text-zinc-400">
                  I confirm that the information shown is mine or that I am authorised to represent this business. I consent to SkillsConnect Pro storing and displaying my business/contact information after administrator approval, and I agree to the SkillsConnect Pro Terms of Service and Privacy Policy.
                </p>
              </div>
            </div>
          </button>

          {error ? <div className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={!agreed || submitting}
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-xs font-black uppercase tracking-wider text-black disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Confirm profile & submit for approval'}
          </button>

          <p className="mt-4 text-center text-[11px] leading-5 text-zinc-600">
            Confirmation does not publish the profile immediately. SkillsConnect Pro performs a final review before the listing becomes visible to customers.
          </p>
        </section>
      </div>
    </main>
  );
};
