"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase'; 
import { VerifiedIcon } from './Icons'; 
import { ExternalLink, MessageCircle, Zap } from 'lucide-react'; 

// --- SMART IMAGE COMPONENT ---
const ImageWithSkeleton: React.FC<{ src: string; alt: string; className?: string; onClick?: () => void }> = ({ src, alt, className, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-[#1a1a1a] ${className}`} onClick={onClick}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-white/10 z-10" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'}`}
      />
    </div>
  );
};

interface ArtisanMarketingData {
  id: string;
  name: string;
  category: string;
  location: string;
  profile_image: string;
  verified: boolean;
  phone: string;
}

export const MarketingProfileCard: React.FC<{ artisanId: string }> = ({ artisanId }) => {
  const [artisan, setArtisan] = useState<ArtisanMarketingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchArtisan() {
      if (!artisanId) return;
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('artisans')
          .select('id, first_name, last_name, category, location, image_url, verified, phone')
          .eq('id', artisanId)
          .single();

        if (data && !error) {
          setArtisan({
            id: data.id,
            name: `${data.first_name} ${data.last_name || ''}`,
            category: data.category || 'Professional Trade',
            location: data.location || 'East Rand Network',
            profile_image: data.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop', 
            verified: data.verified === true,
            phone: data.phone || ''
          });
        }
      } catch (err) {
        console.error("Error fetching artisan:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchArtisan();
  }, [artisanId]);

  const shareMessage = `Hi! View my professional profile card on Skills ConnectPro, the East Rand's Specialist Network: https://skillsconnectpro.co.za/?claim=${artisanId}`; 
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#150f0a] text-white flex flex-col items-center justify-center p-6 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-brand-yellow/10 border-2 border-brand-yellow/20 flex items-center justify-center">
          <Zap className="w-8 h-8 text-brand-yellow opacity-50" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 mt-6">Loading Marketing Profile...</p>
      </div>
    );
  }

  if (!artisan) {
    return (
      <div className="min-h-screen bg-[#150f0a] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-full border-2 border-brand-yellow/30 bg-black/40 flex items-center justify-center text-red-500 mb-8 shadow-3xl">🚫</div>
        <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Profile Card <span className="text-brand-yellow">Error</span></h1>
        <p className="text-gray-400 max-w-sm mb-12">The digital marketing profile card could not be generated for this artisan ID.</p>
        <button onClick={() => window.location.href = '/'} className="px-12 py-5 bg-brand-yellow text-black rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl hover:scale-105 transition-transform">Return to Network</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#150f0a] text-white pt-24 pb-20 px-4 md:px-8 relative overflow-hidden">
      
      {/* 🚀 BROUGHT BACK THE CSS ANIMATIONS JUST FOR THIS PAGE */}
      <style>{`
        @keyframes deep-breathing { 
            0%, 100% { opacity: 0.3; filter: brightness(0.7) saturate(1.1); transform: scale(1); } 
            50% { opacity: 0.7; filter: brightness(1.2) saturate(1.3); transform: scale(1.05); } 
        }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-deep-breathing { animation: deep-breathing 8s ease-in-out infinite; }
        .card-3d { transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.5s ease; transform-style: preserve-3d; }
        .card-3d:hover { transform: translateY(-12px); box-shadow: 0 30px 60px -12px rgba(250, 204, 21, 0.25); }
      `}</style>

      {/* ── ENHANCED CINEMATIC BACKGROUND ── */}
      <div className="fixed inset-0 z-0 bg-[#0c0906]">
        <img src="/artisans/hero-welder.jpg" className="absolute inset-0 w-full h-full object-cover animate-deep-breathing mix-blend-luminosity" alt="" />
        {/* Adjusted gradient to let the breathing image pop through more in the center */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#150f0a]/95 via-[#150f0a]/50 to-[#150f0a] backdrop-blur-[2px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center gap-12 text-center">

        <div className="bg-white/5 backdrop-blur-md border border-white/10 text-brand-yellow px-6 py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.3em] shadow-[0_0_30px_rgba(250,204,21,0.15)] flex items-center gap-2">
          ⚡ Limited VIP Access
        </div>

        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white max-w-4xl mx-auto leading-[1.05] drop-shadow-2xl">
          Get Discovered. Get Verified. Grow Your Business with <span className="text-brand-yellow drop-shadow-[0_0_30px_rgba(250,204,21,0.4)]">Skills ConnectPro.</span>
        </h1>

        <p className="text-lg md:text-xl font-medium max-w-2xl leading-relaxed text-gray-300 drop-shadow-lg">
          We have revolutionized how East Rand artisans connect with customers. Get seen by hundreds of local clients looking for top-tier skills. This is <span className="text-white font-bold">100% free marketing</span> for trusted local professionals.
        </p>

        {/* ── ULTIMATE FROSTED GLASS CARD ── */}
        <div className="relative group w-full max-w-5xl mx-auto mt-8 card-3d">
          {/* Intense Glow Behind Card */}
          <div className="absolute -inset-2 bg-gradient-to-r from-brand-yellow/40 via-yellow-500/20 to-brand-yellow/40 rounded-[3.5rem] blur-2xl opacity-40 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>

          {/* The Glass Component itself */}
          <div className="relative bg-white/5 backdrop-blur-2xl border border-white/20 p-10 md:p-16 flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left rounded-[3rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] overflow-hidden">
            
            {/* Shimmer sweep inside card */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_2.5s_infinite] skew-x-12 pointer-events-none"></div>

            <div className="flex-1 space-y-4 relative z-10">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <p className="text-sm font-black uppercase tracking-[0.3em] text-brand-yellow drop-shadow-md">Verified Professional Profile</p>
                {artisan.verified && <span className="bg-green-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-[0_0_15px_rgba(34,197,94,0.5)]"><VerifiedIcon /> Verified Pro</span>}
              </div>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic tracking-tighter text-white leading-[0.95] drop-shadow-xl">{artisan.name}</h2>
              <p className="text-2xl font-bold tracking-widest uppercase text-brand-yellow drop-shadow-md">{artisan.category} • {artisan.location}</p>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-10 md:gap-16 relative z-10">
              <div className="relative w-56 h-56 md:w-64 md:h-64 rounded-full overflow-hidden border-[6px] border-white/20 shadow-[0_0_40px_rgba(250,204,21,0.2)] transform group-hover:scale-105 group-hover:border-brand-yellow/50 transition-all duration-500">
                <ImageWithSkeleton src={artisan.profile_image} alt={artisan.name} className="w-full h-full object-cover" />
              </div>
            </div>
          </div>
        </div>

        {/* ── PREMIUM STYLED BUTTONS ── */}
        <div className="flex flex-col md:flex-row justify-center gap-6 mt-16 w-full max-w-2xl mx-auto px-4 relative z-10">
          
          {/* WhatsApp Button - Vibrant Gradient */}
          <a
            href={whatsappShareUrl} 
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 group relative flex items-center justify-center gap-4 bg-gradient-to-r from-emerald-500 to-emerald-700 border border-emerald-400/50 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(16,185,129,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_40px_rgba(16,185,129,0.5)] overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_2s_infinite] skew-x-12"></div>
            <MessageCircle className="w-6 h-6 drop-shadow-md" />
            <span className="drop-shadow-md">WhatsApp Profile Card</span>
          </a>

          {/* Profile Button - Premium Frosted Glass */}
          <a
            href={`/?profile=${artisanId}`} 
            className="flex-1 group relative flex items-center justify-center gap-4 bg-white/5 backdrop-blur-xl border border-white/20 text-white px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)] transition-all duration-300 hover:bg-brand-yellow hover:text-black hover:border-brand-yellow hover:scale-105 hover:shadow-[0_15px_40px_rgba(250,204,21,0.4)]"
          >
            <span>Visit Full Profile</span>
            <ExternalLink className="w-6 h-6 transition-transform group-hover:translate-x-1" />
          </a>
        </div>

        {/* ── FOOTER MESSAGING ── */}
        <div className="mt-32 text-center max-w-2xl mx-auto space-y-6 relative z-10">
          <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-yellow mb-4 drop-shadow-md">Artisan Marketing Solution RSA</h4>
          <h2 className={`text-4xl font-black mb-8 tracking-tighter text-white drop-shadow-lg`}>Unlock Your Business Potential Locally</h2>
          <p className="text-gray-300 font-medium leading-relaxed mb-12 drop-shadow-md">
            This is your personalized digital marketing card on the premier network for Far East Rand specialists. Send this card to your clients to market yourself and simultaneously help connect East Rand consumers with verified specialists.
          </p>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-500">© {new Date().getFullYear()} Skills Connect RSA • The East Rand Specialist Network</p>
        </div>

      </div>
    </div>
  );
}