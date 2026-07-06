'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const TRADE_FILTERS = ['All', 'Plumbing', 'Roofing', 'Electrical', 'General'] as const;
type TradeFilter = (typeof TRADE_FILTERS)[number];

type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  trade: TradeFilter;
  image?: string;
};

type BlogListingClientProps = {
  posts: BlogPost[];
  initialTrade: TradeFilter;
};

type TransitionPhase = 'idle' | 'out' | 'in';

const TRADE_IMAGE_FALLBACKS: Record<TradeFilter, string[]> = {
  All: ['/1.png', '/2.png', '/og-image.jpg'],
  Plumbing: ['/Cards/Plumbing.png', '/Cards/Plumbing1.png', '/artisans/plumbe.png'],
  Roofing: ['/artisans/build.png', '/Cards/builders.png', '/artisans/garden.png'],
  Electrical: ['/Cards/Electrician.png', '/artisans/elect.png', '/artisans/electrician male.jpeg'],
  General: ['/Cards/General Artisan.png', '/Cards/builders.png', '/og-image.jpg'],
};

function normalizeTrade(value?: string): TradeFilter {
  if (!value) return 'All';
  const match = TRADE_FILTERS.find((filter) => filter.toLowerCase() === value.toLowerCase());
  return match ?? 'All';
}

function toTradeParam(filter: TradeFilter): string {
  return filter === 'All' ? '' : `?trade=${encodeURIComponent(filter)}`;
}

function filterPostsByTrade(posts: BlogPost[], trade: TradeFilter): BlogPost[] {
  if (trade === 'All') return posts;
  return posts.filter((post) => post.trade === trade);
}

function getResolvedImagePath(image?: string): string | undefined {
  if (!image) return undefined;
  if (image.startsWith('http://') || image.startsWith('https://')) return encodeURI(image);
  if (image.startsWith('/')) return encodeURI(image);
  return encodeURI(`/${image}`);
}

function getFeaturedFallback(post: BlogPost, index: number): string {
  const options = TRADE_IMAGE_FALLBACKS[post.trade] ?? TRADE_IMAGE_FALLBACKS.General;
  return options[index % options.length];
}

export default function BlogListingClient({ posts, initialTrade }: BlogListingClientProps) {
  const [selectedTrade, setSelectedTrade] = useState<TradeFilter>(normalizeTrade(initialTrade));
  const [visiblePosts, setVisiblePosts] = useState<BlogPost[]>(() =>
    filterPostsByTrade(posts, normalizeTrade(initialTrade))
  );
  const [phase, setPhase] = useState<TransitionPhase>('in');
  const swapTimeoutRef = useRef<number | null>(null);
  const settleTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    setVisiblePosts(filterPostsByTrade(posts, selectedTrade));
  }, [posts, selectedTrade]);

  useEffect(() => {
    return () => {
      if (swapTimeoutRef.current !== null) {
        window.clearTimeout(swapTimeoutRef.current);
      }
      if (settleTimeoutRef.current !== null) {
        window.clearTimeout(settleTimeoutRef.current);
      }
    };
  }, []);

  const onSelectTrade = (filter: TradeFilter) => {
    if (filter === selectedTrade) return;

    setSelectedTrade(filter);

    // Keep the URL in sync without triggering a new route fetch.
    const nextUrl = `/blog${toTradeParam(filter)}`;
    window.history.replaceState({}, '', nextUrl);

    if (swapTimeoutRef.current !== null) {
      window.clearTimeout(swapTimeoutRef.current);
    }
    if (settleTimeoutRef.current !== null) {
      window.clearTimeout(settleTimeoutRef.current);
    }

    setPhase('out');
    swapTimeoutRef.current = window.setTimeout(() => {
      setVisiblePosts(filterPostsByTrade(posts, filter));
      setPhase('in');

      settleTimeoutRef.current = window.setTimeout(() => {
        setPhase('idle');
      }, 450);
    }, 170);
  };

  return (
    <>
      <div className="mb-14 text-center md:text-left">
        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-lg">
          Skills <span className="text-brand-yellow italic">Connect Pro</span> Blog
        </h1>
        <p className="text-gray-400 font-medium text-lg md:text-xl max-w-2xl">
          Expert advice, safety guides, and tips for finding the best local talent nationwide.
        </p>

        <div className="mt-8 -mx-1 flex items-center gap-3 overflow-x-auto pb-2 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TRADE_FILTERS.map((filter) => {
            const isActive = selectedTrade === filter;
            return (
              <button
                type="button"
                key={filter}
                onClick={() => onSelectTrade(filter)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'border-brand-yellow/80 bg-brand-yellow/20 text-brand-yellow shadow-[0_0_20px_rgba(250,204,21,0.2)]'
                    : 'border-white/10 bg-white/5 text-gray-300 hover:border-brand-yellow/40 hover:text-brand-yellow'
                }`}
                aria-pressed={isActive}
              >
                {filter}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`grid gap-8 ${phase === 'out' ? 'blog-grid-out' : ''}`}>
        {visiblePosts.map((post, index) => {
          const featuredImage = getResolvedImagePath(post.image) ?? getFeaturedFallback(post, index);

          return (
            <Link
            href={`/blog/${post.slug}`}
            key={post.slug}
            className={`group block rounded-[2.5rem] border border-white/10 transition-all duration-500 hover:scale-[1.02] hover:border-brand-yellow/50 hover:shadow-[0_36px_70px_-16px_rgba(0,0,0,0.9)] relative overflow-hidden bg-white/5 backdrop-blur-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)] ${
              phase === 'in' ? 'blog-card-in' : ''
            }`}
            style={
              phase === 'in'
                ? {
                    animationDelay: `${index * 70}ms`,
                  }
                : undefined
            }
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>

            <div className="relative z-10">
              <div
                className="h-44 sm:h-52 w-full border-b border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent"
                style={{
                  backgroundImage: `linear-gradient(180deg, rgba(7,5,3,0.12), rgba(7,5,3,0.62)), url(${featuredImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              >
                <div className="flex h-full items-end justify-end p-4">
                  {!post.image && (
                    <span className="rounded-full border border-white/25 bg-black/45 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-white/80">
                      Auto Artwork
                    </span>
                  )}
                </div>
              </div>

              <div className="p-8 md:p-10">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-brand-yellow text-[10px] font-black uppercase tracking-[0.2em]">
                    Published • {post.date}
                  </span>
                  <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-gray-300">
                    {post.trade}
                  </span>
                </div>

                <h2 className="text-2xl md:text-4xl font-black text-white mb-4 group-hover:text-brand-yellow transition-colors leading-tight">
                  {post.title}
                </h2>

                <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base line-clamp-2">
                  {post.excerpt ??
                    'Practical guidance to help you solve the issue safely and choose the right local professional.'}
                </p>

                <span className="inline-flex items-center text-emerald-500 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                  Read Article &rarr;
                </span>
              </div>
            </div>
            </Link>
          );
        })}

        {visiblePosts.length === 0 && (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 text-center text-gray-300">
            No articles found for <span className="text-brand-yellow font-bold">{selectedTrade}</span> yet.
          </div>
        )}
      </div>
    </>
  );
}
