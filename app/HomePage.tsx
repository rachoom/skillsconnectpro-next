"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import HeroSection from '../components/HeroSection';
import { AdminDashboard } from '../components/AdminDashboard';
import { ClaimProfile } from '../components/ClaimProfile';
import { MarketingProfileCard } from '../components/MarketingProfileCard';
import BusinessDetail from '../components/BusinessDetail';

function HomePageContent() {
  const searchParams = useSearchParams();
  const [view, setView] = useState('home');
  const [activeId, setActiveId] = useState<number | null>(null);

  useEffect(() => {
    const adminKey = searchParams.get('admin_key');
    const inviteId = searchParams.get('invite');
    const profileId = searchParams.get('profile');
    const claimId = searchParams.get('claim');

    if (adminKey === process.env.NEXT_PUBLIC_ADMIN_KEY) {
      setView('admin');
    } else if (inviteId) {
      setView('claim');
    } else if (profileId && !isNaN(Number(profileId))) {
      setView('profile');
      setActiveId(Number(profileId));
    } else if (claimId) {
      setView('marketing');
      setActiveId(Number(claimId));
    } else {
      setView('home');
    }
  }, [searchParams]);

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    setView('home');
  };

  switch (view) {
    case 'admin':
      return <AdminDashboard onBack={handleBack} />;
    case 'claim':
      return <ClaimProfile />;
    case 'marketing':
      return activeId ? <MarketingProfileCard artisanId={String(activeId)} /> : <HeroSection />;
    case 'profile':
      return activeId ? <BusinessDetail id={activeId} onBack={handleBack} /> : <HeroSection />;
    default:
      return <HeroSection />;
  }
}

export default function HomePage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomePageContent />
    </Suspense>
  );
}

const LoadingSpinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin"></div>
  </div>
);