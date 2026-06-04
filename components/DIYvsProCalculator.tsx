"use client";

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hammer, Clock, Wrench, PackageOpen, X, Camera, MessageCircle, Info, Loader2, ChevronDown, Trash2, Share2 } from 'lucide-react';

interface TaskItem { item: string; cost: number; }

interface EstimateData {
  shareId?: string;
  tradeNeeded: string;
  assumptions: string;
  diyHours: number;
  riskFactor: number;
  clarifyingQuestions?: string[];
  materialsBoM: TaskItem[];
  toolsBoM: TaskItem[];
  userInput?: string;
}

export default function DIYvsProCalculator() {
  const [userInput, setUserInput] = useState("");
  const [hourlyRate, setHourlyRate] = useState(150);
  const [estimate, setEstimate] = useState<EstimateData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showItemized, setShowItemized] = useState(false);
  const [activeMaterials, setActiveMaterials] = useState<TaskItem[]>([]);
  const [activeTools, setActiveTools] = useState<TaskItem[]>([]);

  const MAX_IMAGES = 3;
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sharedId = params.get("ref");
    if (sharedId) {
      loadSharedEstimate(sharedId);
    }
  }, []);

  const loadSharedEstimate = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/estimate/${id}`);
      if (!res.ok) throw new Error("Shared estimate not found.");
      const data: EstimateData = await res.json();
      setEstimate(data);
      setUserInput(data.userInput || "");
      setActiveMaterials(data.materialsBoM || []);
      setActiveTools(data.toolsBoM || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const MAX_SIZE = 5 * 1024 * 1024;
    const remainingSlots = MAX_IMAGES - selectedImages.length;
    const newFilesArray = Array.from(files).slice(0, remainingSlots);
    const oversized = newFilesArray.filter(f => f.size > MAX_SIZE);

    if (oversized.length > 0) {
      setError("One or more images are too large. Please keep photos under 5MB.");
      return;
    }

    setSelectedImages(prev => [...prev, ...newFilesArray]);
    setImagePreviews(prev => [...prev, ...newFilesArray.map(f => URL.createObjectURL(f))]);
    setError(null);
    event.target.value = "";
  };

  const removePhoto = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeMaterial = (index: number) => setActiveMaterials(prev => prev.filter((_, i) => i !== index));
  const removeTool = (index: number) => setActiveTools(prev => prev.filter((_, i) => i !== index));

  const handleCalculate = async () => {
    if (!userInput.trim()) return;
    setIsLoading(true);
    setError(null);
    setEstimate(null);
    setShowItemized(false);

    try {
      const formData = new FormData();
      formData.append("task", userInput);
      formData.append("timeValue", hourlyRate.toString());
      selectedImages.forEach(file => formData.append("images", file));

      const response = await fetch("/api/estimate", { method: "POST", body: formData });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "Estimation failed.");
      }

      const data: EstimateData = await response.json();
      setEstimate(data);
      setActiveMaterials(data.materialsBoM || []);
      setActiveTools(data.toolsBoM || []);

      if (data.shareId) {
        window.history.pushState({}, '', `?ref=${data.shareId}`);
      }
    } catch (err: any) {
      setError(err.message || "AI analysis failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const currentMaterialsTotal = useMemo(
    () => activeMaterials.reduce((sum, item) => sum + item.cost, 0),
    [activeMaterials]
  );

  const currentToolsTotal = useMemo(
    () => activeTools.reduce((sum, item) => sum + item.cost, 0),
    [activeTools]
  );

  const trueCost = useMemo(() => {
    if (!estimate) return 0;
    const base = currentMaterialsTotal + currentToolsTotal + ((estimate?.diyHours || 0) * (hourlyRate || 0));
    return Math.round(base * (1 + (estimate.riskFactor || 0) / 100));
  }, [estimate, currentMaterialsTotal, currentToolsTotal, hourlyRate]);

  const handleWhatsAppShare = () => {
    if (!estimate?.shareId) return;
    const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${estimate.shareId}`;
    const message = encodeURIComponent(
      `🛠️ *Skills Connect Pro Estimate*\n\n` +
      `*Project:* ${userInput}\n` +
      `*Estimated Cost:* R ${trueCost.toLocaleString()}\n\n` +
      `View your full shopping list here: ${shareUrl}`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  const glassClasses = "backdrop-blur-xl bg-[#141414]/70 border border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.36)]";

  return (
    <div className="relative min-h-screen bg-[#0a0a0a] overflow-hidden text-white font-sans">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-yellow-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto p-4 md:p-8">

        <div className="text-center mb-8">
          <span className={`${glassClasses} px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-yellow-400`}>
            Skills Connect Pro
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mt-6 tracking-tighter">
            Home Improvement <span className="text-yellow-400">Estimator</span>
          </h1>
        </div>

        <div className={`${glassClasses} rounded-3xl p-6 mb-8`}>
          <div className="space-y-6">
            <div className="relative">
              <input
                type="text"
                placeholder="e.g., install a sliding door in Springs..."
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCalculate()}
                className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-14 text-white focus:border-yellow-400/50 outline-none transition-all placeholder:text-gray-600"
              />
              <button
                onClick={handlePhotoClick}
                disabled={selectedImages.length >= MAX_IMAGES}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-yellow-400 disabled:opacity-30 transition-colors"
                title="Attach a photo"
              >
                <Camera className="w-6 h-6" />
              </button>
              <input
                type="file"
                accept="image/*"
                multiple
                ref={fileInputRef}
                className="hidden"
                capture="environment" onChange={handleFileChange}
              />
            </div>

            <AnimatePresence>
              {imagePreviews.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-widest">
                    Context Photos ({imagePreviews.length} of {MAX_IMAGES})
                  </p>
                  <div className="flex gap-4 flex-wrap">
                    {imagePreviews.map((src, idx) => (
                      <motion.div
                        key={idx}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="relative inline-block"
                      >
                        {idx === 0 && (
                          <span className="absolute -top-2 -left-2 bg-yellow-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full z-10">Main</span>
                        )}
                        <img src={src} className="w-20 h-20 object-cover rounded-xl border border-white/20" alt={`Photo ${idx + 1}`} />
                        <button
                          onClick={() => removePhoto(idx)}
                          className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 border-2 border-[#141414]"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </motion.div>
                    ))}
                    {imagePreviews.length < MAX_IMAGES && (
                      <button
                        onClick={handlePhotoClick}
                        className="w-20 h-20 rounded-xl border border-dashed border-white/20 flex flex-col items-center justify-center text-gray-600 hover:text-yellow-400 hover:border-yellow-400/40 transition-colors"
                      >
                        <Camera className="w-5 h-5 mb-1" />
                        <span className="text-[9px]">Add Photo</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 block tracking-tight">
                  Your Time Value (R/Hr)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={e => setHourlyRate(Number(e.target.value))}
                    min={0}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white outline-none focus:border-yellow-400/50 transition-all"
                  />
                  <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-600" />
                </div>
              </div>
              <button
                onClick={handleCalculate}
                disabled={isLoading || !userInput.trim()}
                className="flex-[2] bg-yellow-400 hover:bg-yellow-500 disabled:bg-yellow-900 disabled:cursor-not-allowed text-black font-black rounded-2xl flex items-center justify-center gap-2 uppercase tracking-tighter text-lg transition-all active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.2)]"
              >
                {isLoading ? <><Loader2 className="animate-spin w-5 h-5" /> Analyzing...</> : "Analyze Project"}
              </button>
            </div>
          </div>
        </div>

        {estimate && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

            {estimate.clarifyingQuestions && estimate.clarifyingQuestions.length > 0 && (
              <div className={`${glassClasses} border-yellow-400/30 p-5 rounded-2xl`}>
                <h4 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" /> AI Needs More Context
                </h4>
                <p className="text-xs text-gray-400 mb-2">Please clarify these details in your description above for a highly accurate quote:</p>
                <ul className="list-disc pl-5 text-sm text-white/90 space-y-1">
                  {estimate.clarifyingQuestions.map((q, i) => <li key={i}>{q}</li>)}
                </ul>
              </div>
            )}

            <div className={`${glassClasses} border-blue-500/20 p-4 rounded-2xl text-sm flex gap-3`}>
              <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-blue-100">
                <span className="font-bold">AI Base Assumptions: </span>
                {estimate.assumptions}
              </p>
            </div>

            <div className={`${glassClasses} rounded-3xl p-6 md:p-8 relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-yellow-400" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-yellow-400/10 rounded-full text-yellow-400 border border-yellow-400/20">
                  <Hammer className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-3xl tracking-tight text-white">Project Estimate</h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest">Live Dynamic Calculation</p>
                </div>
              </div>

              <div className="space-y-4 text-lg">
                <div className="flex justify-between text-gray-300">
                  <span>Materials Total</span>
                  <span className="font-mono font-bold">R {currentMaterialsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tools Needed</span>
                  <span className="font-mono font-bold">R {currentToolsTotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Labor ({estimate?.diyHours || 0}h @ R{hourlyRate}/hr)</span>
                  <span className="font-mono font-bold">R {((estimate?.diyHours || 0) * (hourlyRate || 0)).toLocaleString()}</span>
                </div>
                {estimate.riskFactor > 0 && (
                  <div className="flex justify-between text-orange-400/80 text-base">
                    <span>Risk Buffer (+{estimate.riskFactor}%)</span>
                    <span className="font-mono">included</span>
                  </div>
                )}
                <div className="pt-6 border-t border-white/10 flex justify-between items-end font-black text-white">
                  <span className="text-lg">True Project Cost</span>
                  <span className="text-5xl text-yellow-400 tracking-tighter drop-shadow-[0_0_15px_rgba(250,204,21,0.3)] font-mono">
                    R {trueCost.toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setShowItemized(!showItemized)}
                className="w-full mt-8 bg-white/5 hover:bg-white/10 py-4 rounded-xl text-sm font-bold text-gray-300 transition-colors flex items-center justify-center gap-2 border border-white/5"
              >
                {showItemized ? "Hide" : "Edit"} Itemized Bill of Materials
                <ChevronDown className={`w-4 h-4 transition-transform ${showItemized ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showItemized && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden mt-6"
                  >
                    <div className="bg-black/30 rounded-2xl p-4 md:p-6 border border-white/5">
                      <p className="text-xs text-gray-500 mb-4 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5" />
                        Remove items you already own. The total will update automatically.
                      </p>
                      <div className="grid md:grid-cols-2 gap-8">
                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold text-yellow-400 mb-4 uppercase tracking-widest border-b border-white/10 pb-2">
                            <PackageOpen className="w-4 h-4" /> Materials Breakdown
                          </h4>
                          {activeMaterials.length === 0 ? (
                            <p className="text-xs text-gray-600 italic">All materials removed.</p>
                          ) : activeMaterials.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm mb-3">
                              <span className="text-gray-300 flex-1 leading-tight pr-2">{item.item}</span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono font-bold text-white">R {item.cost.toLocaleString()}</span>
                                <button onClick={() => removeMaterial(idx)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div>
                          <h4 className="flex items-center gap-2 text-xs font-bold text-yellow-400 mb-4 uppercase tracking-widest border-b border-white/10 pb-2">
                            <Wrench className="w-4 h-4" /> Tools Required
                          </h4>
                          {activeTools.length === 0 ? (
                            <p className="text-xs text-gray-600 italic">All tools removed.</p>
                          ) : activeTools.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm mb-3">
                              <span className="text-gray-300 flex-1 leading-tight pr-2">{item.item}</span>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-mono font-bold text-white">R {item.cost.toLocaleString()}</span>
                                <button onClick={() => removeTool(idx)} className="text-gray-600 hover:text-red-500 p-1 transition-colors">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={handleWhatsAppShare}
                disabled={!estimate?.shareId}
                className="w-full bg-[#25D366] hover:bg-[#20bd5a] disabled:bg-gray-800 disabled:opacity-50 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20"
              >
                <Share2 className="w-5 h-5" /> Share via WhatsApp
              </button>
              
              <a
                href="/"
                className="w-full bg-white/5 hover:bg-white/10 text-white font-bold py-4 rounded-xl border border-white/10 transition-all flex items-center justify-center"
              >
                Back to Directory
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
