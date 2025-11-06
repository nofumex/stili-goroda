import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { CartDrawer } from '@/components/cart/cart-drawer';
import { ToastProvider } from '@/components/ui/toast';
import { BackToTop } from '@/components/ui/back-to-top';
import { SitePopup } from '@/components/ui/site-popup';
import { FaviconManager } from '@/components/seo/favicon-manager';
import { CookieBanner } from '@/components/ui/cookie-banner';

const inter = Inter({ subsets: ['latin', 'cyrillic'] });

export const metadata: Metadata = {
  title: {
    default: 'Стиль Города — интернет-магазин городских стилей',
    template: '%s | Стиль Города',
  },
  description: 'Стиль Города — интернет-магазин одежды и аксессуаров в городском стиле. Широкий каталог, быстрая доставка, оптовые цены. Откройте свой Стиль города!',
  keywords: 'городская одежда, Стильная одежда, аксессуары, интернет-магазин, доставка, оптом',
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://stili-goroda.ru',
    siteName: 'Стиль Города',
    title: 'Стиль Города — интернет-магазин городских стилей',
    description: 'Стиль Города — интернет-магазин одежды и аксессуаров в городском стиле. Широкий каталог, быстрая доставка.',
    images: [
      {
        url: '/banner-home.svg',
        width: 1200,
        height: 400,
        alt: 'Стиль Города',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Стиль Города — интернет-магазин городских стилей',
    description: 'Стиль Города — интернет-магазин одежды и аксессуаров в городском стиле.',
    images: ['/banner-home.svg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className="scroll-smooth">
      <body className={inter.className}>
        <FaviconManager />
        <ToastProvider>
          <Header />
          <SitePopup />
          <CookieBanner />
          {children}
          <Footer />
          <CartDrawer />
          <BackToTop />
        </ToastProvider>
      </body>
    </html>
  );
}


