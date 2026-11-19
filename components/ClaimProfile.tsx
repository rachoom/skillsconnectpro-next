"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  Eye,
  Sparkles,
  Upload,
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
  X,
} from 'lucide-react';
import { ProviderBanner } from './ProviderBanner';
import styles from './ClaimProfile.module.css';

type ClaimProvider = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  name: string | null;
  category: string | null;
  location: string | null;
  phone: string | null;
  bio: string | null;
  banner_url?: string | null;
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

function exampleName(provider: ExampleProvider) {
  return [provider.first_name, provider.last_name].filter(Boolean).join(' ').trim() || 'SkillsConnect Pro provider';
}

function exampleGallery(provider: ExampleProvider) {
  return Array.from(new Set([
    ...(Array.isArray(provider.portfolio_urls) ? provider.portfolio_urls : []),
    ...(Array.isArray(provider.proof_of_work) ? provider.proof_of_work : []),
  ].filter(Boolean))).slice(0, 5);
}

export const ClaimProfile: React.FC<{ preview?: boolean }> = ({ preview = false }) => {
  const [token, setToken] = useState('');
  const [provider, setProvider] = useState<ClaimProvider | null>(null);
  const [exampleProvider, setExampleProvider] = useState<ExampleProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [banner, setBanner] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState('');
  const [useDefaultBanner, setUseDefaultBanner] = useState(false);
  const [preparingBanner, setPreparingBanner] = useState(false);
  const [bannerError, setBannerError] = useState('');
  const [profile, setProfile] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState('');
  const [portfolio, setPortfolio] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const portfolioInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrls = useRef(new Set<string>());

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const value = params.get('claim') || params.get('invite') || '';
    setToken(value);

    if (!value && !preview) {
      setError('This invitation is missing a valid claim token.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        if (preview) {
          setProvider({ id: 0, first_name: 'Your business', last_name: null, name: null, category: 'Skilled service provider', location: 'East Rand', phone: null, bio: '', image_url: null, portfolio_urls: [] });
        } else {
        const response = await fetch(`/api/provider-claim/${encodeURIComponent(value)}`, { cache: 'no-store' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(payload.error || 'Unable to load this invitation.');
        const loadedProvider = payload.provider as ClaimProvider;
        setProvider(loadedProvider);
        setBio(editableBio(loadedProvider.bio));

        }

        try {
          const directoryResponse = await fetch('/api/providers', { cache: 'no-store' });
          const directoryPayload = await directoryResponse.json().catch(() => ({}));
          const candidates = (Array.isArray(directoryPayload.providers) ? directoryPayload.providers : []) as ExampleProvider[];
          const tripleT = candidates.find(candidate =>
            candidate.id === 51
            && candidate.verified
            && Boolean(candidate.image_url)
            && exampleGallery(candidate).length >= 3
          );
          setExampleProvider(tripleT || null);
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
  }, [preview]);

  useEffect(() => {
    const urls = objectUrls.current;
    return () => { urls.forEach(url => URL.revokeObjectURL(url)); urls.clear(); };
  }, []);
  const makePreview = (file: File) => {
    const url = URL.createObjectURL(file);
    objectUrls.current.add(url);
    return url;
  };

  useEffect(() => {
    if (!banner) {
      setBannerPreview('');
      return;
    }
    const url = URL.createObjectURL(banner);
    setBannerPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [banner]);

  const chooseBanner = async (file?: File) => {
    if (!file) return;
    setBannerError('');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
      setBannerError('Choose a JPG, PNG or WebP image up to 12 MB.');
      return;
    }
    setPreparingBanner(true);
    const source = URL.createObjectURL(file);
    try {
      const photo = new window.Image();
      photo.src = source;
      await photo.decode();
      const scale = Math.min(1, 1600 / Math.max(photo.naturalWidth, photo.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error();
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(photo, 0, 0, canvas.width, canvas.height);
      const jpeg = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.84));
      if (!jpeg) throw new Error();
      setBanner(new File([jpeg], 'business-banner.jpg', { type: 'image/jpeg' }));
      setUseDefaultBanner(false);
    } catch {
      setBannerError('This image could not be opened. Try another JPG, PNG or WebP.');
    } finally {
      URL.revokeObjectURL(source);
      setPreparingBanner(false);
    }
  };

  const chooseProfile = (file?: File) => {
    if (!file) return;
    if (profilePreview) URL.revokeObjectURL(profilePreview);
    setProfile(file);
    setProfilePreview(makePreview(file));
  };

  const choosePortfolio = (files: FileList | null) => {
    if (!files) return;
    const incoming = Array.from(files).slice(0, Math.max(0, 5 - portfolio.length));
    if (!incoming.length) return;

    setPortfolio(current => [...current, ...incoming].slice(0, 5));
    setPortfolioPreviews(current => [
      ...current,
      ...incoming.map(file => makePreview(file)),
    ].slice(0, 5));
  };

  const removePortfolio = (index: number) => {
    const preview = portfolioPreviews[index];
    if (preview) URL.revokeObjectURL(preview);
    setPortfolio(current => current.filter((_, itemIndex) => itemIndex !== index));
    setPortfolioPreviews(current => current.filter((_, itemIndex) => itemIndex !== index));
  };

  const submit = async () => {
    if (preview || !agreed || !token) return;
    setSubmitting(true);
    setError('');
    try {
      const form = new FormData();
      form.set('agreed', 'true');
      form.set('bio', bio.trim());
      if (banner) form.set('banner', banner);
      else if (useDefaultBanner) form.set('resetBanner', 'true');
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
      <main className={`${styles.statusPage} flex min-h-screen items-center justify-center bg-[#080808] p-6 text-white`}>
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-amber-300" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.25em] text-amber-300">Loading your profile</p>
        </div>
      </main>
    );
  }

  if (error && !provider) {
    return (
      <main className={`${styles.statusPage} flex min-h-screen items-center justify-center bg-[#080808] p-6 text-white`}>
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
      <main className={`${styles.statusPage} flex min-h-screen items-center justify-center bg-[#080808] p-6 text-white`}>
        <div className={`${styles.successCard} max-w-xl rounded-3xl border border-emerald-400/20 bg-[#111] p-8 text-center shadow-2xl`}>
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

  const avatar = profilePreview || provider?.image_url;
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
    <main className={styles.page}>
      <div className={styles.shell}>
        <nav className={styles.nav}><a href="/" aria-label="Skills Connect Pro home"><img src="/logo-new.svg" alt="Skills Connect Pro" width="180" height="48" /></a><span><ShieldCheck size={15} /> Private invitation</span></nav>
        {preview && <p className={styles.previewNotice}>Design preview · sample profile. Nothing is saved or submitted.</p>}
        <header className={styles.hero}>
          <span className={styles.eyebrow}><Sparkles size={16} /> Your skill. Your name. Your next chapter.</span>
          <h1>Good at what you do?<br /><em>Let your profile show it.</em></h1>
          <p>We’ve started your Skills Connect Pro profile. Make it yours and give customers a clear picture of your business, your skills and the work you’re proud of.</p>
          <div className={styles.benefits}><span><Check size={15} /> Free to claim</span><span><ShieldCheck size={15} /> Contact details protected</span><span><Eye size={15} /> Reviewed before publishing</span></div>
          <ol className={styles.steps}><li><b>01</b><span>Make it yours<small>Add your photo or logo</small></span></li><li><b>02</b><span>Show your skill<small>A short intro & your work</small></span></li><li><b>03</b><span>Claim your profile<small>Send it for our review</small></span></li></ol>
        </header>

        <section className={styles.editor} aria-labelledby="profile-editor-title">
          <div className={styles.sectionTop}><div><span className={styles.eyebrow}>Your business, in the spotlight</span><h2 id="profile-editor-title">Make a first impression that lasts.</h2><p>Your details are ready below. Add your finishing touches.</p></div><span className={styles.editBadge}><span /> Editable preview</span></div>
          <article className={styles.profileCard}>
            <div className={styles.cover}>
              <ProviderBanner url={bannerPreview || (useDefaultBanner ? null : provider?.banner_url)} />
              <label className={styles.bannerButton}>
                <Camera size={16} aria-hidden="true" />
                {preparingBanner ? 'Preparing…' : 'Change banner'}
                <input type="file" className={styles.hiddenInput} accept="image/jpeg,image/png,image/webp"
                  disabled={submitting || preparingBanner}
                  onChange={event => {
                    const file = event.currentTarget.files?.[0];
                    event.currentTarget.value = '';
                    void chooseBanner(file);
                  }} />
              </label>
            </div>
            <div className={styles.identity}>
              <label className={styles.avatarUpload}>
                <img src={avatar || '/provider-profile/sample-logo.webp'} alt={avatar ? displayName : 'Example business logo'} width={94} height={94} />
                <span><Camera size={16} /></span>
                <input aria-label="Upload your profile photo or business logo" type="file" accept="image/*" onChange={event => chooseProfile(event.target.files?.[0])} />
              </label>
              <div className={styles.nameBlock}><span className={styles.category}>{provider?.category || 'Local service provider'}</span><h3>{displayName}</h3><p><MapPin size={15} />{provider?.location || 'Service area not supplied'}</p></div>
              <span className={styles.draftBadge}>Profile draft</span>
            </div>
            <div className={styles.editorBody}>
              {bannerError && <p role="alert" className={styles.bannerError}>{bannerError}</p>}
              {(banner || (provider?.banner_url && !useDefaultBanner)) && <button type="button" className={styles.uploadButton}
                disabled={submitting || preparingBanner}
                onClick={() => { setBanner(null); setUseDefaultBanner(true); setBannerError(''); }}>
                Use SkillsConnectPro banner
              </button>}
              <div className={styles.photoHint}><Camera size={17} /><span>{avatar ? 'Tap your profile picture to change your photo or logo.' : 'Sample logo shown. Tap the camera to add your own photo or business logo.'}</span></div>
              <section className={styles.fieldPanel}>
                <div className={styles.fieldHeading}><span className={styles.iconTile}><Briefcase size={19} /></span><div><label htmlFor="claim-bio">Tell customers why to choose you</label><p>Your services, experience and the areas you cover.</p></div></div>
                <textarea id="claim-bio" value={bio} maxLength={600} onChange={event => setBio(event.target.value)} placeholder="I specialise in… I have experience with… I serve customers in…" />
                <div className={styles.fieldFoot}><span>A few honest, specific sentences work best.</span><span>{bio.length}/600</span></div>
              </section>
              <section className={styles.fieldPanel}>
                <div className={styles.fieldHeading}><span className={styles.iconTile}><Images size={19} /></span><div><h4>Let your work do the talking.</h4><p>Add up to 5 photos of jobs you’ve completed.</p></div></div>
                <input ref={portfolioInputRef} type="file" accept="image/*" multiple className={styles.hiddenInput} aria-label="Choose photos of your completed work" onChange={event => choosePortfolio(event.target.files)} />
                <div className={styles.gallery}>
                  {workSlots.map(slot => slot.type === 'empty' ? <button key={`empty-${slot.index}`} type="button" className={styles.uploadSlot} onClick={() => portfolioInputRef.current?.click()} aria-label={`Add work photo ${slot.index + 1}`}><Plus size={22} /><span>Add photo</span></button> : <div key={`${slot.type}-${slot.index}`} className={styles.workPhoto}><img src={slot.url} alt={`Your completed work ${slot.index + 1}`} />{slot.type === 'uploaded' ? <button type="button" onClick={() => removePortfolio(slot.index)} aria-label={`Remove work photo ${slot.index + 1}`}><X size={16} /></button> : <span>On your profile</span>}</div>)}
                </div>
                {portfolio.length < 5 && <button type="button" className={styles.uploadButton} onClick={() => portfolioInputRef.current?.click()}><Upload size={17} /> Add your work photos</button>}
                <p className={styles.optional}>Photos are optional. Your own, clear photos help customers understand what you can do.</p>
              </section>
              <aside className={styles.privacy}><ShieldCheck size={22} /><div><strong>Your number stays private.</strong><p>Your phone and WhatsApp number are not displayed openly in the public directory.</p></div></aside>
            </div>
          </article>
        </section>

        {exampleProvider ? (() => {
          const gallery = exampleGallery(exampleProvider);
          return (
            <details className={styles.example}>
              <summary><span className={styles.iconTile}><Eye size={19} /></span><span>See an example<small>Explore a completed provider profile</small></span><Plus size={18} /></summary>
              <div id="claim-profile-example" className={`${styles.exampleBody} overflow-hidden rounded-[1.5rem] border border-white/10 bg-[#101010] shadow-[0_20px_55px_rgba(0,0,0,.35)]`}>
                <div className="border-b border-white/10 px-4 py-4 sm:px-5">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">EXAMPLE ONLY — NOT YOUR PROFILE</div>
                  <h2 className="mt-2 text-lg font-black sm:text-xl">See what a finished profile can look like</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-400">
                    This is Triple T Landscaping, an existing SkillsConnect Pro provider. It is shown only to demonstrate how a completed profile can look.
                  </p>
                </div>

                <article className="m-3 overflow-hidden rounded-[1.2rem] border border-white/10 bg-[#f3eedf] text-[#172019] sm:m-4">
                  <div className="relative min-h-[180px] overflow-hidden bg-[#173827] sm:min-h-[220px]">
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

                  <div className="p-4 sm:p-5">
                    <div className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5e704f]">{exampleProvider.category || 'Local service provider'}</div>
                    <h3 className="mt-2 text-xl font-black leading-tight">{exampleName(exampleProvider)}</h3>
                    <div className="mt-3 flex items-start gap-2 text-sm text-[#667064]">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>{exampleProvider.location || 'Local service area'}</span>
                    </div>

                    <div className="mt-3 rounded-xl bg-[#dfe8d6] p-3">
                      <div className="flex items-center gap-2 text-sm font-black">
                        <Star className="h-4 w-4 text-[#9e7500]" /> New provider
                      </div>
                      <div className="mt-1 text-xs text-[#5f695c]">Building marketplace history</div>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#cbc5b5] bg-[#fffdf6] p-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[#667064]">About this provider</div>
                      <p className="mt-2 text-sm leading-6 text-[#4d584d]">
                        {editableBio(exampleProvider.bio) || 'Reliable local service provider showcasing skills, service area and completed work to customers on SkillsConnect Pro.'}
                      </p>
                    </div>

                    <div className="mt-3 rounded-xl border border-[#cbc5b5] bg-[#fffdf6] p-3">
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

                <div className="px-4 pb-4 text-center sm:px-5">
                  <div className="text-sm font-black text-amber-200">This is only an example</div>
                  <p className="mt-1 text-xs text-zinc-500">Close this example to continue with your own profile.</p>
                </div>
              </div>
            </details>
          );
        })() : null}


        <section className={styles.claimPanel}>
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-emerald-300" />
            <div>
              <h3 className="text-xl font-black">Ready to make it yours?</h3>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Claim your profile today. We’ll review your details before your profile appears to customers. Nothing is published immediately.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="checkbox"
            aria-checked={agreed}
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

          {error ? <div role="alert" className="mt-4 rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">{error}</div> : null}

          <button
            type="button"
            onClick={() => void submit()}
            disabled={preview || !agreed || submitting || preparingBanner}
            data-claim-submit className="mt-5 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-amber-300 px-5 text-sm font-black text-black shadow-[0_12px_30px_rgba(245,197,24,.18)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : <>Claim my free profile <ArrowUpRight size={18} /></>}
          </button>

          <p className="mt-4 text-center text-[11px] leading-5 text-zinc-400">
            Free to claim. Photos are optional. Your profile is reviewed before it goes live.
          </p>
        </section>
        <footer className={styles.footer}><a href="/terms">Terms of Service</a><span>·</span><a href="/privacy-policy">Privacy Policy</a></footer>
      </div>
    </main>
  );
};
