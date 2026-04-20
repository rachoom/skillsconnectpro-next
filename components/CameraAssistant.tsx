import React, { useState, useRef } from 'react';
import { Camera, X, Loader2, ScanLine, ArrowRight, MapPin } from 'lucide-react';
import { analyzeImageIntent } from '../services/aiService';

interface CameraAssistantProps {
  onSearch: (term: string) => void;
  onLocation: (loc: string) => void;
}

export const CameraAssistant: React.FC<CameraAssistantProps> = ({ onSearch, onLocation }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState({ trade: '', problem: '' });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  // ==========================================
// ==========================================
  // ⚡ UPGRADED: ULTRA-COMPRESSION ENGINE
  // Shrinks massive mobile photos to ~40kb for instant 3G/4G upload
  // ==========================================
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          
          // CRUSHED DOWN from 800 to 512. AI still sees this perfectly.
          const MAX_WIDTH = 512; 
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;

          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);

          // CRUSHED QUALITY down from 0.7 to 0.4. 
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.4).split(',')[1];
          resolve(compressedBase64);
        };
        img.onerror = (err) => reject(err);
      };
      reader.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Show preview instantly
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setIsProcessing(true);
    setShowResult(true);

    try {
      // 1. Compress the massive mobile image
      const compressedBase64 = await compressImage(file);
      
      // 2. Send the tiny image to Gemini (much faster, no network errors)
      // We force the mimeType to image/jpeg because we compressed it as a JPEG
      const result = await analyzeImageIntent(compressedBase64, 'image/jpeg');

      if (result.success && result.trade) {
        setAiAnalysis({ trade: result.trade, problem: result.problem });
      } else {
        setAiAnalysis({ trade: '', problem: "Couldn't identify. Try a clearer photo." });
      }
    } catch (error: any) {
      console.error(error);
      // Now it uses the actual error message sent from aiService!
      setAiAnalysis({ trade: '', problem: error.message || "Something went wrong. Try again." });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExecuteSearch = () => {
    if (aiAnalysis.trade) {
      onSearch(aiAnalysis.trade);
      if (userLocation.trim()) {
        const formattedLoc = userLocation.trim().charAt(0).toUpperCase() + userLocation.trim().slice(1);
        onLocation(formattedLoc);
      }
    }
    closePanel();
  };

  const closePanel = () => {
    setShowResult(false);
    setImagePreview(null);
    setAiAnalysis({ trade: '', problem: '' });
    setUserLocation('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <>
      <input 
        type="file" 
        accept="image/*" 
        capture="environment" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
      />

      {/* 3D EMERALD CAMERA BUTTON */}
      {!showResult && (
        <button 
          onClick={handleCameraClick}
          className="fixed bottom-6 left-6 z-[90] h-16 w-16 liquid-glass glass-camera rounded-full flex items-center justify-center hover:scale-110 transition-all group"
        >
          <Camera className="text-[#0c0906] w-7 h-7 group-hover:scale-110 transition-transform" strokeWidth={2.5} />
        </button>
      )}

      {/* AI VISION MODAL */}
      {showResult && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-6 animate-fade-in">
          <button onClick={closePanel} className="absolute top-6 right-6 p-4 text-white hover:text-brand-yellow">
            <X size={32} />
          </button>

          <div className="w-full max-w-sm flex flex-col items-center gap-6">
            <h2 className="text-brand-yellow font-black text-2xl uppercase tracking-widest text-center flex items-center gap-2">
              <Camera size={24}/> AI Vision
            </h2>

            <div className="w-full aspect-[4/5] bg-zinc-900 rounded-3xl overflow-hidden relative border-2 border-white/10 shadow-2xl">
              {imagePreview && <img src={imagePreview} alt="Captured" className="w-full h-full object-cover" />}
              
              {isProcessing && (
                <div className="absolute inset-0 bg-brand-yellow/10 flex flex-col items-center justify-center backdrop-blur-sm">
                  <div className="w-full h-1 bg-brand-yellow absolute top-0 animate-[scan_2s_ease-in-out_infinite] shadow-[0_0_20px_#facc15]" />
                  <ScanLine className="text-brand-yellow w-16 h-16 animate-pulse mb-4" />
                  <p className="text-brand-yellow font-black tracking-widest animate-pulse">ANALYZING IMAGE...</p>
                </div>
              )}
            </div>

            {!isProcessing && (
              <div className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl animate-fade-in-up">
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">Issue Detected:</p>
                <p className="text-white text-lg font-medium leading-tight mb-5">
                  "{aiAnalysis.problem}"
                </p>

                {aiAnalysis.trade ? (
                  <>
                   <div className="relative mb-3">
  <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
    <MapPin className="h-5 w-5 text-emerald-500" />
  </div>
  
  <select
    value={userLocation}
    onChange={(e) => setUserLocation(e.target.value)}
    className="w-full bg-black/50 border border-zinc-700 rounded-xl py-3 pl-10 pr-10 text-white focus:outline-none focus:border-brand-yellow transition-colors font-medium appearance-none cursor-pointer"
  >
    <option value="" disabled>Select your area...</option>
    <option value="Brakpan">Brakpan</option>
    <option value="Tsakane">Tsakane</option>
    <option value="Springs">Springs</option>
    <option value="KwaThema">KwaThema</option>
    <option value="Benoni">Benoni</option>
    <option value="Boksburg">Boksburg</option>
    <option value="Nigel">Nigel</option>
    <option value="Duduza">Duduza</option>
    <option value="Daveyton">Daveyton</option>
  </select>

  {/* Custom dropdown arrow so it looks like a premium native app */}
  <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
    </svg>
  </div>
</div>

                    {/* ⚡ 1-Tap Location Pills */}
                    <div className="flex flex-wrap gap-2 mb-5 justify-center">
                      {['Tsakane', 'Brakpan', 'Springs', 'KwaThema'].map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setUserLocation(loc)}
                          className="px-3 py-1.5 bg-zinc-800/80 border border-zinc-700 rounded-full text-xs text-gray-300 hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-colors font-bold tracking-wider"
                        >
                          {loc}
                        </button>
                      ))}
                    </div>

                    <button 
                      onClick={handleExecuteSearch}
                      disabled={!userLocation.trim()}
                      className={`w-full h-16 rounded-xl flex items-center justify-center gap-3 font-black uppercase tracking-widest text-lg transition-transform ${
                        userLocation.trim() ? 'bg-brand-yellow text-black hover:scale-105' : 'bg-zinc-800 text-zinc-600 cursor-not-allowed'
                      }`}
                    >
                      <span>Find {aiAnalysis.trade}</span>
                      {userLocation.trim() && <ArrowRight size={20} strokeWidth={3} />}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={handleCameraClick}
                    className="w-full h-16 rounded-xl flex items-center justify-center gap-3 bg-zinc-800 text-white font-bold uppercase tracking-wider hover:bg-zinc-700"
                  >
                    <Camera size={20} /> Retake Photo
                  </button>
                )}
              </div>
            )}
          </div>

          <style>{`
            @keyframes scan {
              0% { top: 0%; opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { top: 100%; opacity: 0; }
            }
          `}</style>
        </div>
      )}
    </>
  );
};