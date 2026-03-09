import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface BusinessDetailProps {
  id: number;
  onBack: () => void;
}

const BusinessDetail: React.FC<BusinessDetailProps> = ({ id, onBack }) => {
  const [business, setBusiness] = useState<any>(null);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-brand-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-bold">Loading business details...</p>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-2xl font-bold mb-4">❌ Business not found</p>
          <button 
            onClick={onBack}
            className="bg-brand-yellow text-black px-6 py-3 rounded-xl font-bold hover:bg-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4 md:px-6 animate-fade-in">
      {/* Back Button */}
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-gray-400 hover:text-brand-yellow transition-colors group max-w-7xl mx-auto"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 transition-transform group-hover:-translate-x-1">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        <span className="font-bold uppercase text-sm tracking-widest">Back to Listings</span>
      </button>

      {/* Business Card */}
      <div className="max-w-4xl mx-auto border border-white/10 rounded-3xl overflow-hidden bg-zinc-900/50 shadow-2xl">
        
        {/* Hero Image */}
        <div className="relative h-80 md:h-96 overflow-hidden">
          <img 
            src={business.image_url || 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=1200'} 
            alt={business.brand_name} 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
          
          {/* Elite Badge */}
          <div className="absolute top-6 right-6 bg-brand-yellow text-black px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg">
            Elite Partner
          </div>
        </div>
        
        {/* Content Section */}
        <div className="p-8 md:p-12 space-y-8">
          
          {/* Business Name & Category */}
          <div>
            <h1 className="text-4xl md:text-5xl font-black mb-2 tracking-tight">
              {business.brand_name || business.title}
            </h1>
            <p className="text-brand-yellow text-sm font-bold uppercase tracking-widest">
              {business.category} Specialist
            </p>
            <p className="text-zinc-400 text-lg mt-4 leading-relaxed">
              {business.subtitle || 'Professional services in the Far East Rand area.'}
            </p>
          </div>

          {/* Divider */}
          <div className="h-px bg-white/10"></div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-black text-brand-yellow mb-6 uppercase tracking-widest flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
              </svg>
              Contact Details
            </h3>
            
            <div className="space-y-4">
              {/* Phone */}
              {business.contact_phone && (
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">📞</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Phone</p>
                    <p className="text-lg font-bold">{business.contact_phone}</p>
                  </div>
                </div>
              )}

              {/* Email */}
              {business.contact_email && (
                <div className="flex items-center gap-3 text-gray-300">
                  <span className="text-2xl">✉️</span>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-bold">Email</p>
                    <p className="text-lg font-bold">{business.contact_email}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons - Elegant Design */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6">
            
            {/* Call Button - Sophisticated Dark Green */}
            {business.contact_phone && (
              <button
                onClick={() => handleCall(business.contact_phone)}
                className="group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-br from-[#0a4d3c] to-[#064e3b] hover:from-[#065f46] hover:to-[#047857] text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,95,70,0.4)] border border-emerald-800/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                <span className="relative z-10 uppercase tracking-widest text-sm">Call Now</span>
              </button>
            )}

            {/* WhatsApp Button - Rich Forest Green */}
            {business.contact_phone && (
              <button
                onClick={() => handleWhatsApp(business.contact_phone, business.brand_name || business.title)}
                className="group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-br from-[#128C7E] to-[#075E54] hover:from-[#1aa884] hover:to-[#0a7566] text-white font-bold py-5 px-6 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(18,140,126,0.4)] border border-teal-700/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="relative z-10 uppercase tracking-widest text-sm">WhatsApp</span>
              </button>
            )}

            {/* Website Button - Premium Gold */}
            {business.link_url && (
              <button
                onClick={() => window.open(business.link_url, '_blank')}
                className="group relative overflow-hidden flex items-center justify-center gap-3 bg-gradient-to-br from-brand-yellow to-yellow-500 hover:from-yellow-300 hover:to-brand-yellow text-black font-bold py-5 px-6 rounded-2xl transition-all duration-300 hover:shadow-[0_0_30px_rgba(250,204,21,0.4)] border border-yellow-600/30"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5 relative z-10 group-hover:scale-110 transition-transform">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                <span className="relative z-10 uppercase tracking-widest text-sm">Website</span>
              </button>
            )}
          </div>

          {/* Trust Badge */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-2">
              ✓ Verified Partner
            </p>
            <p className="text-sm text-gray-300">
              This business is a verified partner of Skills Connect, committed to quality service in the Far East Rand community.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetail;