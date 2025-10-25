import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export async function GET() {
  const siteUrl = process.env.SITE_URL || 'https://stili-goroda.ru';
  const urls: SitemapUrl[] = [];

  // Static pages
  const staticPages = [
    { url: '/', priority: 1.0, changefreq: 'daily' as const },
    { url: '/catalog', priority: 0.9, changefreq: 'daily' as const },
    { url: '/about', priority: 0.6, changefreq: 'monthly' as const },
    { url: '/contacts', priority: 0.6, changefreq: 'monthly' as const },
    { url: '/delivery', priority: 0.5, changefreq: 'monthly' as const },
    { url: '/return', priority: 0.4, changefreq: 'monthly' as const },
    // Removed privacy and terms pages
  ];

  staticPages.forEach(page => {
    urls.push({
      loc: `${siteUrl}${page.url}`,
      lastmod: new Date().toISOString(),
      changefreq: page.changefreq,
      priority: page.priority,
    });
  });

  try {
    // Dynamic category pages
    const categories = await db.category.findMany({
      where: { isActive: true },
      select: { slug: true },
    });

    categories.forEach(category => {
      urls.push({
        loc: `${siteUrl}/catalog/${category.slug}`,
        lastmod: new Date().toISOString(),
        changefreq: 'weekly',
        priority: 0.7,
      });
    });

    // Dynamic product pages
    const products = await db.product.findMany({
      where: { 
        isActive: true,
        visibility: 'VISIBLE'
      },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    products.forEach(product => {
      urls.push({
        loc: `${siteUrl}/products/${product.slug}`,
        lastmod: product.updatedAt.toISOString(),
        changefreq: 'weekly',
        priority: 0.8,
      });
    });

  } catch (error) {
    console.error('Error generating dynamic sitemap entries:', error);
  }

  // Generate XML
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('\n')}
</urlset>`;

  return new NextResponse(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600', // 1 hour
    },
  });
}


