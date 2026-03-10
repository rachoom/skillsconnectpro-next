"use client";

import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

// --- FIXED RELATIVE IMPORTS ---
import { supabase } from '../services/supabase';
import { ClaimProfile } from '../components/ClaimProfile';
import { Artisan, AppState } from '../types';
import { EAST_RAND_LOCATIONS } from '../services/mockData';
import { SearchIcon, LocationIcon, VerifiedIcon } from '../components/Icons';
import { AIChatAssistant } from '../components/AIChatAssistant';
import { AdminDashboard } from '../components/AdminDashboard';
import { VoiceAssistant } from '../components/VoiceAssistant';
import { CameraAssistant } from '../components/CameraAssistant';
import NetworkAnimation from '../components/NetworkAnimation';
import BusinessDetail from '../components/BusinessDetail';
import { translateText } from '../services/translationService'; 
import { QuickOnboard } from '../components/QuickOnboard';
import { 
  Info, X, Wrench, Zap, Droplet, Hammer, Paintbrush, Truck, 
  Key, Scissors, Ruler, Flame, Grid, Shovel, 
  Shirt, Utensils, Baby, Trees, Sparkles 
} from 'lucide-react';

// --- DYNAMIC COMPONENTS ---
// This must sit below all imports, but above your config!
const MapView = dynamic(() => import('../components/MapView').then((mod) => mod.MapView), { 
  ssr: false 
});

// --- ASSETS & CONFIG ---
const QUICK_CATEGORIES = [
  { id: 'plumber', label: 'Plumber', image: '/artisans/Cards/Plumbing.png' },
  { id: 'electrician', label: 'Electrician', image: '/artisans/Cards/Electrician.png' },
  { id: 'builder', label: 'Builder', image: '/artisans/Cards/builders.png' },
  { id: 'carpenter', label: 'Carpenter', image: '/artisans/Cards/Carpenter.png' },
  { id: 'mechanic', label: 'Mechanic', image: '/artisans/Cards/Mechanic.png' },
  { id: 'general', label: 'General Contractor', image: '/artisans/Cards/General Artisan.png' },
  { id: 'painter', label: 'Painter', image: '/artisans/Cards/Painter.png' },
  { id: 'welder', label: 'Welder', image: '/artisans/Cards/Welders.png' },
  { id: 'tiler', label: 'Tiler', image: '/artisans/Cards/Tilers.png' },
  { id: 'cleaners', label: 'Cleaners', image: '/artisans/Cards/Cleaners.png' },
];

const MORE_SERVICES = [
  { id: 'fashion', label: 'Fashion', icon: <Shirt className="w-5 h-5" />, image: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2574&auto=format&fit=crop' },
  { id: 'landscaping', label: 'Landscaping', icon: <Trees className="w-5 h-5" />, image: 'https://images.unsplash.com/photo-1557429287-b2e26467fc2b?q=80&w=2535&auto=format&fit=crop' },
  { id: 'transport', label: 'Transport', icon: <Truck className="w-5 h-5" />, image: 'https://images.unsplash.com/photo-1519003722824-194d4455a60c?q=80&w=2675&auto=format&fit=crop' },
  { id: 'catering', label: 'Catering', icon: <Utensils className="w-5 h-5" />, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=2670&auto=format&fit=crop' },
  { id: 'daycare', label: 'Day Care', icon: <Baby className="w-5 h-5" />, image: '/artisans/Cards/daycare.png' },
  { id: 'beauty', label: 'Beauty', icon: <Sparkles className="w-5 h-5" />, image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?q=80&w=2670&auto=format&fit=crop' },
];

const CATEGORIES = [
  'Builders', 'Plumbers', 'Electricians', 'Painters', 'Carpenters',
  'Cleaners', 'Landscapers', 'Mechanics', 'Hairdressers', 'Dressmakers', 'Tailors', 'Welders', 'Tilers', 'Fashion', 'Creches', 'General Contractors'
];

const EXTENDED_LOCATIONS = [...EAST_RAND_LOCATIONS, 'Daveyton'].filter((item, index, self) => self.indexOf(item) === index);

interface FeaturedAd {
  id: number;
  brand_name: string;
  title: string;
  subtitle: string;
  category: string;
  image_url: string;
  link_url?: string;
}

interface Review {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  status: 'pending' | 'approved';
}
// 🟢 COMPONENT: HERO TYPER
const HeroTyper: React.FC = () => {
    const words = ["Artisans", "Plumbers", "Electricians", "Builders", "Mechanics"];
    const [index, setIndex] = useState(0);
    const [subIndex, setSubIndex] = useState(0);
    const [reverse, setReverse] = useState(false);
    const [blink, setBlink] = useState(true);
 
    

    useEffect(() => {
        const timeout2 = setTimeout(() => setBlink(!blink), 500);
        return () => clearTimeout(timeout2);
    }, [blink]);

    useEffect(() => {
        if (subIndex === words[index].length + 1 && !reverse) {
            setReverse(true);
            return;
        }

        if (subIndex === 0 && reverse) {
            setReverse(false);
            setIndex((prev) => (prev + 1) % words.length);
            return;
        }

        const timeout = setTimeout(() => {
            setSubIndex((prev) => prev + (reverse ? -1 : 1));
        }, Math.max(reverse ? 75 : subIndex === words[index].length ? 1000 : 150, parseInt(Math.random() * 350 + "")));

        return () => clearTimeout(timeout);
    }, [subIndex, index, reverse, words]);

    return (
        <span className="text-brand-yellow">
            {`${words[index].substring(0, subIndex)}${blink ? "|" : " "}`}
        </span>
    );
};

// 🟢 COMPONENT: TOAST
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[300] flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl animate-slide-up border ${type === 'success' ? 'bg-[#0a2e1e] border-green-500/50 text-green-100' : 'bg-[#2e0a0a] border-red-500/50 text-red-100'}`}>
      <span className="text-xl">{type === 'success' ? '✅' : '⚠️'}</span>
      <span className="font-bold text-sm">{message}</span>
    </div>
  );
};

// 🟢 COMPONENT: SMART IMAGE
const ImageWithSkeleton: React.FC<{ src: string; alt: string; className?: string; onClick?: () => void }> = ({ src, alt, className, onClick }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-white/5 ${className}`} onClick={onClick}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-gray-300 dark:bg-white/10 z-10" />}
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

// 🟢 COMPONENT: SMART REVIEW CARD (With Translation)
const ReviewCard: React.FC<{ review: Review, isDarkMode: boolean }> = ({ review, isDarkMode }) => {
    const [translatedText, setTranslatedText] = useState<string | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const handleTranslate = async () => {
        setIsTranslating(true);
        const result = await translateText(review.comment, 'en');
        if (result) {
            const parser = new DOMParser();
            const decodedString = parser.parseFromString(result, 'text/html').body.textContent;
            setTranslatedText(decodedString);
        }
        setIsTranslating(false);
    };

    return (
        <div className={`p-6 rounded-2xl ${isDarkMode ? 'bg-[#111] border border-white/5' : 'bg-gray-50 border border-gray-200'}`}>
            <div className="flex justify-between mb-2">
                <span className="font-bold text-lg">{review.reviewer_name}</span>
                <div className="text-brand-yellow">
                    {'★'.repeat(review.rating)}<span className="text-gray-600">{'★'.repeat(5 - review.rating)}</span>
                </div>
            </div>
            
            <p className={`text-sm italic ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                "{translatedText || review.comment}"
            </p>
            
            <div className="flex justify-between items-center mt-4">
                <span className="text-xs text-gray-500 block uppercase tracking-widest">
                    {new Date(review.created_at).toLocaleDateString()}
                </span>
                
                {!translatedText ? (
                    <button 
                        onClick={handleTranslate} 
                        disabled={isTranslating}
                        className={`text-[10px] font-black uppercase tracking-widest transition-colors flex items-center gap-1 ${isTranslating ? 'text-gray-500' : 'text-brand-yellow hover:text-white'}`}
                    >
                        {isTranslating ? '⏳ Translating...' : '🌍 Translate to English'}
                    </button>
                ) : (
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500 flex items-center gap-1">
                        ✓ Translated via Google AI
                    </span>
                )}
            </div>
        </div>
    );
};

// 🟢 COMPONENT: APP-LIKE WELCOME SPLASH
const WelcomeSplash: React.FC<{ onEnter: () => void, isDarkMode: boolean }> = ({ onEnter, isDarkMode }) => {
    return (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center`}">
            {/* Cinematic Background */}
            <div className="absolute inset-0 z-0 bg-[#0c0906]">
                {/* 1. Base Image */}
                <img src="/artisans/hero-welder.jpg" className="absolute inset-0 w-full h-full object-cover animate-deep-breathing opacity-20 mix-blend-luminosity z-0" alt="Industrial Background" />
                
                {/* 2. Dark Gradient */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#150f0a]/95 via-[#150f0a]/70 to-[#150f0a] z-10"></div>
                
                {/* 3. The Mudcloth Pattern (Sits ON TOP so it's fully visible!) */}
                <div className="absolute inset-0 z-20 bg-mudcloth opacity-0"></div>
            </div>

            {/* Floating Content */}
            <div className="relative z-30 flex flex-col items-center text-center px-6 w-full max-w-lg card-3d">
                <div className="w-32 h-32 mb-8 relative">
                    <div className="absolute inset-0 bg-brand-yellow rounded-full animate-ping opacity-20 duration-1000"></div>
                    <div className="relative w-full h-full bg-black/50 backdrop-blur-xl border border-brand-yellow/30 rounded-[2.5rem] shadow-[0_0_50px_rgba(250,204,21,0.2)] flex items-center justify-center transform rotate-3 hover:rotate-0 transition-all duration-500">
                         <img src="/logo-new.svg" alt="Logo" className="w-20 h-20 object-contain drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                    </div>
                </div>

                <h1 className="text-5xl md:text-6xl font-black mb-4 text-white tracking-tighter drop-shadow-2xl">
                    Skills<span className="text-brand-yellow italic">ConnectPro</span>
                </h1>
                
                <p className="text-brand-yellow text-[10px] font-black uppercase tracking-[0.4em] mb-8 border border-brand-yellow/30 px-4 py-2 rounded-full bg-black/40 backdrop-blur-md">
                    The East Rand Specialist Network
                </p>

                <p className="text-gray-300 text-lg mb-12 font-medium leading-relaxed drop-shadow-md">
                    Connect with verified, top-tier artisans in your area instantly. <br/><span className="text-white font-bold">100% Free to search.</span>
                </p>

                {/* The "Enter App" Button */}
                <button 
                    onClick={onEnter}
                    className="group relative w-full bg-brand-yellow text-black py-6 rounded-3xl font-black uppercase tracking-widest text-lg hover:bg-white transition-all duration-300 shadow-[0_20px_40px_rgba(250,204,21,0.3)] hover:shadow-[0_20px_60px_rgba(250,204,21,0.5)] hover:-translate-y-2 flex items-center justify-center gap-4 overflow-hidden"
                >
                    <div className="absolute inset-0 w-full h-full bg-white/20 translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
                    <span>Find a Service</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-6 h-6 transition-transform group-hover:translate-x-2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

// 📄 MODALS
const PRIVACY_POLICY = (
  <div className="space-y-4 text-gray-600 dark:text-gray-300">
    <p><strong>Last Updated: January 2026</strong></p>
    <p>At Skills Connect, we are committed to protecting your privacy...</p>
    <h4 className="text-gray-900 dark:text-white font-bold pt-2">1. Information We Collect</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>Artisans:</strong> We collect business names, contact details, location data, and portfolio images.</li>
      <li><strong>Users:</strong> We collect search query data and location data (if granted).</li>
    </ul>
  </div>
);

const TERMS_OF_SERVICE = (
  <div className="space-y-4 text-gray-600 dark:text-gray-300">
    <p><strong>Intellectual Property & Data Usage Policy</strong></p>
    <p>By accessing Skills Connect, you agree to the following terms...</p>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>No Scraping:</strong> Automated extraction of data is prohibited.</li>
      <li><strong>No Commercial Solicitation:</strong> Do not use contact details for marketing.</li>
    </ul>
  </div>
);

const VERIFICATION_PROCESS = (
  <div className="space-y-4 text-gray-600 dark:text-gray-300">
    <p>Skills Connect employs a strict vetting process...</p>
    <div className="flex gap-4 items-start pt-2">
      <div className="bg-brand-yellow text-black font-black w-8 h-8 rounded-full flex items-center justify-center shrink-0">1</div>
      <div><h4 className="text-gray-900 dark:text-white font-bold">Identity Check</h4><p className="text-sm">We verify government ID and proof of residence.</p></div>
    </div>
    <div className="mt-4 p-4 bg-white/5 rounded-xl border border-brand-yellow/30">
      <p className="text-brand-yellow text-sm font-bold text-center">LOOK FOR THE GREEN BADGE</p>
    </div>
  </div>
);

const InfoModal: React.FC<{ title: string; content: React.ReactNode; onClose: () => void }> = ({ title, content, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-white/10 w-full max-w-lg rounded-3xl p-8 shadow-2xl relative" onClick={e => e.stopPropagation()}>
      <button onClick={onClose} className="absolute top-6 right-6 text-gray-500 hover:text-black dark:hover:text-white transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>
      <h2 className="text-2xl font-black text-brand-yellow uppercase tracking-tight mb-6">{title}</h2>
      <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">{content}</div>
      <div className="mt-8 pt-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
        <button onClick={onClose} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-bold uppercase text-xs rounded-xl hover:bg-brand-yellow transition-colors">Close</button>
      </div>
    </div>
  </div>
);

const ReviewModal: React.FC<{ artisanId: number; artisanName: string; onClose: () => void; isDarkMode: boolean; showToast: (msg: string, type: 'success'|'error') => void }> = ({ artisanId, artisanName, onClose, isDarkMode, showToast }) => {
    const [name, setName] = useState('');
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [honeypot, setHoneypot] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (honeypot !== '') { onClose(); return; }
        const lastReview = localStorage.getItem(`reviewed_${artisanId}`);
        if (lastReview) {
            const date = new Date(lastReview);
            const now = new Date();
            const diffHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
            if (diffHours < 24) {
                showToast("You can only review this artisan once every 24 hours.", "error");
                onClose();
                return;
            }
        }

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('artisan_reviews').insert([{
                artisan_id: artisanId,
                artisan_name: artisanName,
                reviewer_name: name,
                rating: rating,
                comment: comment,
                status: 'pending'
            }]);

            if (error) throw error;
            localStorage.setItem(`reviewed_${artisanId}`, new Date().toISOString());
            showToast("Review submitted! It will appear after admin approval.", "success");
            onClose();
        } catch (err) {
            console.error(err);
            showToast("Failed to submit review.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative ${isDarkMode ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
                <h2 className={`text-2xl font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Rate {artisanName}</h2>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Share your experience to help the community.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Your Name</label>
                        <input value={name} onChange={e => setName(e.target.value)} className={`w-full rounded-xl p-3 font-bold outline-none border ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'}`} required />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Rating</label>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button type="button" key={star} onClick={() => setRating(star)} className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? 'text-brand-yellow' : 'text-gray-600'}`}>★</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase tracking-widest mb-2 text-gray-500">Comment</label>
                        <textarea value={comment} onChange={e => setComment(e.target.value)} className={`w-full h-24 rounded-xl p-3 font-bold outline-none border resize-none ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-black'}`} required />
                    </div>
                    <div className="opacity-0 absolute top-0 left-0 h-0 w-0 overflow-hidden"><input type="text" value={honeypot} onChange={e => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
                    
                    <div className="flex justify-end gap-3 pt-2">
                         <button type="button" onClick={onClose} className="px-6 py-3 text-gray-500 font-bold uppercase text-xs hover:text-white transition-colors">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-brand-yellow text-black font-black uppercase text-xs rounded-xl hover:bg-white transition-all shadow-lg">{isSubmitting ? '...' : 'Submit Review'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SuggestionModal: React.FC<{ onClose: () => void; isDarkMode: boolean; showToast: (msg: string, type: 'success'|'error') => void }> = ({ onClose, isDarkMode, showToast }) => {
    const [suggestion, setSuggestion] = useState('');
    const [contact, setContact] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!suggestion.trim()) return;
        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('service_suggestions').insert([
              { 
                suggestion_text: suggestion,
                contact_number: contact
              }
            ]);

            if (error) throw error;
            showToast("Suggestion sent to Admin Panel! Thank you.", "success");
            onClose();
        } catch (err) {
            console.error(err);
            showToast("Failed to submit suggestion. Please try again.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className={`w-full max-w-md rounded-3xl p-8 shadow-2xl relative ${isDarkMode ? 'bg-[#1a1a1a] border border-white/10' : 'bg-white border-gray-200'}`} onClick={e => e.stopPropagation()}>
                <h2 className={`text-2xl font-black uppercase tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Suggest a Service</h2>
                <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Let us know what's missing. We'll add it to the Admin Dashboard.</p>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Your Suggestion</label>
                        <textarea
                            value={suggestion}
                            onChange={(e) => setSuggestion(e.target.value)}
                            className={`w-full h-24 rounded-xl p-4 font-bold outline-none border resize-none ${isDarkMode ? 'bg-black/40 border-white/10 text-white focus:border-brand-yellow' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-yellow'}`}
                            placeholder="e.g., I need a graphic designer..."
                            required
                        />
                    </div>
                    <div>
                        <label className={`block text-xs font-bold uppercase tracking-widest mb-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Contact Number (Optional)</label>
                        <input 
                            type="tel"
                            value={contact}
                            onChange={(e) => setContact(e.target.value)}
                            className={`w-full rounded-xl p-4 font-bold outline-none border ${isDarkMode ? 'bg-black/40 border-white/10 text-white focus:border-brand-yellow' : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-brand-yellow'}`}
                            placeholder="082 123 4567"
                        />
                    </div>
                    <div className="flex justify-end gap-3 pt-2">
                         <button type="button" onClick={onClose} className={`px-6 py-3 font-bold uppercase text-xs rounded-xl transition-colors ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-black'}`}>Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-brand-yellow text-black font-black uppercase text-xs rounded-xl hover:bg-white transition-all shadow-lg disabled:opacity-50">{isSubmitting ? 'Sending...' : 'Send Suggestion'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};
const App: React.FC = () => {

  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchStep, setSearchStep] = useState<'category' | 'location'>('category');
  const [showBetaBanner, setShowBetaBanner] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 🚀 START ON THE WELCOME SPLASH SCREEN
const [appState, setAppState] = useState<AppState>(AppState.WELCOME);
// Add this with your other refs (categoryInputRef, locationInputRef, etc.)
const pillRef = useRef<HTMLDivElement>(null);
// 1. The Shapeshifter State (👉 THIS LINE WAS MISSING!)
const [isInteractive, setIsInteractive] = useState(false);

// 🎬 2. The Morph Sequence (Tied to the Home Screen!)
  useEffect(() => {
  let timer: NodeJS.Timeout;

  if (appState === AppState.HOME) {
    setIsInteractive(false);

    timer = setTimeout(() => {
      setIsInteractive(true);

      // Scroll pill into the center of the viewport after morph
      setTimeout(() => {
        if (pillRef.current) {
          const rect = pillRef.current.getBoundingClientRect();
          const scrollTop = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
          window.scrollTo({ top: scrollTop, behavior: 'smooth' });
        }
      }, 200);
    }, 2500);
  }

  return () => {
    if (timer) clearTimeout(timer);
  };
}, [appState]); 
  const [rovingIndex, setRovingIndex] = useState<number | null>(null);
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [selectedBusinessId, setSelectedBusinessId] = useState<number | null>(null);

  const [artisans, setArtisans] = useState<Artisan[]>([]);
  const [featuredAds, setFeaturedAds] = useState<FeaturedAd[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAds, setLoadingAds] = useState<boolean>(true);

  const [categoryInput, setCategoryInput] = useState<string>('');
  const [locationInput, setLocationInput] = useState<string>('');
  const [executedSearch, setExecutedSearch] = useState({ category: '', location: '' });
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [selectedArtisan, setSelectedArtisan] = useState<Artisan | null>(null);

  const [artisanReviews, setArtisanReviews] = useState<Review[]>([]);
  const [showReviewModal, setShowReviewModal] = useState(false);

  const categoryInputRef = useRef<HTMLInputElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);
  const suggestionRef = useRef<HTMLDivElement>(null);
  const skillSuggestionRef = useRef<HTMLDivElement>(null);

  const [regForm, setRegForm] = useState({ 
    firstName: '', 
    lastName: '', 
    trade: '', 
    area: '', 
    phone: '', 
    bio: '', 
    referralSource: '',
    institution: '' 
  });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [honeypot, setHoneypot] = useState('');

  const [activeModal, setActiveModal] = useState<'privacy' | 'verification' | 'terms' | null>(null);
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type });

  const handleContact = (type: 'call' | 'whatsapp', phone: string) => {
    if (!phone) { showToast("No phone number available.", "error"); return; }
    const cleanPhone = phone.replace(/\D/g, '');
    if (type === 'call') {
      window.location.href = `tel:${cleanPhone}`;
    } else {
      let waNumber = cleanPhone;
      if (waNumber.startsWith('0')) waNumber = '27' + waNumber.substring(1);
      const message = "Hi, I found you on Skills Connect. Are you available?";
      window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleSupport = () => {
    window.open(`https://wa.me/27697026088?text=${encodeURIComponent("Hi Skills Connect Support, I need assistance.")}`, '_blank');
  };

  useEffect(() => {
      if (appState === AppState.PROFILE && selectedArtisan) {
          const fetchReviews = async () => {
              const { data, error } = await supabase
                  .from('artisan_reviews')
                  .select('*')
                  .eq('artisan_id', selectedArtisan.id)
                  .eq('status', 'approved')
                  .order('created_at', { ascending: false })
                 .limit(5);         
              if (!error && data) setArtisanReviews(data);
          };
          fetchReviews();
      }
  }, [appState, selectedArtisan]);

  const findClosestLocation = (input: string): string | null => {
    const normalized = input.toLowerCase().trim();
    const locationAliases: Record<string, string> = {
      'tsakani': 'Tsakane', 'kwatema': 'KwaThema', 'kwa thema': 'KwaThema', 'spring': 'Springs', 'brackpan': 'Brakpan', 'benoni': 'Benoni', 'negel': 'Nigel'
    };
    if (locationAliases[normalized]) return locationAliases[normalized];
    for (const location of EXTENDED_LOCATIONS) {
      if (location.toLowerCase().includes(normalized) || normalized.includes(location.toLowerCase())) {
        return location;
      }
    }
    return null;
  };

  const normalizeCategory = (voiceInput: string): string => voiceInput;

  const handleUseLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLocationInput("Current Location (Tsakane)");
        setShowLocationSuggestions(false);
      }, (error) => showToast("Could not fetch location. Ensure GPS is enabled.", "error"));
    } else {
      showToast("Geolocation is not supported by this browser.", "error");
    }
  };

  const handleCardSelect = (id: string, label: string) => {
    // 1. Set the chosen category
    setCategoryInput(label);
    
    // 2. Open the Cinematic Overlay
    setIsSearchActive(true);
    
    // 3. Skip the category step and go straight to Location!
    setSearchStep('location');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const remainingSlots = 4 - selectedImages.length;
      if (filesArray.length > remainingSlots) { showToast(`You can only upload a maximum of 4 images.`, "error"); return; }
      const newFiles = filesArray.slice(0, remainingSlots);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setSelectedImages(prev => [...prev, ...newFiles]);
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setSelectedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const uploadFilesToSupabase = async (files: File[]) => {
    const uploadedUrls: string[] = [];
    for (const file of files) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${fileName}`;
        const { data, error } = await supabase.storage.from('artisan-portfolios').upload(filePath, file);
        if (data) {
            const { data: publicUrlData } = supabase.storage.from('artisan-portfolios').getPublicUrl(filePath);
            uploadedUrls.push(publicUrlData.publicUrl);
        }
    }
    return uploadedUrls;
  };

  useEffect(() => {
    async function fetchArtisans() {
      try {
        setLoading(true);
        const { data, error } = await supabase.from('artisans').select('id, first_name, last_name, category, location, phone, email, bio, verified, rating, image_url, portfolio_images, proof_of_work, website_url');
        if (data) {
          const formattedData: Artisan[] = data.map((item: any) => ({
            id: item.id,
            name: `${item.first_name} ${item.last_name || ''}`,
            website: item.website_url || null,
            category: item.category || 'General',
            location: item.location || 'Far East Rand',
            phone: item.phone,
            email: item.email || '',
            verified: item.verified === true,
            isVerified: item.verified === true,
            rating: item.rating || 4.8,
            bio: item.bio || "Professional artisan verified by Skills Connect.",
            image_url: item.image_url,
            // This checks proof_of_work, then portfolio_images, then portfolio, then images.
            portfolio_images: 
  (item.proof_of_work?.length > 0) ? item.proof_of_work : 
  (item.portfolio_images?.length > 0) ? item.portfolio_images : 
  (item.portfolio?.length > 0) ? item.portfolio : 
  (item.images?.length > 0) ? item.images : [],
            services: ["Consultation", "Installation", "Maintenance"],
            reviews: []
          }));
          setArtisans(formattedData);
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchArtisans();
  }, []);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        setLoadingAds(true);
        const { data } = await supabase.from('advertisements').select('*').eq('is_active', true);
        if (data) {
          const formattedAds: FeaturedAd[] = data.map((ad: any) => ({
            id: ad.id,
            brand_name: ad.brand_name || ad.title,
            title: ad.title,
            subtitle: ad.subtitle || ad.description,
            category: ad.category,
            image_url: ad.image_url,
            link_url: ad.link_url
          }));
          setFeaturedAds(formattedAds);
        }
      } catch (err) { console.error(err); } finally { setLoadingAds(false); }
    };
    fetchAds();
  }, []);

  const filteredLocations = useMemo(() => {
    if (!locationInput) return [];
    return EXTENDED_LOCATIONS.filter(loc => loc.toLowerCase().includes(locationInput.toLowerCase())).slice(0, 5);
  }, [locationInput]);

  const filteredSkills = useMemo(() => {
    if (!categoryInput) return [];
    return CATEGORIES.filter(cat => cat.toLowerCase().includes(categoryInput.toLowerCase())).slice(0, 5);
  }, [categoryInput]);

  const searchResults = useMemo(() => {
    let normalizedLocationInput = executedSearch.location.toLowerCase().trim();
    const locationAliases: Record<string, string[]> = {
      'tsakane': ['tsakane', 'tsakani'],
      'kwathema': ['kwathema', 'kwate', 'kwa thema'],
      'nigel': ['nigel', 'maniger'],
      'springs': ['springs', 'cbd'],
      'brakpan': ['brakpan', 'brak pan'],
      'daveyton': ['daveyton'],
      'benoni': ['benoni']
    };

    let locationSearchTerms: string[] = [normalizedLocationInput];
    if (locationAliases[normalizedLocationInput]) locationSearchTerms = locationAliases[normalizedLocationInput];
    else {
        for (const [, variations] of Object.entries(locationAliases)) {
            if (variations.includes(normalizedLocationInput)) { locationSearchTerms = variations; break; }
        }
    }

    const rawFiltered = artisans.filter(artisan => {
      let matchCategory = false;
      if (executedSearch.category === '') matchCategory = true;
      else {
        const searchTerm = executedSearch.category.toLowerCase();
        const dbCategory = artisan.category ? artisan.category.toLowerCase() : '';
        const searchRoot = searchTerm.length > 3 && searchTerm.endsWith('s') ? searchTerm.slice(0, -1) : searchTerm;
        const dbRoot = dbCategory.length > 3 && dbCategory.endsWith('s') ? dbCategory.slice(0, -1) : dbCategory;
        matchCategory = dbCategory.includes(searchRoot) || searchTerm.includes(dbRoot);
      }

      let locationMatch = false;
      if (normalizedLocationInput === '') locationMatch = true;
      else {
          const dbLocations = artisan.location ? artisan.location.toLowerCase().split(',').map(l => l.trim()) : [];
          locationMatch = dbLocations.some(dbLoc => locationSearchTerms.some(term => dbLoc.includes(term)));
      }
      return matchCategory && locationMatch;
    });
    return [...rawFiltered].sort(() => Math.random() - 0.5).slice(0, 5);
  }, [executedSearch, artisans]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => { if (entry.isIntersecting) (entry.target as Element).classList.add('active'); });
    }, { threshold: 0.1 });
    const revealElements = document.querySelectorAll('.reveal');
    revealElements.forEach((el) => observer.observe(el));
    return () => { revealElements.forEach((el) => observer.unobserve(el)); };
  }, [appState, loadingAds]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) setShowLocationSuggestions(false);
      if (skillSuggestionRef.current && !skillSuggestionRef.current.contains(event.target as Node)) setShowSkillSuggestions(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
useEffect(() => {
    if (appState !== AppState.HOME) return;
    
    const interval = setInterval(() => {
      setRovingIndex(Math.floor(Math.random() * QUICK_CATEGORIES.length));
    }, 3000); // Shifts the glow every 3 seconds

    return () => clearInterval(interval);
  }, [appState]);
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryInput) { showToast('Please select a skill category first!', "error"); return; }
    setExecutedSearch({ category: categoryInput, location: locationInput });

    if (locationInput) {
      const correctedLocation = findClosestLocation(locationInput);
      if (correctedLocation && correctedLocation !== locationInput && correctedLocation.toLowerCase() !== locationInput.toLowerCase()) {
        if (confirm(`Did you mean "${correctedLocation}"?`)) {
           setExecutedSearch(prev => ({...prev, location: correctedLocation}));
           setLocationInput(correctedLocation);
        }
      }
    }
    setShowLocationSuggestions(false);
    setShowSkillSuggestions(false);
    setAppState(AppState.SEARCH_RESULTS);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setCategoryInput('');
    setLocationInput('');
  };

  const goHome = () => {
    setCategoryInput(''); setLocationInput(''); setIsSubmitted(false); setIsMobileMenuOpen(false);
    setAppState(AppState.HOME); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
const handleFindService = () => {
    goHome(); // Ensure we are on the main screen
    setIsMobileMenuOpen(false); // Close the menu if on mobile
    
    // Smoothly open the new Cinematic Overlay!
    setTimeout(() => {
      setIsSearchActive(true);
      setSearchStep('category');
    }, 150);
  };
  const goToRegistration = () => {
    setIsSubmitted(false); setRegForm({ firstName: '', lastName: '', trade: '', area: '', phone: '', bio: '', referralSource: '', institution: '' });
    setSelectedImages([]); setImagePreviews([]); setCaptchaVerified(false); setIsMobileMenuOpen(false);
    setAppState(AppState.REGISTRATION); window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const goToQuickJoin = () => {
    setIsMobileMenuOpen(false);
    setAppState(AppState.QUICK_JOIN); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot !== '') { setIsSubmitted(true); return; }
    if (!captchaVerified) { showToast("Please complete the security check.", "error"); return; }
    setIsSubmitting(true);
    
    try {
        const uploadedImageUrls = await uploadFilesToSupabase(selectedImages);
        
        const { error } = await supabase.from('artisan_applications').insert([
            { 
                first_name: regForm.firstName,   
                last_name: regForm.lastName,      
                trade: regForm.trade, 
                location: regForm.area, 
                phone: regForm.phone,
                bio: regForm.bio,
                referral_source: regForm.referralSource,
                institution: regForm.institution,
                images: uploadedImageUrls
            }
        ]);

        if (error) throw error;
        showToast("Application submitted successfully!", "success");
        setTimeout(() => { setIsSubmitting(false); setIsSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }, 2000);
    } catch (err) { console.error("Error submitting:", err); showToast("System Error: Could not save application.", "error"); }
    setIsSubmitting(false);
};

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${isDarkMode ? 'bg-[#150f0a] text-white' : 'bg-stone-50 text-gray-900'}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        /* 3D PERSPECTIVE SYSTEM */
        .perspective-container {
            perspective: 2000px;
        }
        @keyframes central-glow {
            0%, 100% {
                box-shadow: 
                    0 0 15px rgba(250, 204, 21, 0.4),
                    0 0 40px rgba(250, 204, 21, 0.15);
            }
            50% {
                /* The 3-layer stack for maximum depth and richness */
                box-shadow: 
                    0 0 25px rgba(250, 204, 21, 0.7),
                    0 0 60px rgba(250, 204, 21, 0.4),
                    0 0 100px rgba(250, 204, 21, 0.2);
            }
        }
        .card-3d {
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease;
            transform-style: preserve-3d;
            transform: rotateX(0) rotateY(0);
        }

        .card-3d:hover {
            transform: rotateX(5deg) rotateY(0deg) translateY(-10px);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }

        .text-flat {
            transform: translateZ(30px);
            transform-style: preserve-3d;
        }

      /* 🌍 PREMIUM AFRICAN PATTERNS */
        .bg-mudcloth {
            background-color: transparent;
            /* Swapped to Brand Yellow with higher base opacity so it pops! */
            background-image: 
                linear-gradient(135deg, rgba(250, 204, 21, 0.25) 25%, transparent 25%), 
                linear-gradient(225deg, rgba(250, 204, 21, 0.25) 25%, transparent 25%), 
                linear-gradient(45deg, rgba(250, 204, 21, 0.25) 25%, transparent 25%), 
                linear-gradient(315deg, rgba(250, 204, 21, 0.25) 25%, transparent 25%);
            background-position:  16px 0, 16px 0, 0 0, 0 0;
            background-size: 32px 32px;
        }

        .bg-basket-weave {
            background-color: transparent;
            /* Zulu/Ndebele inspired woven line texture */
            background-image: 
                repeating-linear-gradient(45deg, rgba(250, 204, 21, 0.1) 0, rgba(250, 204, 21, 0.1) 2px, transparent 2px, transparent 10px),
                repeating-linear-gradient(-45deg, rgba(250, 204, 21, 0.1) 0, rgba(250, 204, 21, 0.1) 2px, transparent 2px, transparent 10px);
            background-size: 24px 24px;
        }

        .bg-basket-weave {
            background-image: linear-gradient(45deg, #1f1209 25%, transparent 25%, transparent 75%, #1f1209 75%, #1f1209), 
            linear-gradient(45deg, #1f1209 25%, transparent 25%, transparent 75%, #1f1209 75%, #1f1209);
            background-size: 20px 20px;
            background-position: 0 0, 10px 10px;
        }

        .icon-token {
            box-shadow: 
                inset 0 0 10px rgba(0,0,0,0.8),
                0 4px 6px rgba(0,0,0,0.3),
                0 0 0 2px #d97706; /* Gold rim */
            background: linear-gradient(135deg, #4a2c18, #2e1a0a);
        }

        @keyframes deep-breathing { 0%, 100% { opacity: 0.35; filter: brightness(0.6) saturate(1.1); scale: 1; } 50% { opacity: 0.8; filter: brightness(1.4) saturate(1.3); scale: 1.05; } }
        @keyframes shimmer { 100% { transform: translateX(100%); } }
        .animate-deep-breathing { animation: deep-breathing 8s ease-in-out infinite; }
        .reveal { opacity: 0; transform: translateY(30px); transition: all 0.8s ease-out; }
        .reveal.active { opacity: 1; transform: translateY(0); }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(250, 204, 21, 0.3); border-radius: 4px; }
      `}</style>
{/* 🚀 FULL-SCREEN CINEMATIC SEARCH OVERLAY (UNLEASHED) */}
      {isSearchActive && (
        <div className="fixed inset-0 z-[999999] flex flex-col justify-center px-4 md:px-8 bg-black/95 backdrop-blur-2xl animate-fade-in" style={{ position: 'fixed' }}>
          
          <button 
            onClick={() => { 
              setIsSearchActive(false); 
              setSearchStep('category'); 
              setShowSkillSuggestions(false); 
              setShowLocationSuggestions(false); 
            }} 
            className="absolute top-6 right-6 md:top-10 md:right-10 text-gray-500 hover:text-brand-yellow transition-colors p-3 bg-white/5 rounded-full hover:bg-white/10 z-50"
          >
            <X size={28} strokeWidth={2.5} />
          </button>

          <div className="max-w-4xl mx-auto w-full -mt-32">
            <h2 className="text-4xl md:text-6xl font-black text-white mb-16 text-center tracking-tight animate-fade-in-up">
              {searchStep === 'category' ? "What do you need?" : "Where are you?"}
            </h2>

            <div className="relative animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <div className="absolute -inset-1.5 bg-gradient-to-r from-brand-yellow to-yellow-600 rounded-[3rem] blur-xl opacity-40 animate-pulse"></div>

              <div className="relative flex items-center bg-zinc-900 border-2 border-brand-yellow/50 rounded-[3rem] p-2 shadow-2xl">
                <div className="hidden md:flex pl-6 pr-2">
                   <SearchIcon className="text-brand-yellow w-8 h-8" />
                </div>

                {searchStep === 'category' ? (
                  <div className="w-full relative flex-1">
                    <input 
                      autoFocus 
                      type="text"
                      value={categoryInput}
                      onFocus={() => setShowSkillSuggestions(true)}
                      onChange={(e) => {
                         setCategoryInput(e.target.value);
                         setShowSkillSuggestions(true);
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && setSearchStep('location')}
                      placeholder="e.g. Plumber, Electrician..."
                      className="w-full bg-transparent p-4 md:p-6 text-2xl md:text-4xl text-white font-bold outline-none placeholder:text-zinc-600"
                    />
                    
                    {/* ⚡ SKILL AUTOFILL WITH ANTI-FREEZE */}
                    {showSkillSuggestions && (
                      <div className="absolute top-[115%] left-0 right-0 z-50">
                        {filteredSkills && filteredSkills.length > 0 ? (
                          <div className="bg-zinc-900 border border-brand-yellow/30 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-in-up">
                            {filteredSkills.slice(0, 5).map((skill: string) => (
                              <div 
                                key={skill}
                                onClick={() => {
                                  setCategoryInput(skill);
                                  setShowSkillSuggestions(false);
                                  setSearchStep('location');
                                }}
                                className="px-8 py-5 text-xl md:text-2xl text-white hover:bg-brand-yellow hover:text-black cursor-pointer font-bold transition-colors border-b border-white/5 last:border-0 flex items-center gap-4 group"
                              >
                                <SearchIcon className="w-6 h-6 opacity-40 group-hover:opacity-100" />
                                {skill}
                              </div>
                            ))}
                          </div>
                        ) : categoryInput.length > 0 ? (
                          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-in-up">
                            <p className="text-gray-400 text-sm md:text-base font-bold uppercase tracking-widest">Custom search: Press <span className="text-white">Enter</span> or <span className="text-brand-yellow">Next</span></p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full relative flex-1">
                    <input 
                      autoFocus 
                      type="text"
                      value={locationInput}
                      onFocus={() => setShowLocationSuggestions(true)}
                      onChange={(e) => {
                         setLocationInput(e.target.value);
                         setShowLocationSuggestions(true);
                      }}
                      onKeyDown={(e) => {
                         if (e.key === 'Enter') {
                            setIsSearchActive(false);
                            setExecutedSearch({ category: categoryInput, location: locationInput });
                            setAppState(AppState.SEARCH_RESULTS);
                            setSearchStep('category');
                         }
                      }}
                      placeholder="e.g. Tsakane, Springs..."
                      className="w-full bg-transparent p-4 md:p-6 text-2xl md:text-4xl text-white font-bold outline-none placeholder:text-zinc-600"
                    />

                    {/* ⚡ LOCATION AUTOFILL WITH ANTI-FREEZE */}
                    {showLocationSuggestions && (
                      <div className="absolute top-[115%] left-0 right-0 z-50">
                        {filteredLocations && filteredLocations.length > 0 ? (
                          <div className="bg-zinc-900 border border-brand-yellow/30 rounded-[2rem] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-in-up">
                            {filteredLocations.slice(0, 5).map((loc: string) => (
                              <div 
                                key={loc}
                                onClick={() => {
                                  setLocationInput(loc);
                                  setShowLocationSuggestions(false);
                                  setIsSearchActive(false);
                                  setExecutedSearch({ category: categoryInput, location: loc });
                                  setAppState(AppState.SEARCH_RESULTS);
                                  setSearchStep('category');
                                }}
                                className="px-8 py-5 text-xl md:text-2xl text-white hover:bg-brand-yellow hover:text-black cursor-pointer font-bold transition-colors border-b border-white/5 last:border-0 flex items-center gap-4 group"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 opacity-40 group-hover:opacity-100"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                                {loc}
                              </div>
                            ))}
                          </div>
                        ) : locationInput.length > 0 ? (
                          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-in-up">
                            <p className="text-gray-400 text-sm md:text-base font-bold uppercase tracking-widest">Custom search: Press <span className="text-white">Enter</span> or <span className="text-brand-yellow">Search</span></p>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                )}
                
                {/* The Action Button */}
                <button 
                  onClick={() => {
                    if (searchStep === 'category') {
                      setSearchStep('location');
                    } else {
                      setIsSearchActive(false);
                      setExecutedSearch({ category: categoryInput, location: locationInput });
                      setAppState(AppState.SEARCH_RESULTS);
                      setSearchStep('category'); 
                    }
                  }}
                  className="bg-brand-yellow text-black px-8 md:px-12 py-4 md:py-6 rounded-[2.5rem] font-black uppercase tracking-widest text-sm md:text-xl hover:bg-white hover:scale-[1.02] transition-all shadow-xl shrink-0 mr-1 md:mr-2"
                >
                  {searchStep === 'category' ? "Next →" : "Search"}
                </button>
              </div>
            </div>
            
            {/* Helpful Hint */}
            <p className="text-center text-zinc-500 font-bold uppercase tracking-widest text-xs mt-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              Press Enter to continue
            </p>
          </div>
        </div>
      )}
      {/* OVERLAYS */}
      {activeModal === 'privacy' && <InfoModal title="Privacy Policy" content={PRIVACY_POLICY} onClose={() => setActiveModal(null)} />}
      {activeModal === 'verification' && <InfoModal title="Verification Process" content={VERIFICATION_PROCESS} onClose={() => setActiveModal(null)} />}
      {activeModal === 'terms' && <InfoModal title="Terms & Data Usage" content={TERMS_OF_SERVICE} onClose={() => setActiveModal(null)} />}
      {showSuggestionForm && <SuggestionModal onClose={() => setShowSuggestionForm(false)} isDarkMode={isDarkMode} showToast={showToast} />}
      
      {showReviewModal && selectedArtisan && (
        <ReviewModal 
            artisanId={selectedArtisan.id as any}
            artisanName={selectedArtisan.name} 
            onClose={() => setShowReviewModal(false)} 
            isDarkMode={isDarkMode} 
            showToast={showToast} 
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {enlargedImage && (
        <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in cursor-pointer" onClick={() => setEnlargedImage(null)}>
          <div className="relative max-w-5xl w-full h-full flex items-center justify-center">
             <img src={enlargedImage} alt="Enlarged View" className="max-h-[90vh] max-w-full object-contain rounded-lg shadow-2xl border border-white/10" onClick={(e) => e.stopPropagation()} />
             <button onClick={() => setEnlargedImage(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-brand-yellow hover:text-black text-white p-2 rounded-full transition-colors border border-white/20">X</button>
          </div>
        </div>
      )}

     {/* --- APP-LIKE WELCOME SPLASH SCREEN --- */}
    {/* --- APP-LIKE WELCOME SPLASH SCREEN --- */}
      {appState === AppState.WELCOME && (
        <WelcomeSplash 
          isDarkMode={isDarkMode} 
          onEnter={() => {
            setAppState(AppState.HOME);
            // No more scrolling! We let the Shapeshifter take over natively.
          }} 
        />
      )}

{/* NAVBAR (Hidden on Welcome Screen) */}
      {appState !== AppState.WELCOME && (
      <nav className={`border-b sticky top-0 z-50 py-4 transition-colors duration-300 backdrop-blur-md ${isDarkMode ? 'bg-[#150f0a]/80 border-white/5' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex justify-between items-center relative">
          
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={goHome}>
            <img src="/logo-new.svg" alt="SkillsConnectPro" className="w-48 md:w-64 h-auto transition-transform group-hover:scale-105 origin-left" />
          </div>
          
          {/* Right Side Actions */}
          <div className="flex items-center gap-3 md:gap-6">
            {/* Desktop Links */}
            <div className="hidden md:flex items-center space-x-8 text-xs font-black uppercase tracking-widest text-gray-400">
                <button onClick={handleFindService} className="hover:text-brand-yellow transition-colors">Find Artisans</button>
                <button onClick={goToRegistration} className="hover:text-brand-yellow transition-colors">Standard Form</button>
                <button onClick={handleSupport} className="hover:text-brand-yellow transition-colors">Support</button>
            </div>
            
            {/* ⚡ 1-Click Join Button (Responsive) */}
            <button 
              onClick={goToQuickJoin} 
              className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 px-3 py-1.5 md:px-5 md:py-2.5 text-[10px] md:text-sm rounded-full hover:bg-emerald-500 hover:text-black transition-all shadow-[0_0_20px_rgba(16,185,129,0.15)] font-black uppercase tracking-wider whitespace-nowrap"
            >
              ⚡ 1-Click Join
            </button>
            
            {/* Single Mobile Hamburger */}
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-400 hover:text-brand-yellow transition-colors">
              {isMobileMenuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className={`md:hidden absolute top-full left-0 right-0 border-b shadow-2xl animate-fade-in z-40 ${isDarkMode ? 'bg-[#150f0a] border-white/10' : 'bg-white border-gray-200'}`}>
            <div className="flex flex-col p-6 space-y-6 text-center text-sm font-black uppercase tracking-widest">
              <button onClick={handleFindService} className={`py-3 ${isDarkMode ? 'text-white hover:text-brand-yellow' : 'text-gray-900 hover:text-brand-yellow'}`}>Find Artisans</button>
              <button onClick={() => { goToRegistration(); setIsMobileMenuOpen(false); }} className={`py-3 ${isDarkMode ? 'text-white hover:text-brand-yellow' : 'text-gray-900 hover:text-brand-yellow'}`}>Standard Form</button>
              <button onClick={() => { handleSupport(); setIsMobileMenuOpen(false); }} className={`py-3 ${isDarkMode ? 'text-white hover:text-brand-yellow' : 'text-gray-900 hover:text-brand-yellow'}`}>Support</button>
            </div>
          </div>
        )}
      </nav>
      )}

      <main className="flex-1">
        {selectedBusinessId ? (
          <BusinessDetail id={selectedBusinessId} onBack={() => setSelectedBusinessId(null)} />
        ) : (
          <>
          {appState === AppState.HOME && (
            <div className="animate-fade-in perspective-container">
              <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden py-32">
        {/* MUTED, CINEMATIC DARK BROWN BACKGROUND */}
              <div className="absolute inset-0 z-0 bg-[#0c0906]">
                
                {/* 1. Base Image (At the very bottom) */}
                <img src="/artisans/hero-welder.jpg" className="absolute inset-0 w-full h-full object-cover animate-deep-breathing opacity-20 mix-blend-luminosity z-0" />
                
                {/* 2. Dark Gradient (Softens the image) */}
                <div className="absolute inset-0 bg-gradient-to-b from-[#150f0a]/95 via-[#150f0a]/70 to-[#150f0a] z-10"></div>
                
                </div>
                
{/* 🎬 DYNAMIC APP SPLASH: THE SHAPESHIFTER */}
<div className="relative z-20 w-full max-w-6xl mx-auto px-4 md:px-6 flex flex-col items-center justify-center min-h-[85vh] py-10">
  <div className={`w-full backdrop-blur-xl rounded-[3rem] p-6 py-10 md:p-16 shadow-[0_30px_60px_rgba(0,0,0,0.6)] border border-white/10 ${isDarkMode ? 'bg-black/40' : 'bg-white/40'} flex flex-col items-center justify-center transition-all duration-1000 ease-[cubic-bezier(0.25,1,0.5,1)] relative overflow-hidden`}>
              
             
    {/* --- THE TEXT BLOCK --- */}
    <div
      style={{
        transform: isInteractive ? 'translateY(-24px) scale(0.93)' : 'translateY(0px) scale(1)',
        transition: 'transform 1000ms cubic-bezier(0.25, 1, 0.5, 1)',
      }}
      className="w-full flex flex-col justify-center items-center text-center origin-top"
    >
      {/* 1. Top Pill */}
      <div className="mb-4 md:mb-6">
        <div className="bg-brand-yellow/10 border border-brand-yellow/30 text-brand-yellow px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] inline-block shadow-[0_0_15px_rgba(250,204,21,0.2)]">
          Far East Rand Specialist Network
        </div>
      </div>

      {/* 2. Main Header */}
      <h1 className={`text-[2.75rem] leading-[1.1] md:text-6xl lg:text-7xl font-black tracking-tighter transition-colors duration-700 ${isDarkMode ? 'text-white' : 'text-gray-900'} ${isInteractive ? 'opacity-90' : ''}`}>
        Find Verified <span className="text-brand-yellow"><HeroTyper /></span>{' '}
        <br className="hidden md:block" />
        in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-500 drop-shadow-sm">East Rand.</span>
      </h1>

      {/* 3. Subtitle — collapses when interactive */}
      <div
        style={{
          maxHeight: isInteractive ? '0px' : '200px',
          opacity: isInteractive ? 0 : 1,
          marginTop: isInteractive ? '0px' : '1.5rem',
          overflow: 'hidden',
          transition: [
            'max-height 900ms cubic-bezier(0.25, 1, 0.5, 1)',
            'opacity 600ms cubic-bezier(0.25, 1, 0.5, 1)',
            'margin-top 900ms cubic-bezier(0.25, 1, 0.5, 1)',
          ].join(', '),
        }}
        className="w-full"
      >
        <p className={`text-lg md:text-xl lg:text-2xl font-medium max-w-3xl mx-auto drop-shadow-md ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          Discover top-tier professionals in{' '}
          <span className="text-brand-yellow font-bold">Tsakane, KwaThema, Springs</span> and more.
        </p>
      </div>
    </div>

    {/* --- THE SEARCH PILL (Arcade Design + Autoscroll Ref) --- */}
              <div
                ref={pillRef}
                style={{
                  opacity: isInteractive ? 1 : 0,
                  transform: isInteractive ? 'translateY(0px)' : 'translateY(48px)',
                  maxHeight: isInteractive ? '200px' : '0px',
                  marginTop: isInteractive ? '2rem' : '0px',
                  pointerEvents: isInteractive ? 'auto' : 'none',
                  overflow: 'hidden',
                  transition: [
                    'opacity 800ms cubic-bezier(0.25, 1, 0.5, 1) 150ms',
                    'transform 1000ms cubic-bezier(0.25, 1, 0.5, 1) 150ms',
                    'max-height 1000ms cubic-bezier(0.25, 1, 0.5, 1)',
                    'margin-top 1000ms cubic-bezier(0.25, 1, 0.5, 1)',
                  ].join(', '),
                }}
                className="max-w-4xl mx-auto w-full relative z-20"
              >
                <button 
                  onClick={() => {
                    setIsSearchActive(true);
                    setCategoryInput(''); 
                    setLocationInput(''); 
                    setSearchStep('category');
                    setShowSkillSuggestions(false);
                    setShowLocationSuggestions(false);
                  }}
                  /* Arcade style kept, tactile click kept, but NO rectangular neon glow! */
                  className={`w-full bg-[#111]/90 backdrop-blur-2xl border-[3px] p-2 md:p-3 rounded-[3rem] flex items-center justify-between group transition-all duration-500 hover:scale-[1.02] active:scale-95 overflow-hidden ${!isInteractive ? 'border-transparent shadow-none' : 'border-brand-yellow/60 hover:border-brand-yellow shadow-[0_20px_50px_rgba(0,0,0,0.5)]'}`}
                >
                  
                  {/* ✨ The Laser Shimmer Sweep Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:animate-[shimmer_1.5s_infinite] skew-x-12 pointer-events-none"></div>

                  {/* Left Side: Bold Label (Added whitespace-nowrap and mobile resizing) */}
                  <div className="flex items-center gap-2 md:gap-6 pl-2 md:pl-6 relative z-10 shrink-0">
                    <div className="text-brand-yellow drop-shadow-[0_0_10px_rgba(250,204,21,0.5)] group-hover:rotate-12 transition-transform duration-500 hidden sm:block">
                      <SearchIcon className="w-5 h-5 md:w-10 md:h-10" />
                    </div>
                    <span className="text-sm sm:text-lg md:text-3xl font-black tracking-[0.1em] uppercase text-white drop-shadow-lg group-hover:text-brand-yellow transition-colors duration-300 whitespace-nowrap">
                      Find a Pro
                    </span>
                  </div>

                  {/* Right Side: The Inner "Arcade" Trigger Button (Scaled padding for mobile) */}
                  <div className="bg-gradient-to-br from-brand-yellow to-yellow-600 text-black px-4 py-3 md:px-10 md:py-5 rounded-[2.5rem] font-black uppercase tracking-widest text-xs md:text-xl flex items-center gap-2 md:gap-3 shadow-[0_0_20px_rgba(250,204,21,0.3)] group-hover:shadow-[0_0_30px_rgba(250,204,21,0.6)] transition-all relative z-10 shrink-0 whitespace-nowrap">
                    <span>Search</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={4} stroke="currentColor" className="w-4 h-4 md:w-6 md:h-6 group-hover:translate-x-1 md:group-hover:translate-x-2 transition-transform duration-300">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </div>

                </button>
              </div>

  </div>
</div>  
           </section> 

      {/* --- DIRECTORY SECTION --- */}
      <section className="w-full mt-12 max-w-7xl mx-auto px-4 md:px-8">
        <div className="flex items-end justify-between mb-8 px-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-yellow mb-2">Directory</p>
            <h3 className={`text-2xl md:text-3xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Popular Trades</h3>
          </div>
          <div className="hidden md:block h-px flex-1 bg-white/10 ml-8 mb-2"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16 perspective-container" onMouseEnter={() => setRovingIndex(null)}>
          {QUICK_CATEGORIES.map((cat, index) => {
            const isRoving = rovingIndex === index;
            return (
              <button 
                key={cat.id} 
                onClick={() => handleCardSelect(cat.id, cat.label)} 
                className={`group relative h-48 rounded-3xl overflow-hidden border transition-all duration-700 ease-out card-3d ${isDarkMode ? 'border-brand-yellow/20 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'border-gray-200 shadow-xl'} ${isRoving ? 'ring-2 ring-brand-yellow shadow-[0_0_30px_rgba(250,204,21,0.5)] -translate-y-2' : ''} hover:ring-2 hover:ring-brand-yellow hover:shadow-[0_0_30px_rgba(250,204,21,0.5)]`}
                style={{ transitionDelay: `${index * 20}ms` }}
              >
                <div className="absolute inset-0 w-full h-full overflow-hidden">
                  <ImageWithSkeleton src={cat.image} alt={cat.label} className={`absolute inset-0 w-full h-full object-cover transform transition-transform duration-1000 ${isRoving ? 'scale-110' : 'group-hover:scale-110'}`} />
                </div>
                <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent transition-opacity duration-500 ${isRoving ? 'opacity-80' : 'opacity-90 group-hover:opacity-80'}`} />
                <div className="absolute inset-0 p-5 flex flex-col justify-end items-start text-flat">
                  <div className={`h-1 bg-brand-yellow mb-3 transform origin-left transition-all duration-500 shadow-[0_0_10px_#facc15] ${isRoving ? 'w-12' : 'w-8 group-hover:w-12'}`}></div>
                  <span className={`font-black text-[10px] sm:text-sm md:text-lg uppercase tracking-normal sm:tracking-widest transition-colors relative z-10 drop-shadow-lg w-full text-center leading-none sm:leading-tight break-words px-1 ${isRoving ? 'text-brand-yellow' : 'text-white'}`}>
                    {cat.label}
                  </span>
                  <span className={`text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-1 transform transition-all duration-500 ${isRoving ? 'opacity-100 translate-y-0 text-white' : 'opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0'}`}>
                    View Pros →
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="reveal perspective-container">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`h-px w-12 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <p className={`text-[10px] font-black uppercase tracking-[0.3em] ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Additional Services</p>
            <div className={`h-px w-12 ${isDarkMode ? 'bg-white/10' : 'bg-gray-200'}`}></div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-4 max-w-5xl mx-auto px-2">
            {MORE_SERVICES.map((service, idx) => (
              <button key={service.id} onClick={() => handleCardSelect(service.id, service.label)} className="group relative h-48 md:h-56 rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-brand-yellow/50 transition-all duration-500 shadow-lg hover:shadow-[0_0_40px_rgba(250,204,21,0.15)] w-full block text-center">
                <img src={service.image} alt={service.label} className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0906] via-[#0c0906]/60 to-transparent transition-opacity duration-300"></div>
                <div className="absolute inset-0 p-6 flex flex-col justify-end items-center pb-8">
                  <div className="w-14 h-14 mb-4 rounded-full bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center text-brand-yellow group-hover:bg-brand-yellow group-hover:text-black group-hover:scale-110 transition-all duration-300 shadow-2xl *:w-6 *:h-6">
                    {service.icon} 
                  </div>
                  <span className="text-white font-black uppercase tracking-widest text-[10px] md:text-xs leading-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] group-hover:text-brand-yellow transition-colors block w-full px-1 text-center break-words">
                    {service.label}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* --- PARTNER SHOWCASE SECTION --- */}
      <section className={`py-24 relative mt-16 ${isDarkMode ? 'bg-[#150f0a]' : 'bg-gray-100'}`}>
        <div className="absolute top-0 left-0 right-0 h-4 bg-basket-weave opacity-30"></div>
        <div className="max-w-7xl mx-auto px-6 perspective-container">
          <div className="flex flex-col items-center mb-16 reveal">
            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-yellow mb-4">Partner Showcase</h3>
            <h2 className={`text-4xl md:text-5xl font-black tracking-tighter text-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Elite Featured Traders</h2>
            <div className="h-1 w-20 bg-brand-yellow mt-6"></div>
          </div>

          {loadingAds ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={`h-[450px] rounded-[2.5rem] animate-pulse-fast p-8 flex flex-col justify-end ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border-gray-200'}`}>
                  <div className="w-full h-full bg-gray-400/10 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : featuredAds && featuredAds.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 reveal">
              {featuredAds.map((ad, index) => (
                <div key={ad.id} style={{ transitionDelay: `${index * 100}ms` }} onClick={() => { setSelectedBusinessId(ad.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`group relative h-[450px] rounded-[2.5rem] overflow-hidden border cursor-pointer card-3d ${isDarkMode ? 'border-brand-yellow/20' : 'border-gray-200'}`}>
                  <ImageWithSkeleton src={ad.image_url} alt={ad.brand_name} className="absolute inset-0 w-full h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity duration-500"></div>
                  <div className="absolute inset-0 p-8 flex flex-col justify-end z-30 text-flat">
                    <div className="bg-brand-yellow/90 backdrop-blur-sm text-brand-black w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest mb-4">Elite Member • {ad.category}</div>
                    <h4 className="text-xs font-black uppercase text-brand-yellow tracking-[0.2em] mb-1">{ad.brand_name}</h4>
                    <h3 className="text-2xl font-black mb-2 leading-tight text-white group-hover:text-brand-yellow transition-colors">{ad.title}</h3>
                    <p className="text-gray-300 text-sm font-medium mb-6 line-clamp-2">{ad.subtitle}</p>
                    <div className="w-full h-12 bg-white/10 border border-white/10 backdrop-blur-md rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest group-hover:bg-brand-yellow group-hover:text-black transition-all text-white">Contact Business</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12"><p>No featured partners available.</p></div>
          )}
        </div>
      </section>
            </div>
          )}

          {appState === AppState.SEARCH_RESULTS && (
            <section className="min-h-screen pt-32 pb-20 px-4 md:px-8 max-w-7xl mx-auto perspective-container">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6 animate-fade-in">
                <div className="flex flex-col gap-4">
                  <button onClick={() => setAppState(AppState.HOME)} className="group flex items-center gap-2 text-gray-400 hover:text-brand-yellow transition-colors self-start">
                    <div className={`p-2 rounded-full border transition-colors ${isDarkMode ? 'border-white/10 group-hover:border-brand-yellow/50' : 'border-gray-300'}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" /></svg>
                    </div>
                    <span className="text-sm font-bold uppercase tracking-widest">Back to Search</span>
                  </button>
                  <div>
                    <h2 className={`text-4xl font-black uppercase tracking-tighter mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Found <span className="text-brand-yellow">{searchResults.length}</span> Pros</h2>
                    <p className="text-gray-400 text-sm">Top-rated artisans ready to help in {executedSearch.location || "East Rand"}</p>
                  </div>
                </div>
                <div className={`flex p-1.5 rounded-xl border self-end md:self-center ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
                  <button onClick={() => setViewMode('list')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'list' ? 'bg-brand-yellow text-black shadow-lg' : 'text-gray-400 hover:text-gray-500'}`}>List</button>
                  <button onClick={() => setViewMode('map')} className={`px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${viewMode === 'map' ? 'bg-brand-yellow text-black shadow-lg' : 'text-gray-400 hover:text-gray-500'}`}>Map</button>
                </div>
              </div>
              {viewMode === 'map' ? ( <div className="mb-12 animate-fade-in"><MapView artisans={searchResults} /></div> ) : (
                <>
                {searchResults.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-slide-up">
                    {searchResults.map((artisan) => (
                      <div key={artisan.id} onClick={() => { setSelectedArtisan(artisan); setAppState(AppState.PROFILE); window.scrollTo({ top: 0, behavior: 'auto' }); }} className={`group relative rounded-3xl overflow-hidden cursor-pointer border transition-all card-3d ${isDarkMode ? 'bg-[#111] border-white/5 hover:border-brand-yellow/30' : 'bg-white border-gray-200 hover:border-brand-yellow/50'}`}>
                        <div className="h-64 bg-gray-200 relative overflow-hidden">
                          <ImageWithSkeleton src={artisan.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={artisan.name} className="w-full h-full" />
                          <div className={`absolute inset-0 bg-gradient-to-t opacity-90 z-20 ${isDarkMode ? 'from-[#111] via-transparent to-transparent' : 'from-white via-transparent to-transparent'}`} />
                          <div className="absolute top-4 right-4 flex gap-2 z-30 text-flat">
                            {artisan.verified && <span className="bg-green-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest flex items-center gap-1 shadow-lg">Verified Pro</span>}
                            <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10">★ 4.9</span>
                          </div>
                        </div>
                        <div className="p-6 relative -mt-12 z-30 text-flat">
                          <div className="mb-2">
                            <span className="bg-gradient-to-r from-brand-yellow/20 via-brand-yellow/10 to-transparent text-brand-yellow text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-md">{artisan.category}</span>
                          </div>
                          <div className="mb-4">
                            <h3 className={`text-2xl font-black leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{artisan.name}</h3>
                            <p className="text-gray-400 text-sm flex items-center gap-1 mt-1">📍 {artisan.location}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-3 mt-6">
                            <button onClick={(e) => { e.stopPropagation(); handleContact('call', artisan.phone); }} className="py-3 rounded-xl bg-brand-yellow text-black hover:bg-black hover:text-white text-xs font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 shadow-lg shadow-brand-yellow/20">Call Now</button>
                            <button className={`py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isDarkMode ? 'bg-[#111] border-white/20 text-white hover:bg-white hover:text-black' : 'bg-white border-gray-300 text-gray-900 hover:bg-gray-100'}`}>Profile</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
      <div className={`relative text-center py-24 px-6 rounded-[3rem] border overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-[#111] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-brand-yellow/5 rounded-full blur-[100px] pointer-events-none animate-pulse"></div>

  <div className="relative z-10 flex flex-col items-center">
    <div className="relative mb-10">
      <div className="absolute inset-0 bg-brand-yellow rounded-full animate-ping opacity-20 duration-1000"></div>
      <div className="absolute inset-0 bg-brand-yellow rounded-full animate-ping opacity-10 animation-delay-500 duration-1000"></div>
      <div className={`relative w-24 h-24 rounded-full flex items-center justify-center border-2 backdrop-blur-md shadow-2xl ${isDarkMode ? 'bg-black/40 border-brand-yellow text-white' : 'bg-white border-brand-yellow text-black'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-brand-yellow animate-pulse">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
    </div>

    <h3 className={`text-3xl md:text-4xl font-black uppercase tracking-tighter mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      Professionals <span className="text-brand-yellow">Loading...</span>
    </h3>

    <div className="max-w-lg mx-auto mb-10 space-y-2">
      <p className={`text-sm md:text-base font-medium leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
        We are hard at work sourcing trusted <span className="text-brand-yellow font-bold uppercase">{executedSearch.category || 'specialists'}</span> for you.
      </p>
      <p className="text-xs md:text-sm text-gray-500 uppercase tracking-widest">
        Stay Connected • Quality takes time
      </p>
    </div>

    <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
      <button onClick={goHome} className="px-8 py-4 bg-brand-yellow text-black font-black uppercase text-xs tracking-widest rounded-xl hover:scale-105 transition-transform shadow-lg shadow-brand-yellow/20">
        Browse Other Services
      </button>
      <button onClick={() => setShowSuggestionForm(true)} className={`px-8 py-4 border font-bold uppercase text-xs tracking-widest rounded-xl hover:bg-white/5 transition-colors ${isDarkMode ? 'border-white/20 text-white' : 'border-gray-300 text-gray-700'}`}>
        Suggest a Pro
      </button>
    </div>

  </div>
</div>
                )}
                </>
              )}
            </section>
          )}
{/* 🚀 PRIVATE BETA BANNER */}
      {showBetaBanner && (
        <div className="bg-zinc-950 border-b border-yellow-500/30 px-4 py-3 flex items-start md:items-center justify-between relative z-[9999] w-full shadow-lg">
          <div className="flex items-start md:items-center gap-3">
            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-500 mt-0.5 md:mt-0">
              <Info size={14} strokeWidth={3} />
            </span>
            <p className="text-xs md:text-sm text-white font-medium leading-relaxed">
              <strong className="text-yellow-500 font-black uppercase tracking-widest mr-2">Private Beta:</strong>
              SkillsConnectPro is currently in active development. Features, profiles, and UI are actively being tested.
            </p>
          </div>
          <button 
            onClick={() => setShowBetaBanner(false)} 
            className="shrink-0 ml-4 text-gray-400 hover:text-yellow-500 p-1 transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>
      )}          {appState === AppState.PROFILE && selectedArtisan && (
            <div className={`min-h-screen pt-24 pb-12 px-6 relative animate-fade-in ${isDarkMode ? 'bg-[#150f0a] text-white' : 'bg-white text-gray-900'}`}>
              <button onClick={() => setAppState(AppState.SEARCH_RESULTS)} className="mb-8 flex items-center gap-2 text-gray-400 hover:text-brand-yellow transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" /></svg>
                <span className="uppercase tracking-widest text-xs font-bold">Back to Results</span>
              </button>
              <div className="max-w-2xl mx-auto">
                <div className="h-96 rounded-3xl overflow-hidden relative shadow-2xl shadow-brand-yellow/10 mb-8 border border-white/10">
                   <ImageWithSkeleton src={selectedArtisan.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop'} alt={selectedArtisan.name} className="w-full h-full" />
                   <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90 z-20" />
                   <div className="absolute bottom-8 left-8 z-30">
                  <h2 className="text-4xl md:text-5xl font-black uppercase italic leading-none mb-2 text-white">{selectedArtisan.name}</h2>
                  <p className="text-brand-yellow font-bold tracking-widest uppercase text-sm">{selectedArtisan.category} • {selectedArtisan.location}</p>
                  
                {selectedArtisan.verified && !['Creche', 'Creches', 
                    'Transport', 
                    'Venue', 
                    'Landscapers', 
                    'Fashion', 
                    'Hairdressers', 
                    'Catering', 
                    'Events',
                    'Funeral Services'].includes(selectedArtisan.category) && (
                  <div className="mt-3 inline-flex items-center gap-2 bg-green-600 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <VerifiedIcon /> Verified Pro
                  </div>
                )}
                </div>
                </div>
                <div className="space-y-12">
                <div className={`border p-8 rounded-3xl ${isDarkMode ? 'bg-[#1a1a1a] border-white/5' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-4">
                  {[
                    'Creche', 'Creches', 
                    'Transport', 
                    'Venue', 
                    'Landscapers', 
                    'Fashion', 
                    'Hairdressers', 
                    'Catering', 
                    'Events',
                    'Funeral Services'
                  ].includes(selectedArtisan.category) ? 'About The Business' : 'About The Pro'}
                </h3>
                  <p className={`leading-relaxed text-sm md:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {selectedArtisan.bio || "Professional service provider verified by Skills Connect."}
                  </p>
                  
                  {selectedArtisan.website && (
                    <a 
                      href={selectedArtisan.website} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="mt-6 inline-flex items-center gap-2 text-brand-yellow font-bold uppercase text-xs tracking-widest border-b border-brand-yellow pb-1 hover:text-white transition-colors"
                    >
                      Visit Official Website ↗
                    </a>
                  )}
                </div>
                    {/* REVIEWS SECTION WITH TRANSLATION COMPONENT */}
                    <div className="mb-12">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>Client Reviews</h3>
                            <button onClick={() => setShowReviewModal(true)} className="text-brand-yellow font-bold uppercase text-xs border border-brand-yellow px-4 py-2 rounded-full hover:bg-brand-yellow hover:text-black transition-all">Write a Review</button>
                        </div>

                        {artisanReviews.length === 0 ? (
                            <div className={`p-12 text-center rounded-2xl border border-dashed ${isDarkMode ? 'border-white/10 text-gray-500' : 'border-gray-300 text-gray-400'}`}>
                                <p>No reviews yet. Be the first to rate this pro!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {artisanReviews.map(review => (
                                    <ReviewCard key={review.id} review={review} isDarkMode={isDarkMode} />
                                ))}
                            </div>
                        )}
                   </div>

                   {/* 📸 PROOF OF WORK SECTION (God-Mode Parser) */}
                   {(() => {
                     // Safely grab the raw data from Supabase
                     const rawUrls = selectedArtisan?.portfolio_urls || selectedArtisan?.portfolio;
                     
                     // Handle the Supabase JSON String Trap
                     let urls: string[] = [];
                     if (Array.isArray(rawUrls)) {
                       urls = rawUrls;
                     } else if (typeof rawUrls === 'string') {
                       try {
                         urls = JSON.parse(rawUrls);
                       } catch (e) {
                         return null;
                       }
                     }

                     // If they are verified but have no photos uploaded yet
                     if (selectedArtisan?.verified && urls.length === 0) {
                        return (
                          <div>
                            <h3 className="text-brand-yellow text-xs font-black uppercase tracking-[0.2em] mb-6 ml-2">Proof of Work</h3>
                            <div className={`p-8 border border-dashed rounded-2xl text-center text-gray-500 text-sm ${isDarkMode ? 'border-white/10' : 'border-gray-300'}`}>
                               No portfolio images uploaded yet.
                            </div>
                          </div>
                        );
                     }

                     // If they are NOT verified and have no photos (Locked State)
                     if (!selectedArtisan?.verified && urls.length === 0) {
                        return (
                          <div className={`p-8 border rounded-3xl text-center mb-8 ${isDarkMode ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                             <div className={`inline-block p-3 rounded-full mb-3 ${isDarkMode ? 'bg-black/40 text-gray-500' : 'bg-white text-gray-400'}`}>🔒</div>
                             <h4 className={`font-bold text-sm uppercase tracking-widest mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Portfolio Locked</h4>
                          </div>
                        );
                     }

                     // 🌟 THE PREMIUM IMAGE GRID (For Artisans with Photos!)
                     return (
                       <div className="mb-12 w-full animate-fade-in-up">
                         <h3 className="text-brand-yellow text-xs font-black uppercase tracking-[0.2em] mb-6 ml-2">
                           Proof of Work
                         </h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           {urls.slice(0, 4).map((imgUrl: string, index: number) => (
                             <div 
                                key={index} 
                                className={`aspect-square rounded-2xl overflow-hidden border group cursor-pointer hover:border-brand-yellow shadow-lg transition-all ${isDarkMode ? 'border-white/10 bg-black' : 'border-gray-200 bg-gray-100'}`} 
                                onClick={() => typeof setEnlargedImage === 'function' && setEnlargedImage(imgUrl)}
                              >
                               <img 
                                 src={imgUrl} 
                                 alt={`${selectedArtisan.first_name}'s Work ${index + 1}`} 
                                 className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-90 group-hover:opacity-100" 
                               />
                             </div>
                           ))}
                         </div>
                       </div>
                     );
                   })()}
                   
                   <div className="flex flex-row w-full gap-4 sticky bottom-6 z-40">
                      <button onClick={() => handleContact('call', selectedArtisan.phone)} className="flex-1 py-5 rounded-2xl bg-brand-yellow text-black font-black uppercase tracking-widest text-sm shadow-xl hover:bg-green-600 hover:text-white transition-all transform active:scale-95">Call Now</button>
                      <button onClick={() => handleContact('whatsapp', selectedArtisan.phone)} className={`flex-1 py-5 rounded-2xl border font-black uppercase tracking-widest text-sm shadow-xl transition-all ${isDarkMode ? 'bg-[#111] border-white/20 text-white hover:bg-green-600 hover:border-green-600' : 'bg-white border-gray-300 text-gray-900 hover:bg-green-600 hover:text-white'}`}>Message</button>
                   </div>
                </div>
              </div>
            </div>
          )}
{/* --- 1-CLICK AI ONBOARDING PAGE --- */}
          {appState === AppState.QUICK_JOIN && (
            <div className="animate-fade-in pt-24 pb-12 w-full max-w-2xl mx-auto reveal">
              <button onClick={goHome} className="mb-6 ml-6 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-brand-yellow flex items-center transition-colors group">
                <span className="mr-3 transition-transform group-hover:-translate-x-1">←</span> Back Home
              </button>
              <QuickOnboard 
                isDarkMode={isDarkMode} 
                onComplete={() => {
                  goHome();
                  showToast("Profile successfully submitted for AI review!", "success");
                }} 
              />
            </div>
          )}
          {appState === AppState.REGISTRATION && (
            <div className="animate-fade-in max-w-2xl mx-auto px-6 py-24 w-full reveal">
              <button onClick={goHome} className="mb-12 text-xs font-black uppercase tracking-widest text-gray-500 hover:text-brand-yellow flex items-center transition-colors group"><span className="mr-3 transition-transform group-hover:-translate-x-1">←</span> Back Home</button>
              <div className={`rounded-[3rem] p-10 md:p-16 border-2 border-brand-yellow shadow-3xl ${isDarkMode ? 'bg-[#1a1a1a]' : 'bg-white'}`} id="registration-form">
                {!isSubmitted ? (
                  <>
                    <h2 className={`text-4xl font-black mb-8 tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Artisan Registry</h2>
                    <p className="text-gray-400 mb-10 font-medium">Join the premier network for Far East Rand specialists. Build your local authority today.</p>
                    <form onSubmit={handleRegSubmit} className="space-y-6 stagger-child">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-yellow mb-2 ml-1">First Name</label>
                            <input required type="text" value={regForm.firstName} onChange={(e) => setRegForm({...regForm, firstName: e.target.value})} className={`w-full border rounded-xl px-5 py-4 focus:border-brand-yellow outline-none font-bold ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} placeholder="e.g. Khauhelo" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-brand-yellow mb-2 ml-1">Last Name</label>
                            <input required type="text" value={regForm.lastName} onChange={(e) => setRegForm({...regForm, lastName: e.target.value})} className={`w-full border rounded-xl px-5 py-4 focus:border-brand-yellow outline-none font-bold ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} placeholder="e.g. Mokoena" />
                        </div>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-yellow mb-2 ml-1">Primary Discipline</label>
                          <select required value={regForm.trade} onChange={(e) => setRegForm({...regForm, trade: e.target.value})} className={`w-full border rounded-xl px-5 py-4 focus:border-brand-yellow outline-none font-bold appearance-none ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}><option value="" className="text-gray-500">Select Trade...</option>{CATEGORIES.map(cat => <option key={cat} value={cat} className="text-black">{cat}</option>)}</select>
                      </div>
                      <div className="mt-6">
                        <label className="block text-[10px] font-black uppercase tracking-widest text-brand-yellow mb-2 ml-1">Training Institution (Optional)</label>
                        <select value={regForm.institution} onChange={(e) => setRegForm({...regForm, institution: e.target.value})} className={`w-full border rounded-xl px-5 py-4 focus:border-brand-yellow outline-none font-bold appearance-none ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}>
                            <option value="">Select Institution...</option>
                            <option value="Ekurhuleni East College">Ekurhuleni East College</option>
                            <option value="Sedibeng TVET">Sedibeng TVET</option>
                            <option value="Private Technical College">Private Technical College</option>
                            <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-yellow mb-2 ml-1">Professional Bio</label>
                          <textarea required value={regForm.bio} onChange={(e) => setRegForm({...regForm, bio: e.target.value})} className={`w-full border rounded-xl px-5 py-4 focus:border-brand-yellow outline-none font-bold min-h-[120px] ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`} placeholder="Briefly describe your expertise..." />
                      </div>
                      <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-yellow mb-2 ml-1">How did you hear about us?</label>
                          <select required value={regForm.referralSource} onChange={(e) => setRegForm({...regForm, referralSource: e.target.value})} className={`w-full border rounded-xl px-5 py-4 focus:border-brand-yellow outline-none font-bold appearance-none ${isDarkMode ? 'bg-black/40 border-white/10 text-white' : 'bg-gray-50 border-gray-300 text-gray-900'}`}><option value="" className="text-gray-500">Select...</option><option value="Facebook" className="text-black">Facebook</option><option value="Word of Mouth" className="text-black">Word of Mouth</option><option value="Google Search" className="text-black">Google Search</option><option value="Other" className="text-black">Other</option></select>
                      </div>
                      <div>
                          <label className="block text-[10px] font-black uppercase tracking-widest text-brand-yellow mb-2 ml-1">Portfolio (Max 4 Images)</label>
                          {selectedImages.length < 4 && (
                             <div className={`relative border-2 border-dashed rounded-xl hover:border-brand-yellow/50 transition-colors p-6 flex flex-col items-center justify-center text-center cursor-pointer ${isDarkMode ? 'border-white/20 bg-black/20' : 'border-gray-300 bg-gray-50'}`}>
                                <input type="file" accept="image/*" multiple onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                <div className="text-brand-yellow mb-2">📷</div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Click to Upload</p>
                             </div>
                          )}
                          {imagePreviews.length > 0 && (
                             <div className="grid grid-cols-4 gap-2 mt-4">
                                 {imagePreviews.map((src, index) => (
                                     <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-white/10 group">
                                         <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                         <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">x</button>
                                     </div>
                                 ))}
                             </div>
                          )}
                      </div>
                      <div className={`pt-4 border-t ${isDarkMode ? 'border-white/10' : 'border-gray-200'}`}>
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className={`w-6 h-6 rounded border flex items-center justify-center transition-colors ${captchaVerified ? 'bg-brand-yellow border-brand-yellow' : 'border-gray-400 group-hover:border-brand-yellow'}`}>
                                {captchaVerified && (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-black"><path fillRule="evenodd" d="M19.916 4.626a.75.75 0 0 1 .208 1.04l-9 13.5a.75.75 0 0 1-1.154.114l-6-6a.75.75 0 0 1 1.06-1.06l5.353 5.353 8.493-12.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" /></svg>)}
                            </div>
                            <input type="checkbox" className="hidden" checked={captchaVerified} onChange={(e) => setCaptchaVerified(e.target.checked)} />
                            <span className="text-gray-400 text-xs font-bold uppercase tracking-widest group-hover:text-brand-yellow transition-colors">I am human (Security Check)</span>
                        </label>
                      </div>
                      <div className="opacity-0 absolute top-0 left-0 h-0 w-0 overflow-hidden -z-10"><input type="text" name="fax_number" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
                      <button type="submit" disabled={isSubmitting} className="w-full bg-brand-yellow text-brand-black font-black py-6 rounded-2xl uppercase tracking-[0.2em] text-sm shadow-2xl hover:bg-black hover:text-white transition-all transform active:scale-[0.98]">{isSubmitting ? "Processing..." : "Submit Application"}</button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-12 animate-fade-in">
                    <div className="w-24 h-24 bg-brand-green/20 rounded-full flex items-center justify-center text-brand-green mx-auto mb-8 animate-pulse"><VerifiedIcon /></div>
                    <h2 className={`text-3xl md:text-4xl font-black mb-4 tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Application Received!</h2>
                    <p className="text-gray-400 mb-2 font-medium">Welcome to the network.</p>
                    <button onClick={goHome} className={`px-12 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all border ${isDarkMode ? 'bg-[#1a1a1a] border-white/10 hover:border-brand-yellow text-white hover:text-brand-yellow' : 'bg-white border-gray-300 hover:border-brand-yellow text-gray-900 hover:text-brand-yellow'}`}>Return to Home</button>
                  </div>
                )}
              </div>
            </div>
          )}

          {appState === AppState.ADMIN && <AdminDashboard onBack={goHome} />}

          {(appState === AppState.HOME || appState === AppState.SEARCH_RESULTS) && (
            <section className="relative py-32 overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-brand-yellow/5 blur-[120px] rounded-full pointer-events-none" />
              <div className="relative z-10 max-w-6xl mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-12 text-center md:text-left">
                  <div className="flex-1 space-y-4">
                    <h2 className={`text-5xl md:text-7xl font-black tracking-tighter ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Are you a top-tier <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-yellow-500">Artisan?</span></h2>
                    <p className="text-gray-400 text-lg md:text-xl max-w-xl mx-auto md:mx-0 leading-relaxed font-medium">Join the elite <span className={isDarkMode ? 'text-white' : 'text-gray-900'}>Skills Connect</span> network. Get verified, get discovered, and grow your business today.</p>
                  </div>
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-brand-yellow to-yellow-400 rounded-full blur opacity-20 group-hover:opacity-50 transition duration-500" />
                    <button onClick={() => { goToRegistration(); window.scrollTo({top:0, behavior:'smooth'}); }} className="relative bg-brand-yellow text-brand-black px-12 py-6 rounded-full font-black uppercase tracking-widest text-sm md:text-base hover:bg-white hover:scale-105 transition-all shadow-2xl flex items-center gap-4 group-hover:shadow-[0_0_40px_rgba(250,204,21,0.3)]">
                      Join the Network
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transition-transform group-hover:translate-x-1"><path fillRule="evenodd" d="M12.97 3.97a.75.75 0 0 1 1.06 0l7.5 7.5a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 1 1-1.06-1.06l6.22-6.22H3a.75.75 0 0 1 0-1.5h16.19l-6.22-6.22a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>
                    </button>
                  </div>
                </div>
                <div className={`mt-32 h-px w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-10 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
              </div>
            </section>
          )}
          </>
        )}
      </main>

      {/* FOOTER (Hidden on Welcome Screen) */}
      {appState !== AppState.WELCOME && (
      <footer className={`border-t pt-24 pb-12 ${isDarkMode ? 'bg-[#150f0a] border-white/5' : 'bg-gray-100 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className={`text-3xl font-black tracking-tighter block mb-10 cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`} onClick={goHome}>
            Skills<span className="text-brand-yellow italic">ConnectPro</span>
          </span>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-6 mb-16 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
            <button onClick={goHome} className="hover:text-brand-yellow transition-colors">Find a Specialist</button>
            <button onClick={goToRegistration} className="text-brand-yellow hover:text-black dark:hover:text-white transition-colors border-b-2 border-brand-yellow/30 pb-1">Join as an Artisan</button>
            <button onClick={() => setActiveModal('privacy')} className="hover:text-brand-yellow transition-colors">Privacy Policy</button>
            <button onClick={() => setActiveModal('verification')} className="hover:text-brand-yellow transition-colors">Verification Process</button>
            <button onClick={() => setActiveModal('terms')} className="hover:text-brand-yellow transition-colors">Terms of Service</button>
            <button onClick={() => { const pin = prompt("Enter Admin PIN:"); if (pin === "2026") setAppState(AppState.ADMIN); else if (pin) alert("⛔ Access Denied"); }} className="text-gray-600 hover:text-brand-yellow transition-colors text-sm">© 2026 Skills Connect. All rights reserved.</button>
          </div>
          <p className="text-[9px] font-black uppercase tracking-[0.5em] text-gray-400/50">© {new Date().getFullYear()} Skills Connect RSA • Professional Trade Network</p>
        </div>
      </footer>
      )}

      {/* --- AI CAMERA ASSISTANT (Hidden on Welcome Screen) --- */}
      {appState !== AppState.WELCOME && (
      <CameraAssistant 
        onSearch={(term) => {
          setCategoryInput(term);
          setExecutedSearch(prev => ({ ...prev, category: term }));
        }} 
        onLocation={(loc) => {
          setLocationInput(loc);
          setExecutedSearch(prev => ({ ...prev, location: loc }));
          setAppState(AppState.SEARCH_RESULTS);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      )}

      {/* --- AI VOICE ASSISTANT (Hidden on Welcome Screen) --- */}
      {appState !== AppState.WELCOME && (
      <VoiceAssistant 
        isDarkMode={isDarkMode} 
        onExecuteSearch={(trade, loc) => {
          console.log("🎤 Executing Search Payload:", { trade, loc });
          setCategoryInput(trade);
          setLocationInput(loc);
          setExecutedSearch({ category: trade, location: loc });
          setAppState(AppState.SEARCH_RESULTS);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      )}

    </div> // Main closing div
  );
}// ==========================================
// 2. PASTE YOUR ENTIRE APP COMPONENTS HERE
// (From QUICK_CATEGORIES all the way down to the end of the App component)
// DO NOT paste your old AppWrapper. 
// ==========================================


// ==========================================
// 3. THE NEW NEXT.JS VIP ROUTER WRAPPER
// ==========================================
const AppWrapperContent = () => {
  // Next.js way of reading the ?claim= URL parameter safely
  const searchParams = useSearchParams();
  const claimId = searchParams.get('claim');

  // If the VIP link is detected, show the Claim Screen!
  if (claimId) {
    return <ClaimProfile />;
  }

  // Otherwise, load the app normally!
  return <App />;
};

// This is what Next.js actually looks for to render the page
export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#150f0a]" />}>
      <AppWrapperContent />
    </Suspense>
  );
}