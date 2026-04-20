import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.skillsconnectpro.co.za';

  return [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${baseUrl}/register`, // Update this if your registration route is named differently
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // As you add more pages (like /about or /contact), just copy and paste another block here!
  ];
}