import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

export default function BlogIndex() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  
  // 1. Read everything in the folder
  const allItems = fs.readdirSync(postsDirectory);
  
  // 2. THE FIX: Only keep actual Markdown files, ignore folders!
  const fileNames = allItems.filter(item => item.endsWith('.md'));

  const posts = fileNames.map((fileName) => {
    const slug = fileName.replace(/\.md$/, '');
    const fullPath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    return { slug, ...data };
  });

  // Automatically sort posts by date (Newest first!)
  posts.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center bg-[#070503]">
      
      {/* --- CINEMATIC BACKGROUND --- */}
      <div 
        className="fixed inset-0 z-0 opacity-10 mix-blend-luminosity pointer-events-none"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=2069&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#150f0a]/95 via-[#150f0a]/80 to-[#150f0a] pointer-events-none"></div>

      {/* Glowing Orb */}
      <div className="fixed top-1/4 -left-20 w-[500px] h-[500px] bg-brand-yellow/10 blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* --- MAIN CONTENT --- */}
      <div className="relative z-10 w-full max-w-4xl mx-auto py-20 px-6">

        {/* FROSTED GLASS BACK BUTTON */}
        <Link 
          href="/" 
          className="inline-flex items-center mb-12 text-xs font-black text-gray-400 hover:text-brand-yellow uppercase tracking-widest transition-colors group bg-black/40 backdrop-blur-md px-5 py-3 rounded-full border border-white/10 shadow-lg w-fit"
        >
          <span className="mr-3 transition-transform group-hover:-translate-x-1">&larr;</span>
          Back to Home
        </Link>

        {/* HEADER */}
        <div className="mb-14 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4 drop-shadow-lg">
            Skills<span className="text-brand-yellow italic">Connect</span> Blog
          </h1>
          <p className="text-gray-400 font-medium text-lg md:text-xl max-w-2xl">
            Expert advice, safety guides, and tips for finding the best local talent nationwide.
          </p>
        </div>

        {/* FROSTED GLASS CARDS */}
        <div className="grid gap-8">
          {posts.map((post: any) => (
            <Link 
              href={`/blog/${post.slug}`} 
              key={post.slug} 
              className="group block p-8 md:p-10 rounded-[2.5rem] border border-white/10 transition-all duration-500 hover:border-brand-yellow/50 relative overflow-hidden bg-white/5 backdrop-blur-2xl shadow-[0_30px_60px_-12px_rgba(0,0,0,0.8)]"
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>

              <div className="relative z-10">
                 <div className="text-brand-yellow text-[10px] font-black uppercase tracking-[0.2em] mb-4">
                   Published • {post.date}
                 </div>
                 <h2 className="text-2xl md:text-4xl font-black text-white mb-4 group-hover:text-brand-yellow transition-colors leading-tight">
                   {post.title}
                 </h2>
                 <p className="text-gray-400 mb-8 leading-relaxed text-sm md:text-base line-clamp-2">
                   {post.excerpt}
                 </p>
                 <span className="inline-flex items-center text-emerald-500 text-xs font-black uppercase tracking-widest group-hover:translate-x-2 transition-transform">
                   Read Article &rarr;
                 </span>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}