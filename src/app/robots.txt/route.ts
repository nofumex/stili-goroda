import { NextResponse } from 'next/server';

export function GET() {
  const robotsTxt = `
User-agent: *
Allow: /

# Disallow admin and private areas
Disallow: /admin/
Disallow: /api/
Disallow: /profile/
Disallow: /checkout/
Disallow: /login
Disallow: /register

# Disallow URLs with parameters
Disallow: /*?*

# Allow Googlebot full access (except private areas)
User-agent: Googlebot
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /profile/
Disallow: /checkout/

# Disallow common bot patterns
User-agent: AhrefsBot
Disallow: /

User-agent: MJ12bot
Disallow: /

User-agent: SemrushBot
Disallow: /

# Crawl delay
Crawl-delay: 1

# Sitemap location
Sitemap: ${process.env.SITE_URL || 'https://stili-goroda.ru'}/sitemap.xml
  `.trim();

  return new NextResponse(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400', // 24 hours
    },
  });
}


