"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Camera, X, Loader2, Hammer, Image as ImageIcon } from 'lucide-react';

export default function DIYvsProCalculator() {
  const [input, setInput] = useState('');
  const [timeValue, setTimeValue] = useState('150');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // 🟢 NEW: High-Performance Client-Side Image Compressor
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800; // Resize HD tablet photos down to 800px wide
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          // Export as JPEG at 70% quality (Massive file size reduction)
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Compress the image immediately on the device before setting state
      const compressedBase64 = await compressImage(file);
      setImage(compressedBase64);
    }
  };

  const handleCalculate = async () => {
    if (!input) return alert("Please describe your project first!");
    setLoading(true);
    setResult(null);
    
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: input, image: image, hourlyRate: timeValue })
      });
      
      const textData = await res.text();
      let data;
      try { data = JSON.parse(textData); } 
      catch (err) { throw new Error(textData ? `Server Error: ${textData.substring(0,40)}...` : "Empty response."); }

      if (!res.ok) throw new Error(data.error || "Failed to connect to the API.");
      
      let parsedObj = { materialsTotal: 0, toolsNeeded: 0, laborHours: 4 };
      if (data.estimate) {
        try {
          const b = String.fromCharCode(96, 96, 96);
          const cleanString = data.estimate.replace(new RegExp(b + 'json|' + b, 'gi'), '').trim();
          const tempParsed = JSON.parse(cleanString);
          if (tempParsed && typeof tempParsed === 'object') parsedObj = { ...parsedObj, ...tempParsed };
        } catch(e) {}
      }

      const rate = parseInt(timeValue) || 150;
      const laborTotal = (parsedObj.laborHours || 4) * rate;
      const materials = parsedObj.materialsTotal || 0;
      const tools = parsedObj.toolsNeeded || 0;
      
      setResult({ materials, tools, laborHours: parsedObj.laborHours || 4, laborTotal, trueCost: materials + tools + laborTotal });
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 mb-8 relative">
      <div className="absolute top-0 left-1/4 w-64 h-64 bg-brand-yellow/10 blur-[100px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-yellow/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 p-8 bg-[#0c0906]/60 backdrop-blur-xl border border-white/10 rounded-[2rem] shadow-[0_8px_32px_0_rgba(0,0,0,0.5)]">
        <div className="text-center mb-8">
          <span className="text-brand-yellow text-xs font-bold tracking-[0.2em] uppercase drop-shadow-md">Skills Connect Pro</span>
          <h2 className="text-3xl font-black text-white mt-2">Home Improvement <span className="text-brand-yellow">Estimator</span></h2>
        </div>

        <div className="bg-white/5 border border-brand-yellow/20 p-4 rounded-xl mb-6 text-sm text-gray-200 shadow-inner">
          <strong className="text-brand-yellow">Instructions:</strong> Attach a photo of your project area, then describe the work needed.
        </div>
        
        <div className="space-y-4 mb-8">
          <div className="relative group">
            <textarea 
              value={input} onChange={(e) => setInput(e.target.value)}
              placeholder="e.g., Paint this wall..."
              className="w-full p-4 pb-14 bg-black/40 text-white rounded-xl border border-white/10 focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow outline-none resize-none backdrop-blur-sm transition-all shadow-inner" rows={4}
            />
            <div className="absolute bottom-3 left-3 flex items-center gap-2">
              <button onClick={() => cameraInputRef.current?.click()} className="p-2 bg-white/5 text-gray-400 hover:text-brand-yellow hover:bg-white/10 rounded-lg border border-white/5 transition-all" title="Take Photo">
                <Camera size={20} />
              </button>
              <input type="file" accept="image/*" capture="environment" hidden ref={cameraInputRef} onChange={handleImageUpload} />
              
              <button onClick={() => galleryInputRef.current?.click()} className="p-2 bg-white/5 text-gray-400 hover:text-brand-yellow hover:bg-white/10 rounded-lg border border-white/5 transition-all" title="Upload from Gallery">
                <ImageIcon size={20} />
              </button>
              <input type="file" accept="image/*" hidden ref={galleryInputRef} onChange={handleImageUpload} />
            </div>
            {image && (
              <div className="absolute bottom-3 right-3 relative inline-block">
                <img src={image} className="h-10 w-10 object-cover rounded-md border border-brand-yellow/50 shadow-lg" />
                <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={12} /></button>
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-1">Your Time Value (R/hr)</label>
            <input type="number" value={timeValue} onChange={(e) => setTimeValue(e.target.value)} className="w-full p-4 bg-black/40 text-white rounded-xl border border-white/10 focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow outline-none backdrop-blur-sm transition-all shadow-inner" />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={handleCalculate} disabled={loading} className="w-full py-4 bg-brand-yellow text-black font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all flex justify-center items-center gap-2 disabled:opacity-50 shadow-[0_0_20px_rgba(250,204,21,0.3)]">
            {loading ? <><Loader2 className="animate-spin" size={20} /> Analyzing...</> : 'Analyze Project'}
          </button>
          <Link href="/" className="w-full py-4 bg-white/5 text-white font-bold uppercase tracking-widest rounded-xl hover:bg-white/10 border border-white/5 text-center transition-all backdrop-blur-md">← Back to Directory</Link>
        </div>

        {result && (
          <div className="mt-8 p-6 bg-black/50 rounded-2xl border border-brand-yellow/30 backdrop-blur-md shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
              <Hammer className="text-brand-yellow" size={24} />
              <h3 className="text-xl font-bold text-white tracking-wide">Project Estimate</h3>
            </div>
            <div className="space-y-4 text-sm text-gray-300">
              <div className="flex justify-between items-center"><span>Materials Total</span><span className="font-mono text-white bg-white/10 px-2 py-1 rounded">R {result.materials}</span></div>
              <div className="flex justify-between items-center"><span>Tools Needed</span><span className="font-mono text-white bg-white/10 px-2 py-1 rounded">R {result.tools}</span></div>
              <div className="flex justify-between items-center"><span>Labor ({result.laborHours}h @ R{timeValue}/hr)</span><span className="font-mono text-white bg-white/10 px-2 py-1 rounded">R {result.laborTotal}</span></div>
            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-lg font-bold text-white">True Project Cost</span>
              <span className="text-4xl font-black text-brand-yellow tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">R {result.trueCost}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
