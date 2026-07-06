import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import BlogListingClient from './BlogListingClient';

type BlogFrontmatter = {
  title?: string;
  date?: string;
  excerpt?: string;
  tags?: string[];
  image?: string;
  coverImage?: string;
};

type BlogPost = {
  slug: string;
  title: string;
  date: string;
  excerpt?: string;
  trade: TradeFilter;
  image?: string;
};

type SearchParams = {
  trade?: string | string[];
};

const TRADE_FILTERS = ['All', 'Plumbing', 'Roofing', 'Electrical', 'General'] as const;
type TradeFilter = (typeof TRADE_FILTERS)[number];
const PAGE_BACKGROUND_IMAGE = '/og-image.jpg';
const PAGE_TEXTURE_IMAGE = '/texture.jpg';

function normalizeTrade(value?: string): TradeFilter {
  if (!value) return 'All';
  const match = TRADE_FILTERS.find((filter) => filter.toLowerCase() === value.toLowerCase());
  return match ?? 'All';
}

function inferTradeFromTags(tags: string[]): TradeFilter {
  const normalized = tags.map((tag) => tag.toLowerCase());
  if (normalized.some((tag) => tag.includes('plumb') || tag.includes('drain') || tag.includes('geyser'))) {
    return 'Plumbing';
  }
  if (normalized.some((tag) => tag.includes('roof') || tag.includes('waterproof'))) {
    return 'Roofing';
  }
  if (normalized.some((tag) => tag.includes('electric') || tag.includes('db board'))) {
    return 'Electrical';
  }
  return 'General';
}

export default async function BlogIndex({
  searchParams,
}: {
  searchParams?: Promise<SearchParams>;
}) {
  const postsDirectory = path.join(process.cwd(), 'posts');
  const resolvedSearchParams = (await searchParams) ?? {};
  const selectedTradeRaw = Array.isArray(resolvedSearchParams.trade)
    ? resolvedSearchParams.trade[0]
    : resolvedSearchParams.trade;
  const selectedTrade = normalizeTrade(selectedTradeRaw);
  
  // 1. Read everything in the folder
  const allItems = fs.readdirSync(postsDirectory);
  
  // 2. THE FIX: Only keep actual Markdown files, ignore folders!
  const fileNames = allItems.filter(item => item.endsWith('.md'));

  const posts: BlogPost[] = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    const frontmatter = data as BlogFrontmatter;
    const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
    const trade = inferTradeFromTags(tags);

    return {
      slug,
      title: frontmatter.title ?? 'Untitled Post',
      date: frontmatter.date ?? 'Unknown date',
      excerpt: frontmatter.excerpt,
      trade,
      image: frontmatter.coverImage ?? frontmatter.image,
    };
  });

  // Automatically sort posts by date (Newest first!)
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-[#070503]">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div 
        className="fixed inset-0 z-0 opacity-10 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage: `url('${PAGE_BACKGROUND_IMAGE}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      <div
        className="fixed inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `url('${PAGE_TEXTURE_IMAGE}')`,
          backgroundSize: '420px',
          backgroundRepeat: 'repeat',
          backgroundPosition: 'top left',
          mixBlendMode: 'soft-light',
        }}
      ></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#150f0a]/95 via-[#150f0a]/80 to-[#150f0a] pointer-events-none"></div>

      {/* Glowing Orb */}
      <div className="fixed top-1/4 -left-20 w-[500px] h-[500px] bg-brand-yellow/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-4xl mx-auto py-20 px-4 sm:px-6">
        <div className="relative isolate overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/20 shadow-[0_35px_80px_-20px_rgba(0,0,0,0.85)] backdrop-blur-2xl">
          <div className="absolute inset-0 bg-hex-pattern-dark opacity-50"></div>
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20 scale-110 blur-[2px]"
            style={{
              backgroundImage: `url('${PAGE_BACKGROUND_IMAGE}')`,
              backgroundPosition: 'center',
            }}
          ></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(250,204,21,0.16),transparent_42%),linear-gradient(135deg,rgba(7,5,3,0.88),rgba(7,5,3,0.62))]"></div>

          <div className="relative z-10 p-6 sm:p-8 md:p-10">
            {/* FROSTED GLASS BACK BUTTON */}
            <Link 
              href="/" 
              className="inline-flex items-center mb-12 text-xs font-black text-gray-400 hover:text-brand-yellow uppercase tracking-widest transition-colors group bg-black/40 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-lg w-fit"
            >
              <span className="mr-3 transition-transform group-hover:-translate-x-1">&larr;</span>
              Back to Home
            </Link>

            {/* HEADER */}
            <BlogListingClient posts={posts} initialTrade={selectedTrade} />
          </div>
        </div>
      </div>
    </div>
  );
}