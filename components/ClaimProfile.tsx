import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { ShieldCheck, Briefcase, MapPin, Phone, CheckCircle, AlertCircle, Loader2, UploadCloud, Image as ImageIcon, ExternalLink, X } from 'lucide-react';
import { Artisan } from '../types'; 

export const ClaimProfile: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [artisan, setArtisan] = useState<Artisan | null>(null);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [success, setSuccess] = useState(false);

  // --- NEW: Image Upload States ---
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>('');
  const [portfolio, setPortfolio] = useState<File[]>([]);
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const inviteId = urlParams.get('invite');

    if (!inviteId) {
      setLoading(false);
      // No error needed if it's not an invite link, just don't render this component.
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('artisans')
          .select('*') // You can specify columns to be more efficient
          .eq('id', inviteId)
          .single();

        if (error) throw error;
        if (!data) throw new Error("Profile not found.");
        if (data.is_claimed) setSuccess(true);

        setArtisan(data as Artisan);
      } catch (err: any) {
        console.error(err);
        setError("We couldn't find this profile. It may have been removed.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // --- IMAGE HANDLERS ---
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProfilePic(file);
      setProfilePreview(URL.createObjectURL(file));
    }
  };

  const handlePortfolioChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      if (portfolio.length + newFiles.length > 5) {
        alert("You can only upload a maximum of 5 portfolio images.");
        return;
      }
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
    setIsClaiming(true);

    try {
      let finalProfileUrl = artisan.image_url;
      let finalPortfolioUrls: string[] = [];

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
      setSuccess(true);
    } catch (err) {
      console.error(err);
      alert("Something went wrong saving your profile. Please try again.");
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
        <button onClick={() => window.location.href = '/'} className="px-8 py-4 bg-brand-yellow text-black font-black uppercase tracking-widest text-sm rounded-xl hover:scale-105 transition-transform">
          View Live Directory
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 md:p-6 relative overflow-hidden py-12">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-yellow/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-2xl bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 md:p-10 relative z-10 shadow-2xl animate-fade-in-up my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* LOGO & BRANDING */}
        <div className="flex flex-col items-center justify-center mb-8 border-b border-white/10 pb-8">
           <img src="/logo-new.svg" alt="SkillsConnectPro" className="h-16 md:h-20 w-auto mb-6" />
           <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight text-center">Exclusive <span className="text-brand-yellow">Invitation</span></h1>
           <p className="text-gray-400 mt-3 text-sm md:text-base text-center max-w-md">We've pre-built a VIP profile for your business to help you get more clients in the East Rand.</p>
           
           {/* VIEW PLATFORM CONTEXT BUTTON */}
           <a href="/" target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center gap-2 text-brand-yellow bg-brand-yellow/10 hover:bg-brand-yellow/20 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-colors border border-brand-yellow/30">
              <ExternalLink size={14} /> See How The Platform Works
           </a>
        </div>

        {/* ARTISAN DATA PREVIEW */}
        <div className="bg-zinc-900/80 border border-white/5 rounded-2xl p-6 mb-8 shadow-inner">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* PROFILE PICTURE UPLOAD */}
            <div className="relative group shrink-0">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-zinc-800 overflow-hidden bg-zinc-900 flex items-center justify-center">
                {profilePreview ? (
                  <img src={profilePreview} alt="Profile Preview" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-zinc-600" />
                )}
              </div>
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full backdrop-blur-sm">
                <UploadCloud className="text-brand-yellow w-6 h-6 mb-1" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider text-center px-2">Upload<br/>Photo</span>
                <input type="file" accept="image/*" onChange={handleProfileChange} className="hidden" />
              </label>
            </div>

            <div className="text-center md:text-left flex-1">
              <h2 className="text-2xl font-black text-white mb-4">{artisan?.first_name} {artisan?.last_name}</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10"><Briefcase size={14} className="text-brand-yellow"/></div>
                  <span className="font-bold uppercase tracking-wider text-sm">{artisan?.category}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10"><MapPin size={14} className="text-brand-yellow"/></div>
                  <span className="font-medium text-sm">{artisan?.location}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-3 text-gray-300">
                  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center border border-white/10"><Phone size={14} className="text-brand-yellow"/></div>
                  <span className="font-medium text-sm">{artisan?.phone}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* PORTFOLIO UPLOAD GRID */}
        <div className="mb-8">
           <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold uppercase tracking-widest text-sm">Proof of Work <span className="text-gray-500 normal-case font-normal text-xs">(Optional, max 5)</span></h3>
              {portfolioPreviews.length < 5 && (
                <label className="text-brand-yellow hover:text-white text-xs font-bold uppercase tracking-widest cursor-pointer flex items-center gap-1 transition-colors">
                  <UploadCloud size={14} /> Add Images
                  <input type="file" accept="image/*" multiple onChange={handlePortfolioChange} className="hidden" />
                </label>
              )}
           </div>
           
           {portfolioPreviews.length > 0 ? (
             <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                {portfolioPreviews.map((src, index) => (
                  <div key={index} className="aspect-square rounded-xl border border-white/10 overflow-hidden relative group">
                    <img src={src} alt={`Portfolio ${index}`} className="w-full h-full object-cover" />
                    <button onClick={() => removePortfolioImage(index)} className="absolute top-1 right-1 bg-red-500/80 text-white p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={12} strokeWidth={3} />
                    </button>
                  </div>
                ))}
             </div>
           ) : (
             <div className="w-full py-8 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center bg-black/20 text-gray-500">
                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-xs">No images uploaded yet.</p>
             </div>
           )}
        </div>

        {/* THE LEGAL CHECKBOX */}
        <div className="mb-8 p-4 md:p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl cursor-pointer hover:bg-emerald-500/20 transition-colors" onClick={() => setAgreed(!agreed)}>
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 shrink-0 w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${agreed ? 'bg-emerald-500 border-emerald-500' : 'border-gray-500'}`}>
              {agreed && <CheckCircle size={16} className="text-black" strokeWidth={3} />}
            </div>
            <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
              <strong>Yes, this is my business.</strong> I claim this profile, agree to the SkillsConnect Terms of Service, and consent to my business information being displayed publicly.
            </p>
          </div>
        </div>

        {/* ACTION BUTTON */}
        <button 
          onClick={handleClaim}
          disabled={!agreed || isClaiming}
          className={`w-full h-16 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-sm transition-all duration-300 ${
            agreed && !isClaiming 
              ? 'bg-brand-yellow text-black hover:scale-[1.02] shadow-[0_0_30px_rgba(250,204,21,0.3)]' 
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {isClaiming ? <><Loader2 className="animate-spin" size={20} /> SAVING PROFILE & UPLOADS...</> : 'Claim My Profile Now'}
        </button>

      </div>
    </div>
  );
};