'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
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
  Images,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { ProviderBanner } from './ProviderBanner';
import styles from './ControlledProviderDirectory.module.css';

type Provider = {
  id: number;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  category: string | null;
  location: string | null;
  banner_url: string | null;
  image_url: string | null;
  verified: boolean | null;
  status: string | null;
  bio: string | null;
  marketplace_rating: number | null;
  marketplace_review_count: number | null;
  portfolio: string[] | null;
  portfolio_images: string[] | null;
  portfolio_urls: string[] | null;
  proof_of_work: string[] | null;
};

const displayName = (provider: Provider) =>
  provider.name?.trim()
  || `${provider.first_name || ''} ${provider.last_name || ''}`.trim()
  || 'Local service provider';

const providerGallery = (provider: Provider) => {
  const sources = [
    provider.portfolio_urls,
    provider.portfolio_images,
    provider.proof_of_work,
    provider.portfolio,
  ];

  return Array.from(new Set(
    sources
      .flatMap((items) => Array.isArray(items) ? items : [])
      .map((url) => typeof url === 'string' ? url.trim() : '')
      .filter((url) => Boolean(url) && url !== provider.image_url),
  )).slice(0, 12);
};

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
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All services');
  const [selected, setSelected] = useState<Provider | null>(null);

  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(18);
  const resultsStart = useRef<HTMLDivElement>(null);
  const searchText = search.trim();
  const filtered = Boolean(searchText || category !== 'All services');

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const params = new URLSearchParams({ page: String(page) });
        if (searchText) params.set('q', searchText);
        if (category !== 'All services') params.set('service', category);
        const response = await fetch(`/api/providers?${params}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Directory unavailable.');
        const data = await response.json();
        if (!Array.isArray(data.providers) || !Array.isArray(data.services)
            || !Number.isInteger(data.total) || !(data.pageSize > 0)) throw new Error('Invalid directory response.');
        if (controller.signal.aborted) return;
        const lastPage = Math.max(1, Math.ceil(data.total / data.pageSize));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }
        setProviders(data.providers);
        setCategories(data.services);
        setTotal(data.total);
        setPageSize(data.pageSize);
        setStatus('ready');
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    };
    setStatus('loading');
    const timer = window.setTimeout(load, searchText ? 180 : 0);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [page, category, searchText, attempt]);

  // Shared links can point to providers on any page of the directory.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('provider');
    if (!id || !/^\d+$/.test(id)) return;
    const controller = new AbortController();
    async function openProfile() {
      try {
        const response = await fetch(`/api/providers?id=${id}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Profile unavailable.');
        const { providers: matches } = await response.json();
        if (!controller.signal.aborted && matches?.[0]) setSelected(matches[0]);
      } catch {
        if (!controller.signal.aborted) setStatus('error');
      }
    }
    void openProfile();
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setStatus('loading');
    setAttempt((previous) => previous + 1);
  }

  function changePage(next: number) {
    setPage(next);
    resultsStart.current?.scrollIntoView({ block: 'start' });
    resultsStart.current?.focus({ preventScroll: true });
  }

  const selectedGallery = selected ? providerGallery(selected) : [];

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.backLink}><ArrowLeft size={18} /> Home</Link>
          <Link href="/get-help" className={styles.headerCta}>Let us find providers</Link>
        </div>
      </header>

      <section className={styles.intro}>
        <h1>Find a local provider</h1>
      </section>

      <section className={styles.searchPanel}>
        <label>
          <span>Search providers</span>
          <div className={styles.searchField}><Search size={18} /><input value={search} maxLength={300} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Name, trade or area" /></div>
        </label>
        <label>
          <span>Service</span>
          <div className={styles.searchField}><Filter size={18} /><select value={category} onChange={(event) => { setCategory(event.target.value); setPage(1); }}><option>All services</option>{categories.map((item) => <option key={item}>{item}</option>)}</select></div>
        </label>
      </section>

      <div ref={resultsStart} tabIndex={-1} className={styles.resultsStart} aria-label="Directory results" />
      {status === 'loading' ? (
        <div role="status" className={styles.loading}><Loader2 className="animate-spin" size={34} /><span>Loading provider profiles…</span></div>
      ) : status === 'error' ? (
        <section className={styles.empty}>
          <h2 role="alert">We couldn’t load the provider directory.</h2>
          <p>Try again, or describe your job so we can help you find a provider.</p>
          <div className={styles.recoveryActions}>
            <button type="button" onClick={retry}>Try again</button>
            <Link href="/get-help">Describe your job</Link>
          </div>
        </section>
      ) : (
        <section className={styles.resultsSection}>
          <div className={styles.resultsHeading}>
            <div>
              <span>Local provider profiles</span>
              <h2 aria-live="polite">{total} available to explore</h2>
            </div>
          </div>

          {providers.length === 0 ? (
            <div className={styles.empty}>
              <UserRound size={34} />
              <h3>{filtered ? 'No matching profiles' : 'No profiles available yet'}</h3>
              <p>{filtered ? 'Try another trade, name or area.' : 'Tell us what you need and we’ll help you find a provider.'}</p>
              <div className={styles.recoveryActions}>
                {filtered && (
                  <button type="button" onClick={() => { setSearch(''); setCategory('All services'); setPage(1); }}>Clear filters</button>
                )}
                <Link href="/get-help">Describe your job</Link>
              </div>
            </div>
          ) : (
            <div className={styles.grid}>
              {providers.map((provider) => {
                const name = displayName(provider);
                const rating = Number(provider.marketplace_rating || 0);
                const reviewCount = Number(provider.marketplace_review_count || 0);
                const galleryImages = providerGallery(provider);
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
                      {galleryImages.length > 0 && <span className={styles.workBadge}><Images size={14} /> {galleryImages.length} work photo{galleryImages.length === 1 ? '' : 's'}</span>}
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
          {total > pageSize && (
            <nav className={styles.pagination} aria-label="Provider directory pages">
              <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Previous</button>
              <span>Page {page} of {Math.ceil(total / pageSize)}</span>
              <button type="button" disabled={page >= Math.ceil(total / pageSize)} onClick={() => changePage(page + 1)}>Next</button>
            </nav>
          )}
        </section>
      )}

      {selected && (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setSelected(null)}>
          <section className={styles.modal} role="dialog" aria-modal="true" aria-label={`${displayName(selected)} profile`} onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.closeButton} onClick={() => setSelected(null)} aria-label="Close profile"><X size={22} /></button>
            <ProviderBanner url={selected.banner_url} />
            <div className={styles.modalBody}>
              <div className={styles.identityPanel}>
              {selected.image_url && <img src={selected.image_url} alt={displayName(selected)} width={72} height={72} className="relative -mt-10 mb-3 h-[72px] w-[72px] rounded-2xl border-2 border-white object-cover" />}
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
              </div>
              <div className={styles.about}>
                <span>About this provider</span>
                <p>{selected.bio?.trim() || 'This provider has not added a detailed marketplace introduction yet. You can still invite them to review a real project brief and decide whether they are available.'}</p>
              </div>
              {selectedGallery.length > 0 && (
                <section className={styles.workSection}>
                  <div className={styles.workHeading}>
                    <div>
                      <span>Proof of work</span>
                      <strong>Work shared by this provider</strong>
                    </div>
                    <small>{selectedGallery.length} photo{selectedGallery.length === 1 ? '' : 's'}</small>
                  </div>
                  <div className={styles.workGrid}>
                    {selectedGallery.map((url, index) => (
                      <div key={`${selected.id}-work-${index}`} className={styles.workImage}>
                        <Image
                          src={url}
                          alt={`${displayName(selected)} proof of work ${index + 1}`}
                          fill
                          sizes="(max-width: 640px) 50vw, 300px"
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
              <div className={styles.privacyNotice}><ShieldCheck size={19} /><p>Contact details are shared after the provider responds and you confirm the connection.</p></div>
              <Link href={providerHref(selected)} className={styles.modalCta}>Invite this provider to my job <ArrowRight size={18} /></Link>
            </div>
          </section>
        </div>
      )}
    </main>
  );
};
