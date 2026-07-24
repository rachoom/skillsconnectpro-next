"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '../services/supabase';
import {
  ShieldCheck,
  Briefcase,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  Loader2,
  UploadCloud,
  Image as ImageIcon,
  ExternalLink,
  X,
  MessageCircle,
  Zap,
} from 'lucide-react';
import { VerifiedIcon } from './Icons';
import { Artisan } from '../types'; 

export const ClaimProfile: React.FC = () => {
  const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif',
  ]);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [success, setSuccess] = useState(false);
  const [inviteToken, setInviteToken] = useState<string>('');
  const [claimError, setClaimError] = useState('');
  const [claimSuccessMessage, setClaimSuccessMessage] = useState('');
  const [origin, setOrigin] = useState('');

  // --- NEW: Image Upload States ---
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [portfolio, setPortfolio] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('invite');
    const claimId = urlParams.get('claim');
    const targetId = inviteId || claimId;

    if (!targetId) {
      setLoading(false);
      setError('This VIP link is missing a valid profile ID.');
      return;
    }

    setInviteToken(targetId);

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('artisans')
          .select('*') // You can specify columns to be more efficient
          .eq('id', targetId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Profile not found.");
        if (data.is_claimed) setSuccess(true);

        setArtisan(data as Artisan);
      } catch (err: unknown) {
        console.error(err);
        setError("We couldn't find this profile. It may have been removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const profilePageUrl = useMemo(() => {
    if (!artisan?.id) return '/';
    return `/?profile=${artisan.id}`;
  }, [artisan?.id]);

  const claimLinkUrl = useMemo(() => {
    if (!inviteToken) return '/';
    if (!origin) return `/?claim=${inviteToken}`;
    return `${origin}/?claim=${inviteToken}`;
  }, [inviteToken, origin]);

  const whatsappShareUrl = useMemo(() => {
    const personName = `${artisan?.first_name || ''} ${artisan?.last_name || ''}`.trim() || 'my business';
    const message = `Hi! View ${personName}'s professional profile card on Skills ConnectPro: ${claimLinkUrl}`;
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }, [artisan?.first_name, artisan?.last_name, claimLinkUrl]);

  const redirectToProfile = (id: string | number) => {
    const destination = `/?profile=${id}`;
    window.setTimeout(() => {
      router.replace(destination);
    }, 350);

    // Fallback hard navigation guarantees redirect even if client state is stale.
    window.setTimeout(() => {
      window.location.assign(destination);
    }, 1200);
  };

  const validateImageFile = (file: File): string | null => {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return `Unsupported file format for ${file.name}. Please upload JPG, PNG, WEBP, or HEIC images.`;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return `${file.name} is too large. Maximum size is 6MB per image.`;
    }

    return null;
  };

  // --- IMAGE HANDLERS ---
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validationError = validateImageFile(file);
      if (validationError) {
        setClaimError(validationError);
        return;
      }

      setClaimError('');
      setProfilePic(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      const firstInvalid = newFiles.map(validateImageFile).find(Boolean);
      if (firstInvalid) {
        setClaimError(firstInvalid);
        return;
      }

      if (portfolio.length + newFiles.length > 5) {
        setClaimError('You can only upload a maximum of 5 portfolio images.');
        return;
      }
      setClaimError('');
      setPortfolio([...portfolio, ...newFiles]);
      
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setPortfolioPreviews([...portfolioPreviews, ...newPreviews]);
    }
  };

  const removePortfolioImage = (index: number) => {
    const newPortfolio = [...portfolio];
    newPortfolio.splice(index, 1);
    setPortfolio(newPortfolio);

    const newPreviews = [...portfolioPreviews];
    newPreviews.splice(index, 1);
    setPortfolioPreviews(newPreviews);
  };

  // --- UPLOAD & CLAIM LOGIC ---
  const handleClaim = async () => {
    if (!artisan || !agreed) return;
    setClaimError('');
    setIsClaiming(true);

    try {
      let finalProfileUrl = artisan.image_url;
      const finalPortfolioUrls: string[] = [];

      // 1. Upload Profile Picture if selected
      if (profilePic) {
        const fileExt = profilePic.name.split('.').pop();
        const fileName = `profile-${artisan.id}-${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('artisan_media').upload(fileName, profilePic);
        
        if (!uploadError) {
          finalProfileUrl = supabase.storage.from('artisan_media').getPublicUrl(fileName).data.publicUrl;
        }
      }

      // 2. Upload Portfolio Images if selected
      if (portfolio.length > 0) {
        for (let i = 0; i < portfolio.length; i++) {
          const file = portfolio[i];
          const fileExt = file.name.split('.').pop();
          const fileName = `portfolio-${artisan.id}-${Date.now()}-${i}.${fileExt}`;
          const { error: uploadError } = await supabase.storage.from('artisan_media').upload(fileName, file);
          
          if (!uploadError) {
            finalPortfolioUrls.push(supabase.storage.from('artisan_media').getPublicUrl(fileName).data.publicUrl);
          }
        }
      }

      // 3. Update the Database
      const { error } = await supabase
        .from('artisans')
        .update({ 
          is_claimed: true,
          image_url: finalProfileUrl,
          portfolio_urls: finalPortfolioUrls
        })
        .eq('id', artisan.id);

      if (error) throw error;
      setClaimSuccessMessage('Profile accepted. Redirecting you to your live page...');
      setSuccess(true);
      redirectToProfile(artisan.id);
    } catch (err) {
      console.error(err);
      setClaimError('Something went wrong saving your profile. Please try again.');
    } finally {
      setIsClaiming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mb-4" />
        <p className="text-brand-yellow font-black tracking-widest animate-pulse">LOADING VIP INVITATION...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-black text-white mb-2">Oops!</h2>
        <p className="text-gray-400">{error}</p>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(16,185,129,0.3)]">
          <ShieldCheck className="w-12 h-12 text-emerald-400" />
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight mb-4">Profile <span className="text-emerald-400">Secured</span>.</h1>
        <p className="text-gray-400 max-w-md mx-auto mb-8 leading-relaxed">
          Welcome to the SkillsConnect network! Your profile is now officially verified and live for customers in the East Rand.
        </p>
        <p className="text-sm text-gray-500">{claimSuccessMessage || 'Redirecting you to your live profile...'}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#150f0a] text-white pt-20 pb-16 px-4 md:px-8 relative overflow-hidden">
      <div className="fixed inset-0 z-0 bg-[#0c0906]">
        <Image src="/artisans/hero-welder.jpg" alt="" fill priority sizes="100vw" className="object-cover mix-blend-luminosity opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#150f0a]/95 via-[#150f0a]/70 to-[#150f0a]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col gap-10">
        {claimSuccessMessage && (
          <div className="mx-auto w-full max-w-2xl rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-4 py-3 text-sm text-emerald-100 text-center">
            {claimSuccessMessage}
          </div>
        )}

        <div className="flex flex-col items-center text-center gap-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 text-brand-yellow px-6 py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(250,204,21,0.15)] flex items-center gap-2">
            <Zap className="w-4 h-4" /> Limited VIP Access
          </div>

          <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white max-w-4xl leading-[1.05]">
            Get Discovered. Get Verified. Grow Your Business with <span className="text-brand-yellow">Skills ConnectPro.</span>
          </h1>

          <p className="text-base md:text-lg font-medium max-w-3xl leading-relaxed text-gray-300">
            We pre-built your professional profile so clients can find and trust your business faster. Confirm your ownership, upload your proof of work, and go live.
          </p>
        </div>

        <div className="relative group w-full max-w-5xl mx-auto">
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-yellow/40 via-yellow-500/20 to-brand-yellow/40 rounded-[2rem] blur-2xl opacity-40 transition-opacity duration-700 pointer-events-none"></div>

          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/20 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden">
            <div className="flex-1 space-y-4 z-10">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-brand-yellow">Verified Professional Profile</p>
                {artisan?.verified && (
                  <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1">
                    <VerifiedIcon /> Verified Pro
                  </span>
                )}
              </div>

              <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white leading-[0.95]">
                {artisan?.first_name} {artisan?.last_name}
              </h2>

              <div className="space-y-2">
                <p className="text-xl font-bold tracking-widest uppercase text-brand-yellow">
                  {artisan?.category} {artisan?.location ? `• ${artisan.location}` : ''}
                </p>
                <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-6 text-gray-300 text-sm">
                  <span className="inline-flex items-center gap-2 justify-center md:justify-start"><Briefcase size={15} className="text-brand-yellow" /> {artisan?.category || 'Specialist'}</span>
                  <span className="inline-flex items-center gap-2 justify-center md:justify-start"><MapPin size={15} className="text-brand-yellow" /> {artisan?.location || 'East Rand Network'}</span>
                  {artisan?.phone && <span className="inline-flex items-center gap-2 justify-center md:justify-start"><Phone size={15} className="text-brand-yellow" /> {artisan.phone}</span>}
                </div>
              </div>
            </div>

            <div className="relative w-52 h-52 md:w-60 md:h-60 rounded-full overflow-hidden border-[6px] border-white/20 shadow-[0_0_40px_rgba(250,204,21,0.2)] ring-1 ring-brand-yellow/20">
              {profilePreview ? (
                <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
              ) : artisan?.image_url ? (
                <Image src={artisan.image_url} alt="Profile" fill sizes="(max-width: 768px) 208px, 240px" className="object-cover" />
              ) : (
                <div className="w-full h-full bg-black/50 flex items-center justify-center">
                  <ImageIcon className="w-14 h-14 text-zinc-500" />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-4 md:gap-6 w-full max-w-2xl mx-auto">
          <a
            href={whatsappShareUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-3 bg-gradient-to-r from-emerald-500 to-emerald-700 border border-emerald-400/50 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-[1.02]"
          >
            <MessageCircle className="w-5 h-5" />
            <span>WhatsApp Profile Card</span>
          </a>

          <a
            href={profilePageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-3 bg-white/5 backdrop-blur-xl border border-white/20 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs md:text-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:bg-brand-yellow hover:text-black hover:border-brand-yellow hover:scale-[1.02]"
          >
            <span>Visit Full Profile</span>
            <ExternalLink className="w-5 h-5" />
          </a>
        </div>

        <div className="w-full max-w-5xl mx-auto bg-black/35 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl">
          <h3 className="text-xl md:text-2xl font-black text-white mb-2">Complete Your VIP Claim</h3>
          <p className="text-sm text-gray-400 mb-6">Optional uploads improve conversion, but terms acceptance is required to activate your verified listing.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-yellow mb-3">Profile Photo</p>
              <label className="w-full min-h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-brand-yellow/60 transition-colors p-3">
                <UploadCloud className="w-6 h-6 text-brand-yellow" />
                <span className="text-xs text-gray-300 text-center">Upload a clear headshot or business logo</span>
                <input type="file" accept="image/*" onChange={handleProfileChange} className="hidden" />
              </label>
            </div>

            <div className="bg-zinc-900/70 border border-white/10 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-brand-yellow">Proof of Work</p>
                {portfolioPreviews.length < 5 && (
                  <label className="text-[11px] text-gray-200 font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1 hover:text-brand-yellow transition-colors">
                    <UploadCloud size={14} /> Add
                    <input type="file" accept="image/*" multiple onChange={handlePortfolioChange} className="hidden" />
                  </label>
                )}
              </div>

              {portfolioPreviews.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {portfolioPreviews.map((src, index) => (
                    <div key={index} className="aspect-square rounded-lg border border-white/10 overflow-hidden relative group">
                      <img src={src} alt={`Portfolio ${index + 1}`} className="w-full h-full object-cover" />
                      <button onClick={() => removePortfolioImage(index)} className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity" aria-label="Remove image">
                        <X size={12} strokeWidth={3} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="w-full min-h-32 border-2 border-dashed border-white/20 rounded-xl flex flex-col items-center justify-center text-gray-500">
                  <ImageIcon className="w-6 h-6 mb-1" />
                  <p className="text-xs">No images uploaded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer hover:bg-emerald-500/20 transition-colors" onClick={() => setAgreed(!agreed)}>
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 shrink-0 w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${agreed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'}`}>
                {agreed && <CheckCircle size={16} className="text-black" strokeWidth={3} />}
              </div>
              <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                <strong>Yes, this is my business.</strong> I claim this profile, agree to the SkillsConnect Terms of Service, and consent to my business information being displayed publicly.
              </p>
            </div>
          </div>

          {claimError && (
            <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {claimError}
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={!agreed || isClaiming}
            className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs md:text-sm transition-all duration-300 ${
              agreed && !isClaiming
                ? 'bg-brand-yellow text-black hover:scale-[1.01] shadow-[0_0_30px_rgba(250,204,21,0.3)]'
                : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isClaiming ? (
              <>
                <Loader2 className="animate-spin" size={20} /> SAVING PROFILE AND REDIRECTING...
              </>
            ) : (
              'Accept and Go Live'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};