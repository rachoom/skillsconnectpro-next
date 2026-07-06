import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import Image from 'next/image';

type BusinessRecord = {
  id: number;
  brand_name?: string;
  title?: string;
  subtitle?: string;
  category?: string;
  image_url?: string;
  location?: string;
  service_area?: string;
  contact_phone?: string;
  contact_email?: string;
  link_url?: string;
};

interface BusinessDetailProps {
  id: number;
  onBack: () => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ id, onBack }) => {
  const [business, setBusiness] = useState<BusinessRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getBusinessData = async () => {
      const { data } = await supabase
        .from('advertisements')
        .select('*')
        .eq('id', id)
        .single();
      
      setBusiness(data);
      setLoading(false);
    };
    getBusinessData();
  }, [id]);

  // Helper function for Call button
  const handleCall = (phone: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    window.location.href = `tel:${cleanPhone}`;
  };

  // Helper function for WhatsApp button
  const handleWhatsApp = (phone: string, businessName: string) => {
    if (!phone) return;
    
    let waNumber = phone.replace(/\D/g, '');
    
    // Convert South African format: 072... to 2772...
    if (waNumber.startsWith('0')) {
      waNumber = '27' + waNumber.substring(1);
    }
    
    const message = encodeURIComponent(
      `Hi ${businessName}, I found you on Skills Connect and would like to inquire about your services.`
    );
    
    window.open(`https://wa.me/${waNumber}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="scp-shell min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-bold">Loading business profile...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="scp-shell min-h-screen flex items-center justify-center px-4">
        <div className="text-center scp-card p-8 max-w-lg">
          <p className="text-white text-2xl font-bold mb-4">Business profile not found</p>
          <p className="scp-text-body mb-7">This listing may have been removed or the link is outdated.</p>
          <button 
            onClick={onBack}
            className="scp-btn scp-btn-primary"
            aria-label="Back to home"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scp-shell min-h-screen text-white py-10 md:py-14 px-4 sm:px-6 animate-fade-in">
      <div className="scp-container max-w-5xl">
        <button 
          onClick={onBack}
          className="mb-7 flex items-center gap-2 text-gray-300 hover:text-brand-yellow transition-all duration-300 group"
          aria-label="Back to listings"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:-translate-x-1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          <span className="font-bold uppercase text-xs tracking-[0.18em]">Back to Listings</span>
        </button>

        <article className="scp-card overflow-hidden">
          <div className="absolute inset-0 bg-hex-pattern-dark opacity-25 pointer-events-none" aria-hidden="true"></div>

          <div className="relative h-72 sm:h-80 md:h-[26rem] overflow-hidden">
          <Image
            src={business.image_url || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1200'}
            alt={business.brand_name || business.title || 'Business profile image'}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 80rem"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent"></div>
          
          <div className="absolute top-5 right-5 bg-brand-yellow text-black px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.18em] shadow-lg">
            Elite Partner
          </div>
          </div>
        
          <div className="relative p-6 sm:p-8 md:p-10 space-y-8">
          
            <header>
              <p className="scp-kicker mb-2">Verified Artisan Profile</p>
              <h1 className="scp-heading-lg text-white">
                {business.brand_name || business.title}
              </h1>
              <p className="text-brand-yellow text-xs font-bold uppercase tracking-[0.18em] mt-3">
                {business.category || 'General Services'} Specialist
              </p>
              <p className="scp-text-lg mt-4 max-w-3xl">
                {business.subtitle || 'Professional services in the Far East Rand area with reliable communication and quality workmanship.'}
              </p>
            </header>

            <div className="scp-soft-divider"></div>

            <section>
              <h2 className="text-lg font-black text-brand-yellow mb-5 uppercase tracking-[0.16em] flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Contact Details
              </h2>
            
              <div className="grid gap-4 sm:grid-cols-2">
                {business.contact_phone && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center gap-3 text-gray-100">
                    <span className="text-2xl" aria-hidden="true">📞</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Phone</p>
                    <p className="text-lg font-bold">{business.contact_phone}</p>
                  </div>
                </div>
              )}

              {business.contact_email && (
                <div className="rounded-2xl border border-white/10 bg-black/30 p-4 flex items-center gap-3 text-gray-100">
                  <span className="text-2xl" aria-hidden="true">✉️</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Email</p>
                    <p className="text-lg font-bold">{business.contact_email}</p>
                  </div>
                </div>
              )}

                {(business.location || business.service_area) && (
                  <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-gray-100 sm:col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Service Area</p>
                    <p className="text-base font-semibold mt-1">{business.service_area || business.location}</p>
                  </div>
                )}
            </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-2">
              {business.contact_phone && (
                <button
                  onClick={() => handleCall(business.contact_phone!)}
                  className="scp-btn scp-btn-secondary !py-4 !text-[11px]"
                  aria-label={`Call ${business.brand_name || business.title}`}
                >
                  Call Now
                </button>
              )}

              {business.contact_phone && (
                <button
                  onClick={() => handleWhatsApp(business.contact_phone!, business.brand_name || business.title || 'this business')}
                  className="scp-btn !py-4 !text-[11px] text-white border border-emerald-700/40 bg-gradient-to-br from-[#128C7E] to-[#075E54] hover:brightness-105"
                  aria-label={`WhatsApp ${business.brand_name || business.title}`}
                >
                  WhatsApp
                </button>
              )}

              {business.link_url && (
                <button
                  onClick={() => window.open(business.link_url, '_blank')}
                  className="scp-btn scp-btn-primary !py-4 !text-[11px]"
                  aria-label="Open website"
                >
                  Website
                </button>
              )}
            </div>

            <aside className="bg-white/5 border border-white/10 rounded-xl p-5 text-center">
              <p className="text-xs text-gray-300 uppercase tracking-widest font-bold mb-2">
                Verified Partner
              </p>
              <p className="text-sm text-gray-200/85">
                This business is a verified partner of Skills Connect Pro, committed to quality service in the Far East Rand community.
              </p>
            </aside>
          </div>
        </article>
      </div>
    </div>
  );
};

export default BusinessDetail;