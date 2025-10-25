import { ProductWithDetails } from '@/types';

interface OrganizationStructuredDataProps {
  className?: string;
}

export const OrganizationStructuredData: React.FC<OrganizationStructuredDataProps> = ({ className }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Стили Города',
    alternateName: 'Stili Goroda',
    url: 'https://stili-goroda.ru',
    logo: 'https://stili-goroda.ru/logo-stili-goroda.svg',
    foundingDate: '2020',
    description: 'Интернет-магазин городской одежды и аксессуаров. Стильные решения для современных людей. Быстрая доставка, индивидуальный подход.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'ул. Примерная, д. 123',
      addressLocality: 'Москва',
      addressCountry: 'RU'
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        telephone: '+7-495-123-45-67',
        contactType: 'customer service',
        areaServed: 'RU',
        availableLanguage: 'Russian'
      },
      {
        '@type': 'ContactPoint',
        email: 'info@stili-goroda.ru',
        contactType: 'customer service'
      }
    ],
    sameAs: [
      'https://vk.com/stili_goroda',
      'https://t.me/stili_goroda'
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Каталог городских стилей',
      itemListElement: [
        {
          '@type': 'OfferCatalog',
          name: 'Одежда',
          url: 'https://stili-goroda.ru/catalog/odezhda'
        },
        {
          '@type': 'OfferCatalog',
          name: 'Аксессуары',
          url: 'https://stili-goroda.ru/catalog/accessories'
        },
        {
          '@type': 'OfferCatalog',
          name: 'Обувь',
          url: 'https://stili-goroda.ru/catalog/obuv'
        }
      ]
    }
  };

  return (
    <script
      type="application/ld+json"
      className={className}
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};

interface ProductStructuredDataProps {
  product: ProductWithDetails;
}

export const ProductStructuredData: React.FC<ProductStructuredDataProps> = ({ product }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description || '',
    image: product.images.length > 0 ? product.images : ['https://stili-goroda.ru/product-placeholder.png'],
    brand: {
      '@type': 'Brand',
      name: 'Стили Города'
    },
    manufacturer: {
      '@type': 'Organization',
      name: 'Стили Города'
    },
    sku: product.sku,
    mpn: product.sku,
    category: product.categoryObj.name,
    material: product.material || '',
    offers: {
      '@type': 'Offer',
      url: `https://stili-goroda.ru/products/${product.slug}`,
      priceCurrency: product.currency,
      price: Number(product.price),
      priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      availability: product.isInStock && product.stock > 0 
        ? 'https://schema.org/InStock' 
        : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: {
        '@type': 'Organization',
        name: 'Стили Города'
      }
    },
    aggregateRating: product.averageRating && product._count?.reviews ? {
      '@type': 'AggregateRating',
      ratingValue: product.averageRating,
      reviewCount: product._count.reviews,
      bestRating: 5,
      worstRating: 1
    } : undefined,
    review: product.reviews?.slice(0, 5).map((review: any) => ({
      '@type': 'Review',
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1
      },
      author: {
        '@type': 'Person',
        name: review.user ? `${review.user.firstName} ${review.user.lastName.charAt(0)}.` : 'Покупатель'
      },
      reviewBody: review.content,
      datePublished: new Date(review.createdAt).toISOString().split('T')[0]
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};

interface BreadcrumbStructuredDataProps {
  items: Array<{
    name: string;
    url: string;
  }>;
}

export const BreadcrumbStructuredData: React.FC<BreadcrumbStructuredDataProps> = ({ items }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};

interface WebsiteStructuredDataProps {}

export const WebsiteStructuredData: React.FC<WebsiteStructuredDataProps> = () => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Стили Города',
    alternateName: 'Stili Goroda',
    url: 'https://stili-goroda.ru',
    description: 'Интернет-магазин городской одежды и аксессуаров. Стильные решения для современных людей.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://stili-goroda.ru/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Стили Города',
      logo: {
        '@type': 'ImageObject',
        url: 'https://stili-goroda.ru/logo-stili-goroda.svg'
      }
    }
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};

interface FAQStructuredDataProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}

export const FAQStructuredData: React.FC<FAQStructuredDataProps> = ({ faqs }) => {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData, null, 2)
      }}
    />
  );
};


