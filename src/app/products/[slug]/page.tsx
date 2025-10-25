import React from 'react';
import { notFound } from 'next/navigation';
import ProductDetails from '@/components/product/product-details';

interface ProductPageProps {
  params: { slug: string };
}

async function fetchProduct(slug: string) {
  const base = (process.env.NEXT_PUBLIC_BASE_URL && process.env.NEXT_PUBLIC_BASE_URL.startsWith('http'))
    ? process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, '')
    : 'http://localhost:3000';
  const res = await fetch(`${base}/api/products/${slug}`, { cache: 'no-store' });
  const json = await res.json();
  if (!json.success) return null;
  return json.data;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await fetchProduct(params.slug);
  if (!product) return notFound();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12">
          <ProductDetails product={product} />
        </div>
      </main>
      {/* Footer is global from RootLayout */}
    </div>
  );
}


