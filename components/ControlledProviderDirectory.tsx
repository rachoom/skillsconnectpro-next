'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Filter,
  Loader2,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { supabase } from '../services/supabase';
import styles from './ControlledProviderDirectory.module.css';

type Provider = {
  id: number;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  category: string | null;
  location: string | null;
  image_url: string | null;
  verified: boolean | null;
  status: string | null;
  bio: string | null;
  marketplace_rating: number | null;
  marketplace_review_count: number | null;
};

const displayName = (provider: Provider) =>
  provider.name?.trim()
  || `${provider.first_name || ''} ${provider.last_name || ''}`.trim()
  || 'Local service provider';

const providerHref = (provider: Provider) => {
  const params = new URLSearchParams({
    providerId: String(provider.id),
    providerName: displayName(provider),
    service: provider.category || 'Home service',
  });
  return `/get-help?${params.toString()}`;
};

export const ControlledProviderDirectory = () => {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All services');
  const [selected, setSelected] = useState<Provider | null>(null);

  useEffect(() => {
    let active = true;

    const loadProviders = async () => {
      setLoading(true);
      const { data, error: queryError } = await supabase
        .from('artisans')
        .select('id, name, first_name, last_name, category, location, image_url, verified, status, bio, marketplace_rating, marketplace_review_count')
        .neq('status', 'inactive')
        .order('verified', { ascending: false })
        .order('marketplace_review_count', { ascending: false })
        .limit(120);

      if (!active) return;
      if (queryError) {
        setError('Provider profiles are temporarily unavailable. Please use the guided request instead.');
        setProviders([]);
      } else {
        setProviders((data || []) as Provider[]);
      }
      setLoading(false);
    };

    void loadProviders();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!providers.length) return;
    const requestedId = Number(new URLSearchParams(window.location.search).get('provider'));
    if (!Number.isInteger(requestedId)) return;
    const provider = providers.find((item) => item.id === requestedId);
    if (provider) setSelected(provider);
  }, [providers]);

  const categories = useMemo(() => {
    const values = providers
      .map((provider) => provider.category?.trim())
      .filter((value): value is string => Boolean(value));
    return ['All services', ...Array.from(new Set(values)).sort((a, b) => a.localeCompare(b))];
  }, [providers]);

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return providers.filter((provider) => {
      const matchesCategory = category === 'All services' || provider.category === category;
      const text = `${displayName(provider)} ${provider.category || ''} ${provider.location || ''}`.toLowerCase();
      return matchesCategory && (!query || text.includes(query));
    });
  }, [category, providers, search]);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={18} /> Home</Link>
          <Link href="/get-help" className={styles.headerCta}>Let us find providers</Link>
        </div>
      </header>

      <section className={styles.intro}>
        <div>
          <span>Controlled provider discovery</span>
          <h1>Browse profiles. Invite through Skills Connect Pro.</h1>
          <p>
            Explore local providers without exposing private contact details. When someone interests you,
            start a project request with that provider already marked as your preferred invitation.
          </p>
        </div>
        <div className={styles.privacyCard}>
          <ShieldCheck size={25} />
          <strong>Contact details stay protected</strong>
          <p>Phone, WhatsApp and email are released only after a provider responds and you confirm the connection.</p>
        </div>
      </section>

      <section className={styles.searchPanel}>
        <label>
          <span>Search providers</span>
          <div className={styles.searchField}><Search size={18} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Name, trade or area" /></div>
        </label>
        <label>
          <span>Service</span>
          <div className={styles.searchField}><Filter size={18} /><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
        </label>
      </section>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <div className={styles.loading}><Loader2 className="animate-spin" size={34} /><span>Loading provider profiles…</span></div>
      ) : (
        <section className={styles.resultsSection}>
          <div className={styles.resultsHeading}>
            <div>
              <span>Local provider profiles</span>
              <h2>{visible.length} available to explore</h2>
            </div>
            <p>Profiles are for discovery. Every invitation still enters the tracked marketplace workflow.</p>
          </div>

          {visible.length === 0 ? (
            <div className={styles.empty}>
              <UserRound size={34} />
              <h3>No matching profiles</h3>
              <p>Try a broader search or let Skills Connect Pro identify suitable providers from your job description.</p>
              <Link href="/get-help">Show us the job</Link>
            </div>
          ) : (
            <div className={styles.grid}>
              {visible.map((provider) => {
                const name = displayName(provider);
                const rating = Number(provider.marketplace_rating || 0);
                const reviewCount = Number(provider.marketplace_review_count || 0);
                return (
                  <article key={provider.id} className={styles.card}>
                    <button type="button" className={styles.imageButton} onClick={() => setSelected(provider)} aria-label={`View ${name} profile`}>
                      {provider.image_url ? (
                        <Image src={provider.image_url} alt={name} fill sizes="(max-width: 700px) 100vw, 33vw" />
                      ) : (
                        <div className={styles.imageFallback}><Wrench size={34} /></div>
                      )}
                      <div className={styles.imageShade} />
                      {provider.verified && <span className={styles.verifiedBadge}><CheckCircle2 size={15} /> Verified</span>}
                    </button>

                    <div className={styles.cardBody}>
                      <h3>{name}</h3>
                      <strong>{provider.category || 'Home services'}</strong>
                      <p><MapPin size={15} /> {provider.location || 'Service area not supplied'}</p>

                      <div className={styles.reputationRow}>
                        <span><Star size={16} /> {reviewCount > 0 ? rating.toFixed(1) : 'New provider'}</span>
                        <small>{reviewCount > 0 ? `${reviewCount} verified rating${reviewCount === 1 ? '' : 's'}` : 'Building marketplace history'}</small>
                      </div>

                      <div className={styles.cardActions}>
                        <button type="button" onClick={() => setSelected(provider)}>View profile</button>
                        <Link href={providerHref(provider)}>Invite to my job <ArrowRight size={16} /></Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {selected && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelected(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label={`${displayName(selected)} profile`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.closeButton} onClick={() => setSelected(null)} aria-label="Close profile"><X size={22} /></button>
            <div className={styles.modalImage}>
              {selected.image_url ? <Image src={selected.image_url} alt={displayName(selected)} fill sizes="100vw" /> : <div className={styles.imageFallback}><Wrench size={42} /></div>}
              <div className={styles.imageShade} />
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalTitleRow}>
                <div>
                  <span>{selected.category || 'Home services'}</span>
                  <h2>{displayName(selected)}</h2>
                </div>
                {selected.verified && <ShieldCheck size={27} />}
              </div>
              <p className={styles.location}><MapPin size={16} /> {selected.location || 'Service area not supplied'}</p>
              <div className={styles.modalReputation}>
                <Star size={19} />
                <strong>{Number(selected.marketplace_review_count || 0) > 0 ? Number(selected.marketplace_rating || 0).toFixed(1) : 'New provider'}</strong>
                <span>{Number(selected.marketplace_review_count || 0)} verified completed-job ratings</span>
              </div>
              <div className={styles.about}>
                <span>About this provider</span>
                <p>{selected.bio?.trim() || 'This provider has not added a detailed marketplace introduction yet. You can still invite them to review a real project brief and decide whether they are available.'}</p>
              </div>
              <div className={styles.privacyNotice}><ShieldCheck size={19} /><p>Private contact details are intentionally hidden. Invite this provider through a project request to preserve the interaction and job record.</p></div>
              <Link href={providerHref(selected)} className={styles.modalCta}>Invite this provider to my job <ArrowRight size={18} /></Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
