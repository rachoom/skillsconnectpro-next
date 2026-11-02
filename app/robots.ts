import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: [
      '/api/', '/admin', '/my-projects', '/artisan-business',
      '/customer-checkout', '/provider-checkout',
      '/customer-payment-result', '/provider-payment-result',
    ] },
    sitemap: 'https://www.skillsconnectpro.co.za/sitemap.xml',
  };
}
