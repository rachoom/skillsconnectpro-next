"use client";

import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  Image as ImageIcon,
  Loader2,
  MapPin,
  ShieldCheck,
  Star,
  UploadCloud,
  UserRound,
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

const GENERIC_CAPTURE_BIOS = [
  'submitted through the provider photo application.',
  'submitted through provider photo application.',
];

function editableBio(value: string | null | undefined) {
  const trimmed = (value || '').trim();
  if (!trimmed) return '';
  if (GENERIC_CAPTURE_BIOS.includes(trimmed.toLowerCase())) return '';
  return trimmed;
}

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
  const [bio, setBio] = useState('');

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
        const loadedProvider = payload.provider as ClaimProvider;
        setProvider(loadedProvider);
        setBio(editableBio(loadedProvider.bio));
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
      form.set('bio', bio.trim());
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

  const aboutPreview = bio.trim()
    || 'Add a short description about your work, experience and the services you offer.';

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
            We have prepared a basic profile for you. Check the details, add your own photo or business logo if you have one, and tell customers briefly what you do.
          </p>
        </header>

        <section className="mt-10">
          <div className="mb-4">
            <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Example of your customer profile</div>
            <p className="mt-2 text-sm text-zinc-500">This preview updates as you add your photo and description. Your public profile will use the same basic information after approval.</p>
          </div>

          <article className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-[#111] shadow-2xl">
            <div className="relative min-h-72 overflow-hidden bg-gradient-to-br from-[#161616] via-[#0d0d0d] to-[#171207]">
              {profilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePreview} alt={displayName} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-amber-300/25 bg-amber-300/10 text-amber-300">
                    <UserRound className="h-11 w-11" />
                  </div>
                  <div className="mt-5 text-sm font-black uppercase tracking-[0.12em] text-white">Add your own profile picture</div>
                  <div className="mt-1 text-xs leading-5 text-zinc-500">or business logo here</div>
                  <div className="mt-4 rounded-full border border-white/10 bg-black/30 px-4 py-2 text-[10px] font-bold text-zinc-500">
                    No unrelated person will be shown
                  </div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/65 to-transparent" />
              <span className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/65 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-300">
                Profile preview
              </span>
            </div>

            <div className="p-6 md:p-8">
              <h2 className="text-3xl font-black">{displayName}</h2>
              <div className="mt-2 flex items-center gap-2 text-sm font-bold text-amber-300">
                <Briefcase className="h-4 w-4" /> {provider?.category || 'Local service provider'}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                <MapPin className="h-4 w-4" /> {provider?.location || 'Service area not supplied'}
              </div>

              <div className="mt-5 flex items-center justify-between rounded-2xl border border-white/5 bg-black/30 px-4 py-3">
                <div className="flex items-center gap-2 text-sm font-bold"><Star className="h-4 w-4 text-amber-300" /> New provider</div>
                <span className="text-[11px] text-zinc-600">Building marketplace history</span>
              </div>

              <div className="mt-5 rounded-2xl border border-white/5 bg-black/25 p-5">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">About this provider</div>
                <p className={`mt-3 text-sm leading-6 ${bio.trim() ? 'text-zinc-300' : 'italic text-zinc-600'}`}>{aboutPreview}</p>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4 text-xs leading-5 text-zinc-400">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
                <p>Your phone number is used for the SkillsConnect workflow but is not displayed openly on the public provider directory.</p>
              </div>
            </div>
          </article>
        </section>

        <section className="mt-6 rounded-3xl border border-white/10 bg-[#111] p-6 md:p-8">
          <h3 className="text-2xl font-black">Make this profile yours</h3>
          <p className="mt-2 text-sm leading-6 text-zinc-500">
            These extras are optional, but a real photo/logo, a short description and proof-of-work pictures help customers understand your business.
          </p>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-amber-300/30 bg-amber-300/5 p-5 text-center hover:border-amber-300/60">
              <UploadCloud className="h-7 w-7 text-amber-300" />
              <span className="mt-3 text-sm font-black">Add your own profile picture here</span>
              <span className="mt-1 text-xs text-zinc-400">or upload your business logo</span>
              <span className="mt-2 text-[10px] text-zinc-600">JPG, PNG, WEBP or HEIC · max 6MB</span>
              <input type="file" accept="image/*" className="hidden" onChange={event => chooseProfile(event.target.files?.[0])} />
            </label>

            <label className="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-black/30 p-5 text-center hover:border-amber-300/40">
              <ImageIcon className="h-7 w-7 text-amber-300" />
              <span className="mt-3 text-sm font-black">Add photos of your work</span>
              <span className="mt-1 text-xs text-zinc-400">Show customers jobs you have completed</span>
              <span className="mt-2 text-[10px] text-zinc-600">Up to five proof-of-work images</span>
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

          <div className="mt-7">
            <label htmlFor="provider-bio" className="text-sm font-black">Tell customers briefly about your work</label>
            <p className="mt-1 text-xs leading-5 text-zinc-500">
              For example: “I provide reliable household cleaning in the East Rand. I am friendly, punctual and available for once-off or regular cleaning.”
            </p>
            <textarea
              id="provider-bio"
              value={bio}
              maxLength={600}
              onChange={event => setBio(event.target.value)}
              placeholder="Write a short description of your services, experience and what customers can expect..."
              className="mt-3 min-h-32 w-full resize-y rounded-2xl border border-white/10 bg-black/35 px-4 py-4 text-sm leading-6 text-white outline-none placeholder:text-zinc-700 focus:border-amber-300/45"
            />
            <div className="mt-2 text-right text-[10px] text-zinc-600">{bio.length}/600</div>
          </div>

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
                  I confirm that the information shown is mine or that I am authorised to represent this business. I consent to SkillsConnect Pro storing and displaying my business information after administrator approval, and I agree to the SkillsConnect Pro Terms of Service and Privacy Policy.
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
