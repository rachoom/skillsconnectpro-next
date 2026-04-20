import { Metadata, ResolvingMetadata } from 'next';
import { supabase } from '../services/supabase';
import ClientWrapper from './ClientWrapper';

// Define the incoming URL parameters
type Props = {
  searchParams: { [key: string]: string | string[] | undefined }
};

// 🚀 THIS IS THE SEO MAGIC ENGINE
export async function generateMetadata(
  { searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  
  // Grab the ID from the URL
  const targetId = searchParams.claim || searchParams.profile;

  // 1. DYNAMIC METADATA (If an artisan link is shared)
  if (targetId && typeof targetId === 'string') {
    const { data } = await supabase
      .from('artisans')
      .select('first_name, last_name, category, location, image_url')
      .eq('id', targetId)
      .single();

    if (data) {
      const name = `${data.first_name} ${data.last_name || ''}`.trim();
      const title = `${name} | Verified ${data.category}`;
      const description = `View my professional portfolio on Skills ConnectPro. Serving clients in ${data.location || 'the East Rand'}.`;
      
      return {
        title: title,
        description: description,
        openGraph: {
          title: title,
          description: description,
          images: [{ url: data.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop' }],
          type: 'profile',
        },
        twitter: {
          card: 'summary_large_image',
          title: title,
          description: description,
          images: [data.image_url || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?q=80&w=1200&auto=format&fit=crop'],
        }
      };
    }
  }

  // 2. DEFAULT METADATA (If the main homepage is shared)
  return {
    title: 'Skills ConnectPro | The East Rand Specialist Network',
    description: 'Find and book verified plumbers, electricians, builders, and more in the East Rand. 100% free to search.',
    openGraph: {
      title: 'Skills ConnectPro | The East Rand Specialist Network',
      description: 'Connect with verified, top-tier artisans in your area instantly.',
      images: [{ url: '/artisans/hero-welder.jpg' }], // Uses your awesome hero image!
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Skills ConnectPro',
      description: 'The East Rand Specialist Network',
      images: ['/artisans/hero-welder.jpg'],
    }
  };
}

// Finally, render the Client App we renamed in Step 1
export default function Page() {
  return <ClientWrapper />;
}