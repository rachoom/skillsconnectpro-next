import React, { useState, useEffect, useRef } from 'react';
import { Mic, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { analyzeIntent } from '../services/aiService';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

interface VoiceAssistantProps {
  onExecuteSearch: (trade: string, location: string) => void;
  isDarkMode: boolean;
}

// ============================================================
// 🇿🇦 REAL-TIME SOUTH AFRICAN CONTEXT ENGINE
// ============================================================
const applySAContext = (text: string) => {
  if (!text) return "";
  let corrected = text.toLowerCase();

  corrected = corrected.replace(/\b(kwa tema|kwatima|kwatim|quathema|kwa-thema|coatema|guatema|guatemma|guatemala)\b/g, "KwaThema");
  corrected = corrected.replace(/\b(sakane|tsakani|chakane|tsukane|suck on it|tagani|tagane|takani|tarkani)\b/g, "Tsakane");
  corrected = corrected.replace(/\b(do doza|dudusa|do dozer)\b/g, "Duduza");
  corrected = corrected.replace(/\b(davyton|daveton|davidton)\b/g, "Daveyton");
  corrected = corrected.replace(/\b(brak pan|bruck pan|brackpan|brockpan)\b/g, "Brakpan");
  corrected = corrected.replace(/\b(niger|nigil)\b/g, "Nigel"); 
  corrected = corrected.replace(/\b(benoni|binoni|banoni)\b/g, "Benoni");
  corrected = corrected.replace(/\b(boksburg|boxburg|boks burg)\b/g, "Boksburg");

  return corrected.charAt(0).toUpperCase() + corrected.slice(1);
};

const extractCleanData = (text: string) => {
    const lower = text.toLowerCase();
    let foundTrade = "";
    let foundLoc = "";

    const locations = ['tsakane', 'springs', 'brakpan', 'kwathema', 'duduza', 'nigel', 'daveyton', 'benoni', 'boksburg', 'east rand'];
    for (const loc of locations) {
        if (lower.includes(loc)) foundLoc = loc.charAt(0).toUpperCase() + loc.slice(1);
    }

    const trades = {
        'plumber': ['plumber', 'geyser', 'leak', 'burst', 'pipe', 'water', 'tap', 'sink', 'toilet'],
        'electrician': ['electrician', 'light', 'power', 'plug', 'wire', 'db board', 'tripping', 'christian', 'electrishan', 'appliance', 'stove', 'oven'],
        'builder': ['builder', 'roof', 'wall', 'cement', 'brick', 'building'],
        'mechanic': ['mechanic', 'car', 'engine', 'brake', 'auto'],
        'painter': ['painter', 'paint'],
        'welder': ['welder', 'weld'],
        'tiler': ['tiler', 'tile'],
        'carpenter': ['carpenter', 'wood', 'carpento', 'capenter'],
        'cleaner': ['cleaner', 'cleaning'],
        'landscaping': ['landscaper', 'garden', 'grass', 'yard']
    };

    for (const [trade, keywords] of Object.entries(trades)) {
        if (keywords.some(kw => new RegExp(`\\b${kw}(s|es)?\\b`, 'i').test(lower))) {
            foundTrade = trade.charAt(0).toUpperCase() + trade.slice(1);
            break;
        }
    }
    return { trade: foundTrade, location: foundLoc };
};

// ============================================================
// ANIMATED COMPONENTS (Gaming / HUD Aesthetic)
// ============================================================
const SoundWaves: React.FC<{ isActive: boolean }> = ({ isActive }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    {[...Array(4)].map((_, i) => (
      <div key={i} className={`absolute rounded-full border border-emerald-500/30 transition-all duration-500 ${isActive ? 'opacity-100' : 'opacity-0'}`} 
           style={{ width: `${120 + i * 50}px`, height: `${120 + i * 50}px`, animation: isActive ? `soundwave 1.5s ease-out infinite ${i * 0.2}s` : 'none' }} />
    ))}
  </div>
);

const GlowOrb: React.FC<{ color: string; size: number; blur: number }> = ({ color, size, blur }) => (
  <div className="absolute rounded-full animate-float pointer-events-none mix-blend-screen" style={{ background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, width: `${size}px`, height: `${size}px`, filter: `blur(${blur}px)`, opacity: 0.6 }} />
);

// ============================================================
// MAIN COMPONENT
// ============================================================
export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({ onExecuteSearch, isDarkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // ⚡ NEW STATE: This is the TRUE green light that waits for the server
  const [isReadyToSpeak, setIsReadyToSpeak] = useState(false); 
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('TAP MIC TO START');
  const [hintIndex, setHintIndex] = useState(0);

  const recognitionRef = useRef<any>(null);
  const readyTimeoutRef = useRef<any>(null); // To clear the timeout if needed

  const hints = [
    "Try: 'Find me a plumber in Springs'",
    "Try: 'I need an electrician in Tsakane'",
    "Try: 'Looking for a builder in Brakpan'",
    "Try: 'My geyser burst in KwaThema'"
  ];

  // The waiting messages before hardware wakes up
  const initializationMessages = [
    "✋ PLEASE WAIT A MOMENT...",
    "🔌 WARMING UP MICROPHONE...",
    "⏳ DO NOT SPEAK YET..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isInitializing) {
      let step = 0;
      setFeedback(initializationMessages[0]);
      interval = setInterval(() => {
        step++;
        if (step < initializationMessages.length) {
          setFeedback(initializationMessages[step]);
        }
      }, 1200); 
    }
    return () => clearInterval(interval);
  }, [isInitializing]);

  useEffect(() => {
    if (!isOpen || isListening || transcript) return;
    const interval = setInterval(() => {
      setHintIndex((prev) => (prev + 1) % hints.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isOpen, isListening, transcript]);

  useEffect(() => {
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true; 
    recognition.interimResults = true; 
    recognition.lang = 'en-ZA'; 

    recognition.onstart = () => {
      setIsInitializing(false);
      setIsListening(true); // Turns on the radar
      setFeedback('📡 ESTABLISHING SERVER CONNECTION...'); // Keeps text yellow!

      // 🚦 THE MAGIC FIX: Enforce a 3-second wait for the server to catch up
      readyTimeoutRef.current = setTimeout(() => {
        setIsReadyToSpeak(true); // Turns on the Green Light!
        setFeedback('🟢 SECURE. SPEAK YOUR INSTRUCTION NOW.');
      }, 3000); 
    };

    recognition.onresult = (event: any) => {
      let currentTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        currentTranscript += event.results[i][0].transcript;
      }
      const cleanedText = applySAContext(currentTranscript);
      setTranscript(cleanedText);
    };

    recognition.onend = () => {
      setIsListening(false);
      setIsInitializing(false);
      setIsReadyToSpeak(false);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
      setFeedback((prev) => prev.includes("AI") || prev.includes("COULDN'T") ? prev : '✓ TAP EXECUTE SEARCH');
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setIsInitializing(false);
      setIsReadyToSpeak(false);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
      
      if (event.error === 'no-speech') setFeedback('❌ DIDN\'T HEAR ANYTHING.');
      else if (event.error === 'not-allowed') setFeedback('❌ MICROPHONE BLOCKED.');
      else setFeedback('STOPPED.');
    };

    recognitionRef.current = recognition;
    return () => { 
      if (recognitionRef.current) recognitionRef.current.abort(); 
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    }
  }, []); 

  const closePanel = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    setIsOpen(false);
    setIsProcessing(false);
    setIsInitializing(false);
    setIsListening(false);
    setIsReadyToSpeak(false);
    setTranscript('');
    setFeedback('TAP MIC TO START');
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
        alert("Browser doesn't support instant voice search.");
        return;
    }

    if (isListening || isInitializing) {
      recognitionRef.current.stop();
      setIsInitializing(false);
      setIsReadyToSpeak(false);
      if (readyTimeoutRef.current) clearTimeout(readyTimeoutRef.current);
    } else {
      setTranscript(''); 
      setIsInitializing(true);
      try {
        recognitionRef.current.start();
      } catch (e) {
        setIsInitializing(false);
        console.error("Mic start error", e);
      }
    }
  };

  const handleSearchClick = async () => {
    const safeTranscript = transcript.trim();
    if (!safeTranscript) return;

    setIsProcessing(true);
    setFeedback("🧠 AI IS THINKING...");

    let finalTrade = "";
    let finalLocation = "";

    try {
        const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Network Timeout")), 8000));
        const result = await Promise.race([analyzeIntent(safeTranscript), timeoutPromise]) as any;
        
        finalTrade = result?.trade || "";
        finalLocation = result?.location || "";
    } catch (err) {
        console.warn("AI Timeout or Error.", err);
    }

    const offlineData = extractCleanData(safeTranscript);
    
    if (offlineData.trade) {
        finalTrade = offlineData.trade;
    } else if (!finalTrade || finalTrade.length > 25) {
        finalTrade = "";
    }

    if (offlineData.location) {
        finalLocation = offlineData.location;
    }

    if (!finalTrade) {
        setFeedback("❌ COULDN'T DETECT A VALID SERVICE.");
        setIsProcessing(false);
        setTimeout(() => closePanel(), 3000);
        return; 
    }

    closePanel();

    try {
        onExecuteSearch(finalTrade, finalLocation);
    } catch (appError) {
        console.error("App crashed when receiving data:", appError);
    }
  };

  return (
    <>
      <style>{`
        @keyframes soundwave { 0% { transform: scale(0.8); opacity: 1; border-width: 2px; } 100% { transform: scale(1.5); opacity: 0; border-width: 0px; } }
        @keyframes float { 0%, 100% { transform: translateY(0px) translateX(0px); } 50% { transform: translateY(-20px) translateX(10px); } }
      `}</style>

      {/* Floating Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-[90] h-16 w-16 bg-brand-yellow rounded-full shadow-[0_0_20px_rgba(250,204,21,0.4)] flex items-center justify-center hover:scale-110 transition-all border-2 border-[#0c0906] group">
          <Mic className="text-[#0c0906] w-7 h-7 group-hover:animate-pulse" strokeWidth={2.5} />
        </button>
      )}

      {/* 🚀 GLASSMORPHIC HUD MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 animate-fade-in">
          
          {/* 🌑 Ultra-Dark Frosted Glass Backdrop (Fixed bleeding text!) */}
          <div className="absolute inset-0 bg-[#0c0906]/95 backdrop-blur-xl" onClick={closePanel}></div>
          
          <GlowOrb color="rgba(250, 204, 21, 0.15)" size={600} blur={120} />
          {isReadyToSpeak && <GlowOrb color="rgba(16, 185, 129, 0.15)" size={400} blur={80} />}

          <button onClick={closePanel} className="absolute top-8 right-8 p-4 text-white/50 hover:text-brand-yellow transition-colors z-50">
            <X size={32} strokeWidth={2} />
          </button>

          <div className="w-full max-w-lg flex flex-col items-center gap-6 relative z-10">
            
            <div className="relative w-full flex flex-col items-center mb-6">
              <div className="relative w-48 h-48 flex items-center justify-center">
                
                {/* Radar turns on when listening starts */}
                <SoundWaves isActive={isListening} />

                {/* The Main Mic Button - Only turns green when isReadyToSpeak is TRUE */}
                <button 
                  onClick={toggleListening}
                  disabled={isProcessing}
                  className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 z-10 border-2 ${
                    isReadyToSpeak ? 'bg-emerald-500/20 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.5),_inset_0_0_20px_rgba(16,185,129,0.5)] scale-110 backdrop-blur-md' 
                    : isListening || isInitializing ? 'bg-brand-yellow/10 border-brand-yellow/50 shadow-[0_0_40px_rgba(250,204,21,0.2)] animate-pulse backdrop-blur-md'
                    : 'bg-black/50 border-white/10 hover:border-brand-yellow/30 shadow-2xl backdrop-blur-xl hover:bg-black/70'
                  }`}
                >
                  {isInitializing ? <Loader2 className="w-12 h-12 text-brand-yellow animate-spin" /> : <Mic className={`w-12 h-12 transition-colors duration-300 ${isReadyToSpeak ? 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.8)]' : 'text-brand-yellow drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]'}`} strokeWidth={2} />}
                </button>
              </div>

              {/* Dynamic HUD Feedback Text */}
              <div className="mt-8 text-center h-8 flex items-center justify-center w-full">
                <p className={`font-black uppercase tracking-[0.2em] text-xs md:text-sm transition-all duration-300 px-4 md:px-6 py-2 rounded-full border whitespace-nowrap ${
                  isReadyToSpeak ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
                  : isListening || isInitializing || isProcessing ? 'text-brand-yellow border-brand-yellow/30 bg-brand-yellow/10 animate-pulse' 
                  : 'text-gray-400 border-white/5 bg-white/5'
                }`}>
                  {feedback}
                </p>
              </div>
            </div>

            {/* Neon Glass Input Field */}
            <div className="w-full relative group px-2">
              <input 
                type="text" 
                value={transcript} 
                onChange={(e) => setTranscript(e.target.value)} 
                placeholder={isReadyToSpeak ? 'Speak your instruction now...' : isListening ? 'Calibrating connection...' : isInitializing ? 'DO NOT SPEAK YET...' : hints[hintIndex]} 
                className={`w-full px-6 py-5 rounded-2xl bg-black/40 backdrop-blur-2xl border border-white/10 text-white text-lg font-medium placeholder-gray-500/70 outline-none text-center transition-all shadow-[inset_0_2px_20px_rgba(0,0,0,0.5)] relative z-10 focus:border-brand-yellow/50 focus:bg-black/60 ${
                  isReadyToSpeak ? 'border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.1),_inset_0_2px_20px_rgba(0,0,0,0.5)]' : ''
                }`} 
               />
               <div className="absolute inset-y-0 right-6 flex items-center pointer-events-none z-20">
                  {transcript && !isProcessing && !isInitializing && <Sparkles className="w-5 h-5 text-brand-yellow animate-pulse drop-shadow-[0_0_5px_rgba(250,204,21,0.8)]" />}
               </div>
            </div>

            {/* Premium Search Button */}
            <div className="w-full px-2">
                <button 
                    onClick={handleSearchClick} 
                    disabled={!transcript.trim() || isProcessing || isInitializing} 
                    className={`w-full h-16 mt-2 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-sm transition-all duration-300 border ${
                        transcript.trim() && !isProcessing && !isInitializing 
                        ? 'bg-brand-yellow text-black border-brand-yellow hover:scale-[1.02] shadow-[0_0_30px_rgba(250,204,21,0.3)] cursor-pointer' 
                        : 'bg-white/5 text-gray-500 border-white/5 cursor-not-allowed backdrop-blur-md'
                    }`}
                >
                    {isProcessing ? <Loader2 className="animate-spin text-brand-yellow" size={24} /> : <><span>EXECUTE SEARCH</span><ArrowRight size={20} strokeWidth={2.5} /></>}
                </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
};