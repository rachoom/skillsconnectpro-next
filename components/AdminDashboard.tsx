import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { ShieldCheck, UserX, Send } from 'lucide-react';

// --- INTERFACES ---
interface Application {
  id: number;
  created_at: string;
  first_name: string; 
  last_name: string;  
  trade: string;
  location: string;
  phone: string;
  bio: string;
  institution?: string; 
  status: 'pending' | 'approved' | 'rejected';
}

// ⚡ NEW: Interface for our live, unclaimed artisans
interface LiveArtisan {
  id: number;
  first_name: string;
  last_name: string;
  category: string;
  phone: string;
  is_claimed: boolean;
}

interface Suggestion {
  id: number;
  created_at: string;
  suggestion_text: string;
  contact_number?: string;
}

interface Review {
  id: number;
  created_at: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  artisan_id: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface AdminDashboardProps {
  onBack: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onBack }) => {
  // --- STATE ---
  const [applications, setApplications] = useState<Application[]>([]);
  const [unclaimedArtisans, setUnclaimedArtisans] = useState<LiveArtisan[]>([]); // ⚡ NEW: State for claims
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  // Edit Mode State (for Applications)
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Application>>({});

  // --- 1. FETCH ALL DATA ---
  const fetchData = async () => {
    try {
      setLoading(true);

      // A. Fetch Pending Applications
      const { data: apps, error: appError } = await supabase
        .from('artisan_applications')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      if (appError) console.error("App Fetch Error:", appError);
      setApplications(apps || []);

      // ⚡ B. Fetch Live Artisans who haven't claimed their profile yet
      const { data: unclaimed, error: unclaimedError } = await supabase
        .from('artisans')
        .select('id, first_name, last_name, category, phone, is_claimed')
        .eq('is_claimed', false)
        .order('id', { ascending: false });
      
      if (unclaimedError) console.error("Unclaimed Fetch Error:", unclaimedError);
      setUnclaimedArtisans(unclaimed || []);

      // C. Fetch Service Suggestions
      const { data: suggs, error: suggError } = await supabase
        .from('service_suggestions')
        .select('*')
        .order('created_at', { ascending: false });

      if (suggError) console.error("Suggestion Fetch Error:", suggError);
      setSuggestions(suggs || []);

      // D. Fetch Pending Reviews
      const { data: revs, error: revError } = await supabase
        .from('artisan_reviews')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (revError) console.error("Review Fetch Error:", revError);
      setReviews(revs || []);

    } catch (err) {
      console.error('Unexpected error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- 2. HELPERS ---
  const openWhatsApp = (phone: string, firstName?: string) => {
    if (!phone) return;
    const digits = phone.replace(/\D/g, '');
    let formatted = digits;
    if (formatted.startsWith('0')) {
      formatted = '27' + formatted.substring(1);
    }
    const message = firstName 
        ? `Hi ${firstName}, contacting you regarding your Skills Connect application.`
        : `Hi, thank you for your suggestion on Skills Connect.`;
        
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // ⚡ NEW: THE VIP LINK GENERATOR
  const sendVipInvite = (phone: string, firstName: string, artisanId: number) => {
    if (!phone) {
        alert("This artisan doesn't have a phone number on file!");
        return;
    }
    
    // Format the number for SA WhatsApp
    const digits = phone.replace(/\D/g, '');
    let formatted = digits;
    if (formatted.startsWith('0')) formatted = '27' + formatted.substring(1);

    // Automatically grab your website's URL
    const baseUrl = window.location.origin;
    const claimLink = `${baseUrl}/?invite=${artisanId}`;

    const message = `Hi ${firstName}! We've pre-built a VIP profile for your business on SkillsConnectPro to help you get more clients in the East Rand. Click here to claim your free profile and upload your photos: ${claimLink}`;
        
    const url = `https://wa.me/${formatted}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // --- 3. APPLICATION LOGIC ---
  const startEditing = (app: Application) => {
    setEditingId(app.id);
    setEditForm(app);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;
    try {
      const { error } = await supabase
        .from('artisan_applications')
        .update({
          first_name: editForm.first_name, 
          last_name: editForm.last_name,   
          trade: editForm.trade,
          location: editForm.location,
          phone: editForm.phone,
          bio: editForm.bio,
          institution: editForm.institution
        })
        .eq('id', editingId);

      if (error) throw error;

      setApplications(prev => prev.map(app => 
        app.id === editingId ? { ...app, ...editForm } as Application : app
      ));
      setEditingId(null);
    } catch (err) {
      alert("Failed to save changes.");
    }
  };

  const handleApproveApp = async (app: Application) => {
    const fullName = `${app.first_name} ${app.last_name}`;
    if (!confirm(`Approve ${fullName}? This will add them to the live site.`)) return;
    
    setProcessingId(app.id);
    try {
      
      // 1. Insert into live artisans table
      const { error: insertError } = await supabase.from('artisans').insert([{
        first_name: app.first_name,
        last_name: app.last_name,
        category: app.trade,
        location: app.location,
        phone: app.phone,
        bio: app.bio,
        verified: true,
        rating: 5.0, 
        is_claimed: false, // ⚡ THE LEGAL FLAG: Pushes to DB as unclaimed!
        image_url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400' 
      }]);

      if (insertError) throw insertError;

      // 2. Mark application as approved
      await supabase.from('artisan_applications').update({ status: 'approved' }).eq('id', app.id);
      
      // ⚡ 3. Refresh Data so they immediately appear in the VIP Claim list
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.code === '23505' ? "Phone number already exists!" : "Approval failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectApp = async (id: number) => {
    if (!confirm('Reject this application?')) return;
    setProcessingId(id);
    try {
      await supabase.from('artisan_applications').update({ status: 'rejected' }).eq('id', id);
      setApplications(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  // --- 4. REVIEW LOGIC ---
  const approveReview = async (id: number) => {
    try {
      await supabase.from('artisan_reviews').update({ status: 'approved' }).eq('id', id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error approving review:", err);
    }
  };

  const deleteReview = async (id: number) => {
    if(!confirm("Delete this review permanently?")) return;
    try {
      await supabase.from('artisan_reviews').delete().eq('id', id);
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error("Error deleting review:", err);
    }
  };

  // --- 5. SUGGESTION LOGIC ---
  const deleteSuggestion = async (id: number) => {
    if(!confirm("Delete this message?")) return;
    try {
      await supabase.from('service_suggestions').delete().eq('id', id);
      setSuggestions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      console.error("Error deleting suggestion:", err);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 animate-fade-in">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
        <div>
          <button onClick={onBack} className="text-gray-400 hover:text-brand-yellow text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 transition-colors">← Back to Home</button>
          <h1 className="text-4xl font-black tracking-tight text-white">Admin <span className="text-brand-yellow">Dashboard</span></h1>
          <p className="text-gray-400 mt-2">Overview of network activity and pending items.</p>
        </div>
        <button onClick={fetchData} className="px-6 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold uppercase tracking-widest transition-all">Refresh Data</button>
      </div>

      <div className="max-w-7xl mx-auto space-y-16">
        
        {/* --- SECTION 1: PENDING APPLICATIONS --- */}
        <section>
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Pending Applications</h2>
                <span className="bg-brand-yellow text-black text-xs font-black px-2 py-1 rounded-full">{applications.length}</span>
            </div>

            {loading ? <div className="text-center py-20 text-gray-500 animate-pulse">Loading Gateway...</div> : 
             applications.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-gray-500 text-sm">No pending applications to review.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {applications.map((app) => (
                        <div key={app.id} className={`bg-zinc-900 border ${editingId === app.id ? 'border-brand-yellow' : 'border-white/10'} rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 items-start transition-all shadow-xl`}>
                            <div className="flex-1 space-y-4 w-full">
                                {editingId === app.id ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">First Name</label>
                                            <input value={editForm.first_name || ''} onChange={e => setEditForm({...editForm, first_name: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-lg text-white font-bold focus:border-brand-yellow outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Last Name</label>
                                            <input value={editForm.last_name || ''} onChange={e => setEditForm({...editForm, last_name: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-lg text-white font-bold focus:border-brand-yellow outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Trade</label>
                                            <input value={editForm.trade || ''} onChange={e => setEditForm({...editForm, trade: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-lg text-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Location</label>
                                            <input value={editForm.location || ''} onChange={e => setEditForm({...editForm, location: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-lg text-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Phone</label>
                                            <input value={editForm.phone || ''} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-lg text-white outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Institution (Optional)</label>
                                            <input value={editForm.institution || ''} onChange={e => setEditForm({...editForm, institution: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-lg text-white outline-none" />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="text-[10px] uppercase text-gray-500 font-bold">Bio</label>
                                            <textarea value={editForm.bio || ''} onChange={e => setEditForm({...editForm, bio: e.target.value})} className="w-full bg-black border border-white/20 p-3 rounded-lg text-white outline-none h-24" />
                                        </div>
                                        <div className="md:col-span-2 flex gap-3 mt-2">
                                            <button onClick={saveEdit} className="bg-brand-yellow text-black px-6 py-2 rounded-lg font-bold text-sm hover:bg-white transition-colors">Save Changes</button>
                                            <button onClick={cancelEditing} className="text-gray-400 px-6 py-2 rounded-lg font-bold text-sm hover:text-white transition-colors">Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="bg-brand-yellow text-black text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">{app.trade}</span>
                                            <span className="text-gray-500 text-xs font-mono uppercase">{new Date(app.created_at).toLocaleDateString()}</span>
                                            
                                            {app.institution && (
                                              <span className="bg-zinc-800 text-gray-300 text-[10px] font-bold px-2 py-1 rounded border border-white/10">{app.institution}</span>
                                            )}

                                            {/* ⚡ NEW: Visual Auto-Scanned Badge */}
                                            {app.bio?.includes('Auto-extracted') && (
                                                <span className="flex items-center gap-1.5 text-zinc-400 bg-zinc-800/80 px-2 py-1 rounded border border-zinc-700 text-[10px] font-bold uppercase tracking-widest">
                                                    <UserX size={12} strokeWidth={2.5} className="text-zinc-500" />
                                                    Auto-Scanned
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">{app.first_name} {app.last_name}</h3>
                                            <div className="flex items-center gap-4 text-gray-400 text-sm mt-1">
                                                <span className="flex items-center gap-1">📍 {app.location}</span>
                                                <span className="flex items-center gap-1">📞 {app.phone}</span>
                                            </div>
                                        </div>
                                        <div className="bg-black/40 p-4 rounded-xl border border-white/5 relative group">
                                            <p className="text-gray-300 text-sm leading-relaxed italic">"{app.bio}"</p>
                                        </div>
                                        <button onClick={() => startEditing(app)} className="text-brand-yellow text-xs font-bold uppercase tracking-widest hover:text-white transition-colors flex items-center gap-1">Edit Application</button>
                                    </>
                                )}
                            </div>
                            {editingId !== app.id && (
                                <div className="flex flex-col gap-3 w-full md:w-auto shrink-0 min-w-[160px]">
                                    <button onClick={() => openWhatsApp(app.phone, app.first_name)} className="w-full px-6 py-3 bg-[#128C7E] hover:bg-[#075E54] text-white font-bold rounded-xl uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 transition-all">Message</button>
                                    <button onClick={() => handleApproveApp(app)} disabled={processingId === app.id} className="w-full px-6 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl uppercase tracking-wider text-[10px] shadow-lg shadow-green-900/20 transition-all disabled:opacity-50">{processingId === app.id ? 'Processing...' : 'Approve'}</button>
                                    <button onClick={() => handleRejectApp(app.id)} disabled={processingId === app.id} className="w-full px-6 py-3 bg-zinc-800 hover:bg-red-900/50 hover:text-red-200 text-gray-400 font-bold rounded-xl uppercase tracking-wider text-[10px] border border-white/5 transition-all disabled:opacity-50">Reject</button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* ⚡ NEW SECTION: VIP CLAIM INVITES */}
        <section className="pt-8 border-t border-white/10">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Awaiting VIP Claim</h2>
                <span className="bg-[#128C7E] text-white text-xs font-black px-2 py-1 rounded-full">{unclaimedArtisans.length}</span>
            </div>
            {unclaimedArtisans.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-gray-500 text-sm">All live profiles have been claimed!</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {unclaimedArtisans.map((artisan) => (
                        <div key={artisan.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-5 hover:border-[#128C7E]/50 transition-all flex flex-col justify-between group">
                            <div className="mb-6">
                                <div className="flex items-center gap-2 mb-2">
                                  <UserX size={14} className="text-zinc-500" />
                                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Auto-Scanned Profile</span>
                                </div>
                                <h3 className="text-lg font-bold text-white leading-tight">{artisan.first_name} {artisan.last_name}</h3>
                                <p className="text-brand-yellow text-xs font-bold uppercase tracking-widest mt-1">{artisan.category}</p>
                                <p className="text-gray-400 text-sm mt-3 flex items-center gap-2">📞 {artisan.phone}</p>
                            </div>
                            
                            <button 
                                onClick={() => sendVipInvite(artisan.phone, artisan.first_name, artisan.id)}
                                className="w-full py-3 bg-[#128C7E]/10 hover:bg-[#128C7E] text-[#128C7E] hover:text-white border border-[#128C7E]/30 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                            >
                                <Send size={16} /> Send VIP Invite
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* --- SECTION 2: PENDING REVIEWS --- */}
        <section className="pt-8 border-t border-white/10">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Pending Reviews</h2>
                <span className="bg-orange-500 text-black text-xs font-black px-2 py-1 rounded-full">{reviews.length}</span>
            </div>
            {reviews.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-gray-500 text-sm">No new reviews to moderate.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reviews.map(r => (
                        <div key={r.id} className="bg-zinc-900 border border-white/5 p-6 rounded-2xl">
                            <div className="flex justify-between mb-2">
                                <span className="font-bold text-white">{r.reviewer_name}</span>
                                <span className="text-brand-yellow">{'★'.repeat(r.rating)}</span>
                            </div>
                            <p className="text-gray-400 text-sm mb-4 italic">"{r.comment}"</p>
                            <div className="flex gap-2">
                                <button onClick={() => approveReview(r.id)} className="flex-1 py-2 bg-green-600 rounded-lg font-bold text-xs uppercase tracking-wider text-white hover:bg-green-500">Approve</button>
                                <button onClick={() => deleteReview(r.id)} className="flex-1 py-2 bg-red-900/50 text-red-200 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-red-900">Delete</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </section>

        {/* --- SECTION 3: SERVICE SUGGESTIONS INBOX --- */}
        <section className="pt-8 border-t border-white/10">
            <div className="flex items-center gap-4 mb-8">
                <h2 className="text-2xl font-bold text-white">Service Suggestions Inbox</h2>
                <span className="bg-zinc-800 text-white text-xs font-black px-2 py-1 rounded-full">{suggestions.length}</span>
            </div>

            {suggestions.length === 0 ? (
                <div className="text-center py-12 bg-zinc-900/50 rounded-3xl border border-white/5 border-dashed">
                    <p className="text-gray-500 text-sm">No messages in inbox.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {suggestions.map((msg) => (
                        <div key={msg.id} className="bg-zinc-900 border border-white/5 rounded-2xl p-6 hover:border-brand-yellow/30 transition-all">
                            <div className="flex justify-between items-start mb-4">
                                <span className="text-brand-yellow text-[10px] font-black uppercase tracking-widest">{new Date(msg.created_at).toLocaleDateString()}</span>
                                <button onClick={() => deleteSuggestion(msg.id)} className="text-gray-600 hover:text-red-500 transition-colors font-bold" title="Delete Message">✕</button>
                            </div>
                            <p className="text-white font-medium mb-6 leading-relaxed">"{msg.suggestion_text}"</p>
                            {msg.contact_number ? (
                                <button onClick={() => openWhatsApp(msg.contact_number!)} className="w-full py-3 border border-white/10 rounded-xl text-gray-400 hover:text-white hover:border-brand-yellow text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                    <span>📞 {msg.contact_number}</span>
                                </button>
                            ) : (
                                <div className="w-full py-3 border border-white/5 rounded-xl text-gray-600 text-xs font-bold uppercase tracking-widest text-center cursor-not-allowed">
                                    No Contact Info
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>

      </div>
    </div>
  );
};