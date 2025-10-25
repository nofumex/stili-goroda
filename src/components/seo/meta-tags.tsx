import { Metadata } from 'next';

interface GenerateMetadataProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  canonical?: string;
  noindex?: boolean;
  type?: 'website' | 'article' | 'product';
}

export function generateMetadata({
  title,
  description,
  keywords,
  ogImage = '/og-image.jpg',
  canonical,
  noindex = false,
  type = 'website',
}: GenerateMetadataProps): Metadata {
  const siteName = 'Стили Города';
  const siteUrl = process.env.SITE_URL || 'https://stili-goroda.ru';
  
  const fullTitle = title === siteName ? title : `${title} | ${siteName}`;
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;
  const fullCanonical = canonical ? `${siteUrl}${canonical}` : undefined;

  return {
    title: fullTitle,
    description,
    keywords,
    robots: noindex ? 'noindex, nofollow' : 'index, follow',
    openGraph: {
      type: type === 'product' ? 'website' : type,
      locale: 'ru_RU',
      url: fullCanonical,
      siteName,
      title: fullTitle,
      description,
      images: [
        {
          url: fullOgImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [fullOgImage],
    },
    alternates: {
      canonical: fullCanonical,
    },
    other: {
      'yandex-verification': process.env.YANDEX_VERIFICATION || '',
      'google-site-verification': process.env.GOOGLE_SITE_VERIFICATION || '',
    },
  };
}

// Predefined metadata for common pages
export const metadataTemplates = {
  home: {
    title: 'Стили Города — интернет-магазин городских стилей',
    description: 'Стили Города — интернет-магазин одежды и аксессуаров в городском стиле. Широкий каталог, быстрая доставка, оптовые цены. Откройте свой стиль города!',
    keywords: 'городская одежда, стильная одежда, аксессуары, интернет-магазин, доставка, оптом',
  },
  catalog: {
    title: 'Каталог городских стилей',
    description: 'Широкий выбор одежды и аксессуаров в городском стиле. Качественные материалы, современные тренды, доступные цены, быстрая доставка.',
    keywords: 'каталог, одежда, аксессуары, городской стиль, тренды, мода',
  },
  about: {
    title: 'О компании Стили Города',
    description: '«Стили Города» — интернет-магазин городской одежды и аксессуаров. Мы предлагаем стильные решения для современных людей. Качество и индивидуальный подход.',
    keywords: 'о компании, стили города, городская мода, качество, стиль',
  },
  contacts: {
    title: 'Контакты — Стили Города',
    description: 'Свяжитесь с нами. Мы всегда на связи и готовы помочь с выбором. Звоните, пишите, приезжайте!',
    keywords: 'контакты, телефон, адрес, режим работы, связь',
  },
  delivery: {
    title: 'Доставка и оплата — Стили Города',
    description: 'Доставка одежды и аксессуаров по всей России. Различные способы оплаты. Быстрая отгрузка заказов.',
    keywords: 'доставка, оплата, быстрая доставка, способы оплаты',
  },
  return: {
    title: 'Возврат и обмен товаров — Стили Города',
    description: 'Условия возврата и обмена товаров. Гарантия качества. Защита прав потребителей.',
    keywords: 'возврат, обмен, гарантия, права потребителей, качество',
  },
  privacy: {
    title: 'Политика конфиденциальности — Стили Города',
    description: 'Политика обработки персональных данных. Защита конфиденциальности клиентов. Соответствие требованиям законодательства.',
    keywords: 'политика конфиденциальности, персональные данные, защита данных',
  },
  terms: {
    title: 'Условия использования — Стили Города',
    description: 'Пользовательское соглашение и условия использования интернет-магазина городских стилей.',
    keywords: 'условия использования, пользовательское соглашение, правила',
  },
};

// Generate category metadata
export function generateCategoryMetadata(categoryName: string, categorySlug: string) {
  return {
    title: `${categoryName} — купить онлайн | Стили Города`,
    description: `Широкий выбор ${categoryName.toLowerCase()} высокого качества. Быстрая доставка по всей России. Стильные решения от Стили Города.`,
    keywords: `${categoryName.toLowerCase()}, купить ${categoryName.toLowerCase()}, городской стиль, модная одежда`,
    canonical: `/catalog/${categorySlug}`,
  };
}

// Generate product metadata
export function generateProductMetadata(product: {
  title: string;
  description?: string;
  price: number;
  material?: string;
  category: string;
  slug: string;
}) {
  const priceText = new Intl.NumberFormat('ru-RU', { 
    style: 'currency', 
    currency: 'RUB',
    minimumFractionDigits: 0 
  }).format(product.price);

  return {
    title: `${product.title} — купить за ${priceText} | Стили Города`,
    description: product.description || `${product.title} из качественных материалов. ${product.material ? `Материал: ${product.material}.` : ''} Цена: ${priceText}. Быстрая доставка.`,
    keywords: `${product.title.toLowerCase()}, ${product.category.toLowerCase()}, ${product.material?.toLowerCase() || ''}, купить, цена`,
    canonical: `/products/${product.slug}`,
    type: 'product' as const,
  };
}

// Generate blog/article metadata
export function generateArticleMetadata(article: {
  title: string;
  description: string;
  slug: string;
  publishedAt?: Date;
  author?: string;
}) {
  return {
    title: `${article.title} | Блог Стили Города`,
    description: article.description,
    canonical: `/blog/${article.slug}`,
    type: 'article' as const,
    openGraph: {
      type: 'article',
      publishedTime: article.publishedAt?.toISOString(),
      authors: article.author ? [article.author] : undefined,
    },
  };
}


