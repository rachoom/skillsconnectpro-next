import { promises as fs } from 'fs';
import path from 'path';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { Facebook, MessageCircle } from 'lucide-react';

export const dynamicParams = false;

export async function generateStaticParams() {
  const postsDirectory = path.join(process.cwd(), 'posts');
  try {
    const filenames = await fs.readdir(postsDirectory);
    return filenames.map((name) => ({
      slug: name.replace(/\.md$/, ''),
    }));
  } catch (error) {
    console.error("Build Error:", error);
    return [];
  }
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const slug = resolvedParams.slug;
  const postsDirectory = path.join(process.cwd(), 'posts');
  const fullPath = path.join(postsDirectory, `${slug}.md`);
  
  // Absolute URL for sharing
  const baseUrl = "https://www.skillsconnectpro.co.za";
  const shareUrl = `${baseUrl}/blog/${slug}`;

  try {
    const fileContents = await fs.readFile(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Safely convert variables to strings to keep TypeScript 100% happy
    const safeTitle = String(data.title || '');
    const safeDate = String(data.date || '');
    const safeContent = String(content || '');

    return (
      <div className="min-h-screen bg-[#0c090a] w-full pb-32 relative">
        <div className="max-w-3xl mx-auto py-20 px-6">
          
          <Link 
            href="/blog" 
            className="inline-block mb-10 text-sm font-bold text-brand-yellow hover:text-yellow-400 transition-colors uppercase tracking-widest"
          >
            {"\u2190"} Back to Articles
          </Link>

          <header className="mb-12">
            <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
              {safeTitle}
            </h1>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-800 pb-6">
               <p className="text-gray-400 font-medium">Published on {safeDate}</p>
               
               {/* --- DESKTOP SHARE BAR --- */}
               <div className="flex items-center gap-4">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Share Article:</span>
                  <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-brand-yellow hover:text-black rounded-full transition-all border border-white/10 group">
                    <Facebook size={16} className="text-brand-yellow group-hover:text-black" />
                  </a>
                  <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(safeTitle + " " + shareUrl)}`} target="_blank" rel="noreferrer" className="p-2 bg-white/5 hover:bg-emerald-500 hover:text-white rounded-full transition-all border border-white/10 group">
                    <MessageCircle size={16} className="text-brand-yellow group-hover:text-white" />
                  </a>
               </div>
            </div>
          </header>
          
          <div className="prose prose-lg md:prose-xl prose-invert max-w-none prose-p:text-gray-300 prose-a:text-brand-yellow hover:prose-a:text-yellow-400 prose-headings:text-white prose-headings:font-bold prose-headings:tracking-tight prose-strong:text-white prose-ul:text-gray-300 prose-li:text-gray-300">
            <ReactMarkdown>{safeContent}</ReactMarkdown>
          </div>

          {/* --- FLOATING MOBILE SHARE BAR --- */}
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 md:hidden">
            <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex items-center justify-between shadow-2xl">
              <div className="px-4">
                <p className="text-[10px] font-black text-brand-yellow uppercase tracking-widest">Help others find a pro</p>
              </div>
              <div className="flex gap-2">
                <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(safeTitle + " " + shareUrl)}`} target="_blank" rel="noreferrer" className="bg-emerald-500 hover:bg-emerald-600 transition-colors text-white p-3 rounded-full shadow-lg">
                  <MessageCircle size={20} className="text-white" />
                </a>
                <a href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`} target="_blank" rel="noreferrer" className="bg-blue-600 hover:bg-blue-700 transition-colors text-white p-3 rounded-full shadow-lg">
                  <Facebook size={20} className="text-white" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="min-h-screen bg-[#0c090a] w-full flex items-center justify-center">
        <div className="max-w-3xl mx-auto py-20 px-4 text-center">
          <h1 className="text-4xl font-bold text-brand-yellow mb-4">Post Not Found</h1>
          <p className="text-gray-400">We couldn't find the article you're looking for.</p>
          <Link href="/blog" className="mt-8 inline-block text-brand-yellow underline">Return to Blog</Link>
        </div>
      </div>
    );
  }
}