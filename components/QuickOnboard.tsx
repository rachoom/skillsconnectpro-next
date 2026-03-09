// src/components/QuickOnboard.tsx
import React, { useState, useRef } from 'react';
import { extractBusinessCard } from '../services/aiOnboardingService';
import { supabase } from '../services/supabase';
import { Loader2, UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';

export const QuickOnboard: React.FC<{ isDarkMode: boolean; onComplete: () => void }> = ({ isDarkMode, onComplete }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-using your excellent compression logic!
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Good enough for reading text
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.6).split(',')[1]);
        };
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatus('scanning');

    try {
      const compressedImage = await compressImage(file);
      const aiResult = await extractBusinessCard(compressedImage, 'image/jpeg');

      if (!aiResult.success) {
        setStatus('error');
        setErrorMessage(aiResult.reason === 'invalid_image_type' 
          ? "We couldn't detect a business card or flyer. Please try a clearer photo." 
          : "Network error. Please try again.");
        setIsProcessing(false);
        return;
      }

      // It passed the AI Bouncer! Push to Supabase "Pending" Table
      const { error } = await supabase.from('artisan_applications').insert([{
        first_name: aiResult.name || 'Unknown',
        last_name: '', // Split logic can be added, or keep business name in first_name
        trade: aiResult.trade || 'General',
        phone: aiResult.phone || 'No phone detected',
        location: aiResult.location || 'East Rand',
        status: 'pending',
        bio: 'Auto-extracted from business card upload.'
      }]);

      if (error) throw error;

      setStatus('success');
      setTimeout(onComplete, 4000); // Send them back to home after reading success

    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMessage("Something went wrong saving your profile.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={`min-h-[70vh] flex flex-col items-center justify-center p-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      <div className={`max-w-md w-full p-8 rounded-[3rem] shadow-2xl border text-center ${isDarkMode ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`}>
        
        {status === 'idle' && (
          <div className="animate-fade-in-up">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">Join <span className="text-brand-yellow">Instantly</span></h2>
            <p className="text-gray-400 mb-8 font-medium">No long forms. Just snap a photo of your business card, flyer, or a handwritten note with your details.</p>
            
            <input type="file" accept="image/*" capture="environment" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="w-full bg-brand-yellow text-black font-black py-6 rounded-2xl uppercase tracking-widest text-sm hover:scale-105 transition-transform flex flex-col items-center gap-2 shadow-lg shadow-brand-yellow/20"
            >
              <UploadCloud size={32} />
              <span>Take a Photo</span>
            </button>
          </div>
        )}

        {status === 'scanning' && (
          <div className="flex flex-col items-center py-10 animate-fade-in">
            <Loader2 className="w-16 h-16 text-brand-yellow animate-spin mb-6" />
            <h3 className="text-xl font-black uppercase tracking-widest text-brand-yellow animate-pulse">AI is Scanning...</h3>
            <p className="text-sm text-gray-500 mt-2">Extracting your trade and contact info.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center py-10 animate-fade-in">
            <CheckCircle className="w-20 h-20 text-green-500 mb-6" />
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Profile Created!</h3>
            <p className="text-gray-400">Our team will verify your details and make you live shortly.</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center py-8 animate-fade-in">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
            <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Upload Failed</h3>
            <p className="text-gray-400 mb-6 text-sm">{errorMessage}</p>
            <button 
              onClick={() => setStatus('idle')}
              className="px-8 py-3 border border-brand-yellow text-brand-yellow rounded-xl font-bold uppercase text-xs hover:bg-brand-yellow hover:text-black transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

      </div>
    </div>
  );
};