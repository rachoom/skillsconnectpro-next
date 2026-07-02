"use client";

import React, { useState, useEffect } from 'react';
import { DownloadIcon } from './Icons';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export default function HeroSection() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = () => {
    installPrompt?.prompt();
  };

  return (
    <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-black">
      
      {/* 1. The Looping Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        poster="/hero-poster.webp" // Your extracted first frame
        className="absolute inset-0 w-full h-full object-cover opacity-70 mix-blend-luminosity" 
      >
        <source src="/download.mp4" type="video/mp4" />
        {/* Add an MP4 fallback here later if needed for older Safari versions */}
      </video>

      {/* 2. The "Frozen Glass" Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0"></div>

      {/* 3. Your Hero Content (Search, Text, Call to Action) */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full max-w-5xl px-4">
        
        {/* Example Content - Flat text to contrast with any 3D elements later */}
        <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight mb-6 text-center">
          Find the Right <span className="text-yellow-500">Pro</span> for the Job.
        </h1>
        
        {/* This is where your Google-style search overlay will go */}
        <div className="w-full h-20 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl mt-8">
            {/* Search inputs go here */}
        </div>

        {installPrompt && (
          <button
            onClick={handleInstallClick}
            className="fixed bottom-20 right-6 z-[90] h-16 w-16 bg-brand-yellow text-black rounded-full flex items-center justify-center shadow-2xl hover:scale-110 transition-transform group animate-fade-in"
            title="Install App"
          >
            <DownloadIcon />
          </button>
        )}
      </div>
    </section>
  );
}