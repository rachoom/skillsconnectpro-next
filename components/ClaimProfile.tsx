"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Camera,
  CheckCircle,
  Images,
  Loader2,
  MapPin,
  Plus,
  ShieldCheck,
  Star,
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

type ExampleProvider = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  category: string | null;
  location: string | null;
  image_url: string | null;
  verified: boolean | null;
  bio: string | null;
  portfolio_urls: string[] | null;
  proof_of_work: string[] | null;
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

function tradeFamily(value: string | null | undefined) {
  const text = (value || '').toLowerCase();
  if (text.includes('clean')) return 'cleaning';
  if (text.includes('plumb')) return 'plumbing';
  if (text.includes('mechanic') || text.includes('automotive')) return 'mechanic';
  if (text.includes('paint')) return 'painting';
  if (text.includes('carpent')) return 'carpentry';
  if (text.includes('electric')) return 'electrical';
  if (text.includes('hair') || text.includes('beauty')) return 'beauty';
  if (text.includes('build') || text.includes('contractor')) return 'building';
  return text.trim();
}

function exampleName(provider: ExampleProvider) {
  return [provider.first_name, provider.last_name].filter(Boolean).join(' ').trim() || 'SkillsConnect Pro provider';
}

function exampleGallery(provider: ExampleProvider) {
  return Array.from(new Set([
    ...(Array.isArray(provider.portfolio_urls) ? provider.portfolio_urls : []),
    ...(Array.isArray(provider.proof_of_work) ? provider.proof_of_work : []),
  ].filter(Boolean))).slice(0, 5);
}

export const ClaimProfile: React.FC = () => {
  const [token, setToken] = useState('');
  const [provider, setProvider] = useState<ClaimProvider | null>(null);
  const [exampleProvider, setExampleProvider] = useState<ExampleProvider | null>(null);
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
  const portfolioInputRef = useRef<HTMLInputElement | null>(null);

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

        try {
          const directoryResponse = await fetch('/api/providers', { cache: 'no-store' });
          const directoryPayload = await directoryResponse.json().catch(() => ({}));
          const candidates = (Array.isArray(directoryPayload.providers) ? directoryPayload.providers : []) as ExampleProvider[];
          const usable = candidates.filter(candidate =>
            candidate.verified
            && Boolean(candidate.image_url)
            && exampleGallery(candidate).length >= 3
          );
          const family = tradeFamily(loadedProvider.category);
          const relevant = usable.find(candidate => tradeFamily(candidate.category) === family);
          setExampleProvider(relevant || usable[0] || null);
        } catch {
          // The example is helpful but must never block a provider from claiming their own profile.
        }
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : 'Unable to load this invitation.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    return () => {
      if (profilePreview) URL.revokeObjectURL(profilePreview);
      portfolioPreviews.forEach(url => URL.revokeObjectURL(url));
    };
  }, [profilePreview, portfolioPreviews]);

  const chooseProfile = (file?: File) => {
    if (!file) return;
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfile(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const choosePortfolio = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, Math.max(0, 5 - portfolio.length));
    if (!incoming.length) return;

    setPortfolio(current => [...current, ...incoming].slice(0, 5));
    setPortfolioPreviews(current => [
      ...current,
      ...incoming.map(file => URL.createObjectURL(file)),
    ].slice(0, 5));
  };

  const removePortfolio = (index: number) => {
    const preview = portfolioPreviews[index];
    if (preview) URL.revokeObjectURL(preview);
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

  const displayName = useMemo(() => (
    [provider?.first_name, provider?.last_name].filter(Boolean).join(' ').trim()
      || provider?.name
      || 'Your business'
  ), [provider]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#080808] p-6 text-white">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-300" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-amber-300">Loading your profile</p>
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
          <h1 className="mt-6 text-3xl font-black">Your profile is confirmed.</h1>
          <p className="mt-4 leading-7 text-zinc-300">{success}</p>
          <p className="mt-3 text-sm leading-6 text-zinc-500">
            SkillsConnect Pro will do the final review before your profile appears to customers.
          </p>
          <a href="/" className="mt-7 inline-block rounded-xl bg-amber-300 px-6 py-3 text-xs font-black uppercase tracking-wider text-black">
            Visit SkillsConnect Pro
          </a>
        </div>
      </main>
    );
  }

  const existingWork = (provider?.portfolio_urls || []).filter(Boolean).slice(0, 5);
  const workSlots = Array.from({ length: 5 }, (_, index) => {
    const uploaded = portfolioPreviews[index];
    const existing = existingWork[index];
    return uploaded
      ? { type: 'uploaded' as const, url: uploaded, index }
      : existing
        ? { type: 'existing' as const, url: existing, index }
        : { type: 'empty' as const, url: '', index };
  });

  return (
    <main className="min-h-screen bg-[#080808] px-4 py-8 text-white md:px-8 md:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/25 bg-amber-300/5 px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-amber-300">
            <ShieldCheck className="h-4 w-4" /> Free provider profile
          </div>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight md:text-6xl">
            Your <span className="text-amber-300">SkillsConnect Pro</span> profile is almost ready
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-zinc-400 md:text-base">
            This is what customers will see. Add your own photo or business logo, tell them what you do, and show examples of your work.
          </p>
        </header>

        {exampleProvider ? (() => {
          const gallery = exampleGallery(exampleProvider);
          return (
            <section className="mx-auto mt-9 max-w-3xl">
              <div className="overflow-hidden rounded-[1.8rem] border border-amber-300/20 bg-gradient-to-b from-[#15120a] to-[#0c0c0c] shadow-[0_30px_90px_rgba(0,0,0,.45)]">
                <div className="border-b border-white/10 px-5 py-5 sm:px-7">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">See what a completed profile looks like</div>
                  <h2 className="mt-2 text-2xl font-black sm:text-3xl">Your profile can look like this</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    This is a real SkillsConnect Pro provider profile from the live directory. Add your own photo, description and work images below to build yours.
                  </p>
                </div>

                <article className="m-4 overflow-hidden rounded-[1.45rem] border border-white/10 bg-[#f3eedf] text-[#172019] sm:m-6">
                  <div className="relative min-h-[235px] overflow-hidden bg-[#173827] sm:min-h-[300px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={exampleProvider.image_url || ''} alt={exampleName(exampleProvider)} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-[#f5c518] px-3 py-2 text-xs font-black text-[#171006]">
                      <CheckCircle className="h-4 w-4" /> Verified
                    </div>
                    <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-white/20 bg-black/65 px-3 py-2 text-[10px] font-black text-white backdrop-blur-md">
                      <Images className="h-4 w-4" /> {gallery.length} work photos
                    </div>
                  </div>

                  <div className="p-5 sm:p-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5e704f]">{exampleProvider.category || 'Local service provider'}</div>
                    <h3 className="mt-2 text-2xl font-black leading-tight">{exampleName(exampleProvider)}</h3>
                    <div className="mt-3 flex items-start gap-2 text-sm text-[#667064]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{exampleProvider.location || 'Local service area'}</span>
                    </div>

                    <div className="mt-4 rounded-2xl bg-[#dfe8d6] p-4">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <Star className="h-4 w-4 text-[#9e7500]" /> New provider
                      </div>
                      <div className="mt-1 text-xs text-[#5f695c]">Building marketplace history</div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#cbc5b5] bg-[#fffdf6] p-4">
                      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#667064]">About this provider</div>
                      <p className="mt-2 text-sm leading-6 text-[#4d584d]">
                        {editableBio(exampleProvider.bio) || 'Reliable local service provider showcasing skills, service area and completed work to customers on SkillsConnect Pro.'}
                      </p>
                    </div>

                    <div className="mt-4 rounded-2xl border border-[#cbc5b5] bg-[#fffdf6] p-4">
                      <div className="flex items-end justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#667064]">Proof of work</div>
                          <div className="mt-1 text-sm font-black text-[#233126]">Work shared by this provider</div>
                        </div>
                        <small className="text-[10px] font-bold text-[#7b8277]">{gallery.length} photos</small>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {gallery.slice(0, 3).map((url, index) => (
                          <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-[#d7d0bf] bg-[#dfe8d6]">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`${exampleName(exampleProvider)} work example ${index + 1}`} className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </article>

                <div className="px-5 pb-6 text-center sm:px-7">
                  <div className="text-sm font-black text-amber-200">Now build your own profile below ↓</div>
                  <p className="mt-1 text-xs text-zinc-500">Your information and photos will replace the example.</p>
                </div>
              </div>
            </section>
          );
        })() : null}

        <section className="mx-auto mt-9 max-w-2xl">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">Your customer profile</div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">Tap the highlighted areas to complete your profile.</p>
            </div>
            <div className="hidden rounded-full border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-[10px] font-bold text-emerald-300 sm:block">
              LIVE PREVIEW
            </div>
          </div>

          <article className="overflow-hidden rounded-[1.7rem] border border-white/15 bg-[#f3eedf] text-[#172019] shadow-[0_35px_100px_rgba(0,0,0,.55)]">
            <label className="group relative block min-h-[300px] cursor-pointer overflow-hidden bg-[#173827] sm:min-h-[360px]">
              {profilePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profilePreview} alt={displayName} className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_20%,rgba(245,197,24,.12),transparent_14rem),linear-gradient(145deg,#173827,#2b1a10)] px-8 text-center text-white">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border border-amber-300/30 bg-black/25 text-amber-300 shadow-2xl">
                    <UserRound className="h-11 w-11" />
                  </div>
                  <div className="mt-5 text-base font-black">Add your profile picture</div>
                  <div className="mt-1 text-sm text-white/60">or upload your business logo</div>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black via-black/55 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-2 rounded-2xl border border-amber-300/35 bg-black/65 px-4 py-3 text-center text-xs font-black text-amber-200 backdrop-blur-md transition group-hover:bg-black/80">
                <Camera className="h-4 w-4" /> {profilePreview ? 'Change your profile picture or logo' : 'Tap here to add your own photo or logo'}
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={event => chooseProfile(event.target.files?.[0])} />
            </label>

            <div className="p-5 sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5e704f]">{provider?.category || 'Local service provider'}</div>
                  <h2 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">{displayName}</h2>
                </div>
                <Briefcase className="mt-1 h-6 w-6 shrink-0 text-[#2f674a]" />
              </div>

              <div className="mt-4 flex items-start gap-2 text-sm text-[#667064]">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{provider?.location || 'Service area not supplied'}</span>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-[#dfe8d6] p-4">
                <Star className="h-4 w-4 text-[#9e7500]" />
                <strong className="font-black">New provider</strong>
                <span className="text-xs text-[#5f695c]">Building marketplace history</span>
              </div>

              <section className="mt-5 rounded-2xl border border-[#cbc5b5] bg-[#fffdf6] p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#667064]">About this provider</div>
                <textarea
                  value={bio}
                  maxLength={600}
                  onChange={event => setBio(event.target.value)}
                  placeholder="Tell customers what you do, your experience, the areas you serve and what they can expect from you..."
                  className="mt-3 min-h-32 w-full resize-y rounded-xl border border-dashed border-[#b9b19f] bg-[#f8f4e9] px-4 py-3 text-sm leading-6 text-[#263429] outline-none placeholder:italic placeholder:text-[#7b8277] focus:border-[#d2a900] focus:ring-2 focus:ring-[#f5c518]/20"
                />
                <div className="mt-2 flex items-center justify-between gap-3 text-[10px] text-[#7b8277]">
                  <span>Tip: mention your experience and main services.</span>
                  <span>{bio.length}/600</span>
                </div>
              </section>

              <section className="mt-5 rounded-2xl border border-[#cbc5b5] bg-[#fffdf6] p-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-[#667064]">Proof of work</div>
                    <div className="mt-1 text-sm font-black text-[#233126]">Show customers jobs you have completed</div>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold text-[#7b8277]">
                    <Images className="h-3.5 w-3.5" /> Up to 5
                  </div>
                </div>

                <input
                  ref={portfolioInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={event => choosePortfolio(event.target.files)}
                />

                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {workSlots.map(slot => (
                    slot.type === 'empty' ? (
                      <button
                        key={`empty-${slot.index}`}
                        type="button"
                        onClick={() => portfolioInputRef.current?.click()}
                        className="flex aspect-square flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#c7bfad] bg-[#f5f0e3] px-3 text-center transition hover:border-[#d2a900] hover:bg-[#fff8d9]"
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#173827] text-[#ffe069]">
                          <Plus className="h-5 w-5" />
                        </div>
                        <div className="mt-3 text-xs font-black text-[#233126]">Add work photo</div>
                        <div className="mt-1 text-[10px] leading-4 text-[#7b8277]">Tap to upload a completed job</div>
                      </button>
                    ) : (
                      <div key={`${slot.type}-${slot.index}`} className="relative aspect-square overflow-hidden rounded-xl border border-[#d7d0bf] bg-[#dfe8d6]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slot.url} alt={`Proof of work ${slot.index + 1}`} className="h-full w-full object-cover" />
                        {slot.type === 'uploaded' ? (
                          <button
                            type="button"
                            onClick={() => removePortfolio(slot.index)}
                            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/75 text-white"
                            aria-label="Remove work photo"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        ) : (
                          <span className="absolute bottom-2 left-2 rounded-full bg-black/65 px-2 py-1 text-[9px] font-bold text-white">Already on profile</span>
                        )}
                      </div>
                    )
                  ))}
                </div>

                {portfolio.length < 5 ? (
                  <button
                    type="button"
                    onClick={() => portfolioInputRef.current?.click()}
                    className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#c9c1ad] bg-[#f8f4e9] px-4 text-xs font-black text-[#233126]"
                  >
                    <Plus className="h-4 w-4" /> Add proof-of-work photos
                  </button>
                ) : null}
              </section>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#173827] p-4 text-[#f5f0e3]">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#75d39f]" />
                <div>
                  <div className="text-sm font-black">Your contact details stay protected</div>
                  <p className="mt-1 text-xs leading-5 text-white/65">
                    Your phone and WhatsApp number are used by SkillsConnect Pro but are not displayed openly on the public directory.
                  </p>
                </div>
              </div>
            </div>
          </article>
        </section>

        <section className="mx-auto mt-7 max-w-2xl rounded-3xl border border-white/10 bg-[#111] p-5 sm:p-7">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h3 className="text-xl font-black">Confirm that this profile belongs to you</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Nothing is published immediately. After you confirm, SkillsConnect Pro performs a final review before the profile appears to customers.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setAgreed(value => !value)}
            className={`mt-6 w-full rounded-2xl border p-5 text-left transition ${agreed ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-white/10 bg-black/30'}`}
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
            className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-black shadow-[0_12px_30px_rgba(245,197,24,.18)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : 'Confirm my profile & submit for approval'}
          </button>

          <p className="mt-4 text-center text-[11px] leading-5 text-zinc-600">
            Photo and proof-of-work uploads are optional. You can confirm the basic profile without them.
          </p>
        </section>
      </div>
    </main>
  );
};
