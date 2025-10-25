'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, ShoppingCart, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, getStockStatus } from '@/lib/utils';

export const FeaturedProducts: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/products?limit=8&sortBy=createdAt&sortOrder=desc');
        const json = await res.json();
        if (json?.success) {
          setFeaturedProducts(json.data);
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const getCategoryLabel = (category: string) => {
    const labels = {
      ECONOMY: 'Эконом',
      MIDDLE: 'Средний',
      LUXURY: 'Люкс',
    };
    return labels[category as keyof typeof labels] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      ECONOMY: 'bg-green-100 text-green-800',
      MIDDLE: 'bg-blue-100 text-blue-800',
      LUXURY: 'bg-purple-100 text-purple-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Популярные товары
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Самые востребованные постельные принадлежности из нашего каталога
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {(loading ? Array.from({ length: 4 }).map((_, i) => ({ id: `s-${i}`, loading: true })) : featuredProducts).map((product: any) => {
            if (product.loading) {
              return (
                <div key={product.id} className="bg-white rounded-xl shadow-sm border overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-8 bg-gray-200 rounded w-full" />
                  </div>
                </div>
              );
            }
            const stockStatus = getStockStatus(product.stock);
            
            return (
              <div
                key={product.id}
                className="bg-white rounded-xl shadow-sm border hover:shadow-lg transition-all duration-300 overflow-hidden group card-hover"
              >
                {/* Image */}
                <div className="relative aspect-square overflow-hidden">
                  <img
                    src={product.images?.[0] || 'https://placehold.co/400x400?text=No+Image'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Badges */}
                  <div className="absolute top-3 left-3 space-y-2">
                    <span className={`badge ${getCategoryColor(product.category)}`}>
                      {getCategoryLabel(product.category)}
                    </span>
                    {product.oldPrice && (
                      <span className="badge bg-red-100 text-red-800">
                        -{Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Stock status */}
                  <div className="absolute top-3 right-3">
                    <span className={`badge ${stockStatus.status === 'in_stock' ? 'badge-success' : stockStatus.status === 'low_stock' ? 'badge-warning' : 'badge-error'}`}>
                      {stockStatus.message}
                    </span>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-4">
                    <Link href={`/products/${product.slug}`}>
                      <Button size="sm" variant="secondary">
                        <Eye className="h-4 w-4 mr-2" />
                        Подробнее
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {product.title}
                  </h3>

                  {/* Material */}
                  <p className="text-sm text-gray-600 mb-3">
                    {product.material}
                  </p>

                  {/* Price (min — max if variants) */}
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-xl font-bold text-gray-900">
                      {(() => {
                        const prices: number[] = [];
                        if (product.price != null) prices.push(Number(product.price));
                        if (Array.isArray(product.variants) && product.variants.length > 0) {
                          for (const v of product.variants) {
                            if (v && v.price != null) prices.push(Number(v.price));
                          }
                        }
                        if (prices.length === 0) return formatPrice(0);
                        const min = Math.min(...prices);
                        const max = Math.max(...prices);
                        return min === max
                          ? formatPrice(min)
                          : `${formatPrice(min)} — ${formatPrice(max)}`;
                      })()}
                    </span>
                    {product.oldPrice && (
                      <span className="text-sm text-gray-500 line-through">
                        {formatPrice(Number(product.oldPrice))}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <Button className="w-full" disabled={!product.inStock}>
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      {product.inStock ? 'В корзину' : 'Нет в наличии'}
                    </Button>
                    
                    <Button variant="outline" size="sm" className="w-full">
                      Купить в 1 клик
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* View all button */}
        <div className="text-center mt-12">
          <Link href="/catalog">
            <Button size="lg" variant="outline">
              Посмотреть весь каталог
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};


