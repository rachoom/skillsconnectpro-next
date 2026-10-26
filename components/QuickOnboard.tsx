'use client';

import React, { useRef, useState } from 'react';
import { extractBusinessCard } from '../services/aiOnboardingService';
import {
  AlertTriangle, ArrowRight, BadgeCheck, Camera, CheckCircle2, FileImage, FileText,
  ImagePlus, Images, Loader2, PencilLine, ScanText, ShieldCheck, Sparkles, Trash2, Upload
} from 'lucide-react';

type Step = 'idle' | 'scanning' | 'review' | 'submitting' | 'success' | 'error';
type DetailKey = 'name' | 'trade' | 'phone' | 'location';
type Details = Record<DetailKey, string>;
type WorkPhoto = { file: File; preview: string };

const EMPTY_DETAILS: Details = { name: '', trade: '', phone: '', location: '' };
const MAX_PHOTOS = 3;

function compressImage(file: File, maxBytes = 850 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the photo.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Could not open this photo. Try JPEG or PNG.'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (!width || !height) { reject(new Error('Invalid image.')); return; }
        const shrinkTo = 1800;
        if (width > shrinkTo || height > shrinkTo) {
          const ratio = Math.min(shrinkTo / width, shrinkTo / height);
          width = Math.max(1, Math.round(width * ratio));
          height = Math.max(1, Math.round(height * ratio));
        }
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) { reject(new Error('Your browser cannot resize images.')); return; }
        for (let scale = 1; scale >= 0.3; scale *= 0.78) {
          canvas.width = Math.max(1, Math.round(width * scale));
          canvas.height = Math.max(1, Math.round(height * scale));
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          for (const quality of [0.8, 0.65, 0.5, 0.35]) {
            const output = canvas.toDataURL('image/jpeg', quality).split(',')[1];
            if (Math.ceil(output.length * 0.75) <= maxBytes) { resolve(output); return; }
          }
        }
        reject(new Error('This photo could not be reduced to the upload size. Please try another.'));
      };
      img.src = String(reader.result ?? '');
    };
    reader.readAsDataURL(file);
  });
}

function fromBase64(base64: string, name: string): File {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return new File([bytes], name, { type: 'image/jpeg' });
}

export const QuickOnboard: React.FC<{ isDarkMode: boolean; onComplete: () => void }> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('idle');
  const [details, setDetails] = useState<Details>(EMPTY_DETAILS);
  const [photos, setPhotos] = useState<WorkPhoto[]>([]);
  const [photoConsent, setPhotoConsent] = useState(false);
  const [error, setError] = useState('');
  const [addingPhotos, setAddingPhotos] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const cardFileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const workCameraRef = useRef<HTMLInputElement>(null);

  const handleCard = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 12 * 1024 * 1024) {
      setError('Choose a JPEG, PNG or WebP image smaller than 12 MB.');
      return;
    }
    setStep('scanning');
    setError('');
    try {
      const compressed = await compressImage(file, 900 * 1024);
      const result = await extractBusinessCard(compressed, 'image/jpeg');
      if (!result.success) {
        throw new Error(result.reason === 'invalid_image_type'
          ? 'We could not identify business details. Try a clearer card, flyer, or handwritten note.'
          : 'The AI scan was unsuccessful. Please try another picture.');
      }
      setDetails({
        name: result.name ?? '', trade: result.trade ?? '',
        phone: result.phone ?? '', location: result.location ?? '',
      });
      setStep('review');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not scan the photo.');
      setStep('error');
    }
  };

  const addWorkPhotos = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = '';
    if (!selected.length) return;
    if (photos.length + selected.length > MAX_PHOTOS) {
      setError('You can add up to 3 work photos. Remove a photo first to replace it.');
      return;
    }
    setAddingPhotos(true);
    setError('');
    const added: WorkPhoto[] = [];
    try {
      for (const file of selected) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 12 * 1024 * 1024) {
          throw new Error('Work photos must be JPEG, PNG or WebP and smaller than 12 MB.');
        }
        const processed = fromBase64(await compressImage(file), 'work-photo.jpg');
        added.push({ file: processed, preview: URL.createObjectURL(processed) });
      }
      setPhotos(previous => [...previous, ...added]);
    } catch (caught) {
      added.forEach(item => URL.revokeObjectURL(item.preview));
      setError(caught instanceof Error ? caught.message : 'Could not add that work photo.');
    } finally {
      setAddingPhotos(false);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(previous => previous.filter((photo, photoIndex) => {
      if (photoIndex === index) URL.revokeObjectURL(photo.preview);
      return photoIndex !== index;
    }));
  };

  const submitApplication = async () => {
    setError('');
    if (Object.values(details).some(value => !value.trim())) {
      setError('Please confirm your name, trade, phone number and service area.');
      return;
    }
    if (photos.length && !photoConsent) {
      setError('Please confirm you have permission to share the work photos.');
      return;
    }
    setStep('submitting');
    try {
      const form = new FormData();
      Object.entries(details).forEach(([key, value]) => form.append(key, value.trim()));
      photos.forEach(({ file }, index) => form.append('workPhotos', file, 'completed-job-' + (index + 1) + '.jpg'));
      const params = new URLSearchParams(window.location.search);
      const store = params.get('store') ?? '';
      const source = params.get('source') ?? '';
      const referralSource = source === 'hardware' && /^[a-zA-Z0-9_-]{1,30}$/.test(store)
        ? 'hardware:' + store : 'join:direct';
      form.set('referralSource', referralSource);
      form.set('photoConsent', photoConsent ? 'true' : 'false');
      const response = await fetch('/api/onboarding/apply', { method: 'POST', body: form });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(payload.error || 'Could not send your application.');
      photos.forEach(photo => URL.revokeObjectURL(photo.preview));
      setPhotos([]);
      setStep('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to submit. Try again.');
      setStep('review');
    }
  };

  return (
    <div id="provider-camera-assistant" className="scroll-mt-3 px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="rounded-[1.6rem] border border-white/10 bg-[#14291f] p-5 shadow-inner shadow-black/10 sm:p-7">
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-yellow-400/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-amber-300">
            <Sparkles size={15} /> AI-assisted registration
          </span>
          <span className="text-[10px] font-semibold text-emerald-100/55">Mobile-friendly</span>
        </div>

        {(step === 'idle' || step === 'error') && (
          <div className="mt-6">
            <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Join with <span className="text-amber-300">one photo.</span></h2>
            <p className="mt-3 max-w-md text-sm leading-6 text-emerald-50/70">
              Take a picture of a business card, flyer, or even a handwritten note with your name,
              trade, phone number and area. AI fills in your details; you review them before sending.
            </p>
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-1 rounded-2xl border border-amber-300/20 bg-[#0d2017] px-3 py-5 sm:gap-2">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e7a8] text-[#113123]"><FileText size={26} /></div>
                <p className="mt-2 text-[10px] font-bold text-white/85">Your note</p>
              </div>
              <ArrowRight size={18} className="text-amber-300" />
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2b5941] text-amber-300"><ScanText size={26} /></div>
                <p className="mt-2 text-[10px] font-bold text-white/85">AI scan</p>
              </div>
              <ArrowRight size={18} className="text-amber-300" />
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e7a8] text-[#113123]"><Images size={26} /></div>
                <p className="mt-2 text-[10px] font-bold text-white/85">Your work</p>
              </div>
            </div>
            {step === 'error' && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">
                <AlertTriangle size={18} className="shrink-0" /> {error}
              </p>
            )}
            <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleCard} className="hidden" aria-label="Take a photo of business details" />
            <input ref={cardFileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleCard} className="hidden" aria-label="Upload a picture of business details" />
            <div className="mt-6 space-y-3">
              <button type="button" onClick={() => cameraRef.current?.click()}
                className="flex min-h-16 w-full items-center justify-center gap-3 rounded-2xl bg-[#ffd32a] px-4 py-4 text-sm font-black uppercase tracking-[0.06em] text-[#12291c] shadow-lg shadow-amber-500/15 hover:bg-[#ffe37a]">
                <Camera size={23} /> Take a photo <ArrowRight size={18} />
              </button>
              <button type="button" onClick={() => cardFileRef.current?.click()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/5 p-3 text-sm font-bold text-white hover:bg-white/10">
                <Upload size={18} /> Upload an existing photo
              </button>
            </div>
            <p className="mt-4 text-center text-[11px] leading-5 text-emerald-100/50">No long forms. Your application is reviewed before activation.</p>
          </div>
        )}

        {step === 'scanning' && (
          <div className="flex flex-col items-center py-20 text-center" role="status">
            <div className="relative mb-6 rounded-3xl bg-amber-300/10 p-6"><ScanText size={55} className="text-amber-300" /><Loader2 size={22} className="absolute -right-2 -top-2 animate-spin text-amber-300" /></div>
            <h3 className="text-2xl font-black">Reading your details…</h3>
            <p className="mt-2 text-sm text-emerald-100/60">We&apos;re preparing your editable application.</p>
          </div>
        )}

        {(step === 'review' || step === 'submitting') && (
          <div className="mt-6">
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-amber-300/15 p-3 text-amber-300"><PencilLine size={25} /></span>
              <div><h2 className="text-2xl font-black tracking-tight">Almost there!</h2><p className="text-xs text-emerald-100/60">Step 2 of 2 · Check and complete</p></div>
            </div>
            <p className="mt-4 text-sm leading-6 text-emerald-50/75">AI filled in what it could find. Make sure these details are correct before submitting.</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {([
                ['name', 'Your name'],
                ['trade', 'Trade / service'],
                ['phone', 'Phone / WhatsApp'],
                ['location', 'Area you serve'],
              ] as [DetailKey, string][]).map(([key, label]) => (
                <label key={key} className="block">
                  <span className="mb-1.5 block text-xs font-bold text-emerald-100/80">{label} *</span>
                  <input value={details[key]} disabled={step === 'submitting'} onChange={event => setDetails(previous => ({ ...previous, [key]: event.target.value }))}
                    autoComplete={key === 'name' ? 'name' : key === 'phone' ? 'tel' : 'off'}
                    className="min-h-12 w-full rounded-xl border border-amber-200/20 bg-white/10 px-3 text-sm text-white placeholder:text-white/40 focus:border-amber-300" />
                </label>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-amber-300/20 bg-amber-300/5 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-amber-300/15 p-2 text-amber-200"><ImagePlus size={25} /></div>
                <div>
                  <h3 className="text-base font-black">Show us your work <span className="text-xs font-semibold text-amber-200/75">(optional)</span></h3>
                  <p className="mt-1 text-xs leading-5 text-white/65">Add up to 3 pictures of jobs you&apos;ve completed. This helps us review your application without contacting you for photos.</p>
                </div>
              </div>
              <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={addWorkPhotos} className="hidden" aria-label="Choose work photos" />
              <input ref={workCameraRef} type="file" accept="image/*" capture="environment" onChange={addWorkPhotos} className="hidden" aria-label="Photograph completed work" />
              {photos.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {photos.map((photo, index) => (
                    <div key={photo.preview} className="relative aspect-square overflow-hidden rounded-xl border border-white/20 bg-black/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.preview} alt={'Completed work photo ' + (index + 1)} className="h-full w-full object-cover" />
                      <button type="button" aria-label={'Remove work photo ' + (index + 1)} onClick={() => removePhoto(index)} disabled={step === 'submitting'} className="absolute right-1 top-1 rounded-lg bg-black/80 p-1.5 text-white hover:bg-red-800"><Trash2 size={16} /></button>
                    </div>
                  ))}
                </div>
              )}
              {photos.length < MAX_PHOTOS && (
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <button type="button" disabled={addingPhotos || step === 'submitting'} onClick={() => workCameraRef.current?.click()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 p-3 text-xs font-bold hover:bg-white/15 disabled:opacity-50"><Camera size={19} /> Take work photo</button>
                  <button type="button" disabled={addingPhotos || step === 'submitting'} onClick={() => photoRef.current?.click()} className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 p-3 text-xs font-bold hover:bg-white/15 disabled:opacity-50"><FileImage size={19} /> Choose gallery photos</button>
                </div>
              )}
              <p className="mt-3 text-[11px] text-emerald-100/55">{addingPhotos ? 'Preparing images…' : photos.length + ' of 3 photos added · JPEG, PNG or WebP'}</p>
              {photos.length > 0 && (
                <label className="mt-4 flex cursor-pointer items-start gap-3 text-xs leading-5 text-white/75">
                  <input type="checkbox" checked={photoConsent} disabled={step === 'submitting'} onChange={e => setPhotoConsent(e.target.checked)} className="mt-1 h-4 w-4 accent-amber-300" />
                  <span>I own these images or have permission to share them with Skills Connect Pro for reviewing my application.</span>
                </label>
              )}
            </div>

            {error && (
              <p role="alert" className="mt-4 flex items-start gap-2 rounded-xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100"><AlertTriangle size={17} className="shrink-0" /> {error}</p>
            )}
            <button type="button" onClick={submitApplication} disabled={step === 'submitting' || addingPhotos}
              className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#ffd32a] px-4 py-4 text-sm font-black uppercase tracking-[0.04em] text-[#12291c] hover:bg-[#ffe37a] disabled:cursor-wait disabled:opacity-60">
              {step === 'submitting' ? <><Loader2 className="animate-spin" size={20} /> Sending application…</> : <>Submit my application <ArrowRight size={19} /></>}
            </button>
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-[11px] leading-5 text-emerald-50/50"><ShieldCheck size={16} /> Work photos are kept private during application review.</p>
          </div>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center py-12 text-center" role="status">
            <span className="rounded-full bg-emerald-400/15 p-5 text-emerald-300"><CheckCircle2 size={52} /></span>
            <h2 className="mt-5 text-2xl font-black">Application received!</h2>
            <p className="mt-3 max-w-xs text-sm leading-6 text-emerald-100/70">Thank you. Your details and any work photos were saved for review. We&apos;ll contact you if we need anything else.</p>
            <p className="mt-3 text-xs text-amber-200/85">Approval and job opportunities are not guaranteed.</p>
            <button onClick={onComplete} className="mt-7 rounded-xl border border-amber-300/30 px-6 py-3 text-sm font-bold text-white hover:bg-white/10">Back to home</button>
          </div>
        )}
      </div>
    </div>
  );
};
