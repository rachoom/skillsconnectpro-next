"use client";
import React, { useState, useRef } from 'react';
import Link from 'next/link';
import { Camera, X, Loader2, Hammer, Image as ImageIcon, Trash2, Check, Mic } from 'lucide-react';
import { jsPDF } from 'jspdf';

type QaPair = {
  question: string;
  answer: string;
};

type MaterialItem = {
  name: string;
  quantity: string;
  unitCost: number;
  total: number;
};

type ClarifyingQuestion = {
  question: string;
  options: string[];
};

type EstimateResult = {
  materials: number;
  tools: number;
  laborHours: number;
  laborTotal: number;
  trueCost: number;
  materialsList: MaterialItem[];
  laborNotes?: string;
  recommendedService: string;
  estimateType: 'standardized' | 'refined';
  clarifyingQuestions: ClarifyingQuestion[];
};

const fallbackOptionsForQuestion = (question: string): string[] => {
  const normalized = question.toLowerCase();
  if (/(size|dimension|height|width|square metre|square meter|area)/.test(normalized)) {
    return ['Small area (up to 10 m²)', 'Medium area (10–25 m²)', 'Large area (25–50 m²)', 'Not sure yet'];
  }
  if (/(indoor|outdoor|surface|condition)/.test(normalized)) {
    return ['Indoors — good condition', 'Indoors — cracks or peeling', 'Outdoors — good condition', 'Outdoors — weathered or damp'];
  }
  if (/(damp|water|moisture|patch|sand)/.test(normalized)) {
    return ['No, the surface is dry', 'Minor repairs are needed', 'Yes, there is damp or major damage', 'Not sure'];
  }
  return ['Yes', 'No', 'Not sure'];
};

const inferServiceFromText = (text: string): string => {
  const lower = text.toLowerCase();
  if (/(leak|pipe|geyser|drain|toilet|plumb)/.test(lower)) return 'Plumber';
  if (/(socket|db|wiring|electric|power|light)/.test(lower)) return 'Electrician';
  if (/(paint|wall coat|primer)/.test(lower)) return 'Painter';
  if (/(tile|grout)/.test(lower)) return 'Tiler';
  if (/(clean|stain|mold|mould)/.test(lower)) return 'Cleaner';
  if (/(roof|brick|cement|plaster|build|door|window)/.test(lower)) return 'Builder';
  return 'General Contractor';
};

export default function DIYvsProCalculator() {
  const [input, setInput] = useState('');
  const [timeValue, setTimeValue] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [clarifyingAnswers, setClarifyingAnswers] = useState<Record<number, string>>({});
  const [showAdvancedRate, setShowAdvancedRate] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
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

  const handleVoiceInput = () => {
    const SpeechRecognitionApi = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionApi) {
      alert('Voice input is not available in this browser. You can still type your project description.');
      return;
    }

    const recognition = new SpeechRecognitionApi();
    recognition.lang = 'en-ZA';
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) setInput((current) => `${current}${current ? ' ' : ''}${transcript}`);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  };

  const fetchEstimate = async (promptText: string, qaHistory: QaPair[] = []) => {
    setLoading(true);
    
    try {
      const res = await fetch('/api/estimate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, image: image, hourlyRate: timeValue, qaHistory })
      });
      
      const textData = await res.text();
      let data;
      try { data = JSON.parse(textData); } 
      catch (err) { throw new Error(textData ? `Server Error: ${textData.substring(0,40)}...` : "Empty response."); }

      if (!res.ok) throw new Error(data.error || "Failed to connect to the API.");
      
      let parsedObj: any = {
        materials: [],
        materialsTotal: 0,
        toolsNeeded: 0,
        laborHours: 4,
        laborNotes: '',
        recommendedService: '',
        estimateType: 'standardized',
        clarifyingQuestions: []
      };
      if (data.estimate) {
        try {
          const b = String.fromCharCode(96, 96, 96);
          const cleanString = data.estimate.replace(new RegExp(b + 'json|' + b, 'gi'), '').trim();
          const tempParsed = JSON.parse(cleanString);
          if (tempParsed && typeof tempParsed === 'object') parsedObj = { ...parsedObj, ...tempParsed };
        } catch(e) {}
      }

      const normalizedMaterials: MaterialItem[] = Array.isArray(parsedObj.materials)
        ? parsedObj.materials
            .map((item: any) => ({
              name: String(item?.name || '').trim(),
              quantity: String(item?.quantity || '1').trim(),
              unitCost: Number(item?.unitCost) || 0,
              total: Number(item?.total) || 0
            }))
            .filter((item: MaterialItem) => item.name)
        : [];

      const rate = parseInt(timeValue) || 150;
      const laborTotal = (parsedObj.laborHours || 4) * rate;
      const listTotal = normalizedMaterials.reduce((sum, item) => sum + item.total, 0);
      const materials = parsedObj.materialsTotal || listTotal || 0;
      const tools = parsedObj.toolsNeeded || 0;

      const fallbackMaterials = materials > 0
        ? [{ name: 'Estimated materials (general)', quantity: '1 lot', unitCost: materials, total: materials }]
        : [];
      const materialsList = normalizedMaterials.length > 0 ? normalizedMaterials : fallbackMaterials;

      const clarifyingQuestions: ClarifyingQuestion[] = Array.isArray(parsedObj.clarifyingQuestions)
        ? parsedObj.clarifyingQuestions
            .map((rawQuestion: any) => {
              const question = typeof rawQuestion === 'string'
                ? rawQuestion.trim()
                : String(rawQuestion?.question || '').trim();
              const options = Array.isArray(rawQuestion?.options)
                ? rawQuestion.options.map((option: any) => String(option || '').trim()).filter(Boolean).slice(0, 5)
                : [];
              return question ? { question, options: options.length >= 2 ? options : fallbackOptionsForQuestion(question) } : null;
            })
            .filter((question: ClarifyingQuestion | null): question is ClarifyingQuestion => Boolean(question))
            .slice(0, 4)
        : [];

      const recommendedService = String(parsedObj.recommendedService || '').trim() || inferServiceFromText(promptText);
      const estimateType = parsedObj.estimateType === 'refined' ? 'refined' : 'standardized';
      
      setResult({
        materials,
        tools,
        laborHours: parsedObj.laborHours || 4,
        laborTotal,
        trueCost: materials + tools + laborTotal,
        materialsList,
        laborNotes: typeof parsedObj.laborNotes === 'string' ? parsedObj.laborNotes : '',
        recommendedService,
        estimateType,
        clarifyingQuestions
      });
      setClarifyingAnswers({});
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message || "Something went wrong"}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!input.trim()) return alert('Please describe your project first!');
    setResult(null);
    await fetchEstimate(input.trim());
  };

  const handleRefineEstimate = async () => {
    if (!result || result.clarifyingQuestions.length === 0) return;

    const qaHistory: QaPair[] = result.clarifyingQuestions
      .map((question, idx) => ({ question: question.question, answer: (clarifyingAnswers[idx] || '').trim() }))
      .filter((pair) => pair.answer.length > 0);

    if (qaHistory.length === 0) {
      alert('Please answer at least one clarifying question.');
      return;
    }

    const extraContext = qaHistory.map((pair) => `${pair.question} ${pair.answer}`).join('. ');
    const promptText = `${input.trim()}. Additional details: ${extraContext}`;
    await fetchEstimate(promptText, qaHistory);
  };

  const removeMaterial = (materialIndex: number) => {
    setResult((current) => {
      if (!current) return current;

      const materialsList = current.materialsList.filter((_, index) => index !== materialIndex);
      const materials = materialsList.reduce((sum, item) => sum + item.total, 0);

      return {
        ...current,
        materials,
        materialsList,
        trueCost: materials + current.tools + current.laborTotal,
      };
    });
  };

  const handleDownloadPdf = () => {
    if (!result) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    let y = 18;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Skills Connect Pro - Project Estimate', margin, y);
    y += 8;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, margin, y);
    y += 6;

    const promptLines = doc.splitTextToSize(`Project: ${input}`, pageWidth - margin * 2);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 5 + 3;

    doc.setFont('helvetica', 'bold');
    doc.text('Itemized Materials', margin, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    result.materialsList.forEach((item, idx) => {
      const line = `${idx + 1}. ${item.name} (${item.quantity}) - R ${item.unitCost.toLocaleString()} each`; 
      const lineTotal = `R ${item.total.toLocaleString()}`;
      const wrapped = doc.splitTextToSize(line, pageWidth - margin * 2 - 35);
      doc.text(wrapped, margin, y);
      doc.text(lineTotal, pageWidth - margin, y, { align: 'right' });
      y += wrapped.length * 5 + 2;

      if (y > 268) {
        doc.addPage();
        y = 18;
      }
    });

    y += 4;
    doc.setLineWidth(0.2);
    doc.line(margin, y, pageWidth - margin, y);
    y += 8;

    doc.setFont('helvetica', 'bold');
    doc.text(`Materials Total: R ${result.materials.toLocaleString()}`, margin, y);
    y += 7;
    doc.text(`Tools Needed: R ${result.tools.toLocaleString()}`, margin, y);
    y += 7;
    doc.text(`Labor: ${result.laborHours}h @ R${timeValue}/hr = R ${result.laborTotal.toLocaleString()}`, margin, y);
    y += 9;
    doc.setFontSize(12);
    doc.text(`True Project Cost: R ${result.trueCost.toLocaleString()}`, margin, y);

    if (result.laborNotes) {
      y += 9;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const notes = doc.splitTextToSize(`Labor note: ${result.laborNotes}`, pageWidth - margin * 2);
      doc.text(notes, margin, y);
    }

    doc.save('skills-connect-project-estimate.pdf');
  };

  return (
    <div className="w-full max-w-2xl mx-auto mt-8 mb-8 relative isolate overflow-hidden rounded-[2.25rem] border border-brand-yellow/20 shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[url('/calculator-planning-desk.jpg')] bg-cover bg-left sm:bg-center bg-no-repeat scale-105"
      ></div>
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-black/35 via-[#090704]/58 to-black/85"></div>
      <div aria-hidden="true" className="absolute top-0 left-1/4 w-64 h-64 bg-brand-yellow/15 blur-[100px] rounded-full pointer-events-none"></div>
      <div aria-hidden="true" className="absolute bottom-0 right-1/4 w-64 h-64 bg-brand-yellow/10 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="relative z-10 m-2 sm:m-3 p-6 sm:p-8 bg-[#080705]/58 backdrop-blur-2xl border border-white/15 rounded-[1.8rem] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_16px_40px_rgba(0,0,0,0.36)]">
        <div className="text-center mb-8">
          <span className="text-brand-yellow text-xs font-bold tracking-[0.2em] uppercase drop-shadow-md">Skills Connect Pro</span>
          <h2 className="text-3xl font-black text-white mt-3">AI Project <span className="text-brand-yellow">Assistant</span></h2>
          <p className="text-[11px] text-gray-300 uppercase tracking-[0.22em] mt-3">Home Improvement Calculator</p>
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

              <button onClick={handleVoiceInput} className={`p-2 rounded-lg border transition-all ${isListening ? 'border-brand-yellow bg-brand-yellow/20 text-brand-yellow animate-pulse' : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:text-brand-yellow'}`} title={isListening ? 'Listening…' : 'Describe by voice'} aria-label={isListening ? 'Listening for your project description' : 'Describe your project by voice'}>
                <Mic size={20} />
              </button>
            </div>
            {image && (
              <div className="absolute bottom-3 right-3 relative inline-block">
                <img src={image} className="h-10 w-10 object-cover rounded-md border border-brand-yellow/50 shadow-lg" />
                <button onClick={() => setImage(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"><X size={12} /></button>
              </div>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <button
              type="button"
              onClick={() => setShowAdvancedRate((prev) => !prev)}
              className="w-full flex items-center justify-between text-left"
            >
              <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">Optional: Labor Rate</span>
              <span className="text-[10px] text-brand-yellow font-black uppercase tracking-wider">{showAdvancedRate ? 'Hide' : 'Set'}</span>
            </button>

            {showAdvancedRate && (
              <div className="mt-3">
                <label className="block text-[11px] text-gray-400 mb-2">Choose an optional hourly labor rate (R/hr)</label>
                <select
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  className="w-full p-3 bg-black/40 text-white rounded-xl border border-white/10 focus:border-brand-yellow/50 focus:ring-1 focus:ring-brand-yellow outline-none backdrop-blur-sm transition-all shadow-inner"
                >
                  <option value="">Use standard rate</option>
                  <option value="120">R120/hr</option>
                  <option value="150">R150/hr</option>
                  <option value="200">R200/hr</option>
                  <option value="300">R300/hr</option>
                </select>
              </div>
            )}
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
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs">
                <span className="text-brand-yellow font-semibold">Estimate mode:</span>{' '}
                {result.estimateType === 'refined' ? 'Refined with project details' : 'Standardized baseline estimate'}
              </div>

              {result.clarifyingQuestions.length > 0 && (
                <div className="rounded-2xl border border-brand-yellow/35 bg-gradient-to-br from-brand-yellow/10 via-black/35 to-black/50 p-4 sm:p-5 space-y-4 shadow-[0_12px_32px_rgba(0,0,0,0.28)]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-brand-yellow">Refine your estimate</p>
                    <p className="mt-1 text-sm text-gray-200">A few details will make this price more accurate before you review the materials.</p>
                  </div>
                  {result.clarifyingQuestions.map((question, idx) => (
                    <fieldset key={`${question.question}-${idx}`} className="space-y-2.5">
                      <legend className="block text-[11px] text-gray-100 font-semibold leading-relaxed">{question.question}</legend>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {question.options.map((option) => {
                          const selected = clarifyingAnswers[idx] === option;
                          return (
                            <button
                              key={option}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => setClarifyingAnswers((prev) => ({ ...prev, [idx]: option }))}
                              className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-left text-xs font-bold transition-all ${selected ? 'border-brand-yellow bg-brand-yellow text-black shadow-[0_0_16px_rgba(250,204,21,0.15)]' : 'border-white/10 bg-black/35 text-gray-200 hover:border-brand-yellow/60 hover:bg-white/5'}`}
                            >
                              <span>{option}</span>
                              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${selected ? 'border-black/60 bg-black/10' : 'border-current/60'}`}>
                                {selected && <Check size={13} strokeWidth={3} />}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </fieldset>
                  ))}
                  <button
                    onClick={handleRefineEstimate}
                    disabled={loading || result.clarifyingQuestions.some((_, index) => !clarifyingAnswers[index])}
                    className="w-full py-3.5 bg-brand-yellow text-black font-black uppercase tracking-[0.11em] rounded-xl hover:bg-white transition-all disabled:opacity-60 shadow-[0_0_20px_rgba(250,204,21,0.18)]"
                  >
                    {loading ? 'Updating estimate...' : 'Update estimate with my answers'}
                  </button>
                  <p className="text-center text-[11px] text-gray-400">{result.clarifyingQuestions.filter((_, index) => Boolean(clarifyingAnswers[index])).length} of {result.clarifyingQuestions.length} selections made</p>
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-black/30 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between mb-3">
                  <p className="text-xs font-bold uppercase tracking-widest text-brand-yellow">Itemized Materials</p>
                  <p className="text-[11px] text-gray-400">Already have something? Remove it and your total updates.</p>
                </div>
                <div className="space-y-2">
                  {result.materialsList.map((item, idx) => (
                    <div key={`${item.name}-${idx}`} className="grid grid-cols-[1fr_auto] gap-3 items-start border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
                      <div>
                        <p className="text-white font-semibold leading-tight">{item.name}</p>
                        <p className="text-[11px] text-gray-400">{item.quantity} • R {item.unitCost.toLocaleString()} each</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">R {item.total.toLocaleString()}</span>
                        <button
                          type="button"
                          onClick={() => removeMaterial(idx)}
                          aria-label={`Remove ${item.name} from estimate`}
                          title="Remove from estimate"
                          className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/5 text-gray-400 transition-colors hover:border-red-400/50 hover:bg-red-500/15 hover:text-red-300"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {result.materialsList.length === 0 && (
                    <p className="rounded-lg border border-dashed border-white/15 px-3 py-3 text-xs text-gray-400">No materials are included in this estimate. You can still connect with a pro for labour and tools.</p>
                  )}
                </div>
              </div>
              <div className="flex justify-between items-center"><span>Materials Total</span><span className="font-mono text-white bg-white/10 px-2 py-1 rounded">R {result.materials.toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span>Tools Needed</span><span className="font-mono text-white bg-white/10 px-2 py-1 rounded">R {result.tools.toLocaleString()}</span></div>
              <div className="flex justify-between items-center"><span>Labor ({result.laborHours}h {timeValue ? `@ R${timeValue}/hr` : '@ standard rate'})</span><span className="font-mono text-white bg-white/10 px-2 py-1 rounded">R {result.laborTotal.toLocaleString()}</span></div>
              {result.laborNotes && (
                <div className="rounded-lg border border-brand-yellow/20 bg-brand-yellow/5 px-3 py-2 text-xs text-gray-200">
                  <span className="text-brand-yellow font-semibold">Labor note:</span> {result.laborNotes}
                </div>
              )}

            </div>
            <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center">
              <span className="text-lg font-bold text-white">True Project Cost</span>
              <span className="text-4xl font-black text-brand-yellow tracking-tighter drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">R {result.trueCost.toLocaleString()}</span>
            </div>
            <Link
              href={`/?openSearch=1&service=${encodeURIComponent(result.recommendedService || inferServiceFromText(input))}`}
              className="mt-4 w-full py-3 bg-brand-yellow text-black font-black uppercase tracking-[0.12em] rounded-xl hover:bg-white transition-all text-center block"
            >
              Connect a Pro
            </Link>
            <button
              onClick={handleDownloadPdf}
              className="mt-6 w-full py-3 bg-white/5 text-brand-yellow font-black uppercase tracking-[0.12em] rounded-xl hover:bg-brand-yellow hover:text-black border border-brand-yellow/40 transition-all"
            >
              Download Estimate (PDF)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
