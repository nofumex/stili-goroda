'use client';

import React from 'react';
import Link from 'next/link';
import { ShoppingCart, Eye, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cart';
import { useFavoritesStore } from '@/store/favorites';
import { useToast } from '@/components/ui/toast';
import { formatPrice, getStockStatus } from '@/lib/utils';
import { ProductWithDetails } from '@/types';
import { useRouter } from 'next/navigation';

interface ProductCardProps {
  product: ProductWithDetails;
  viewMode?: 'grid' | 'list';
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, 
  viewMode = 'grid' 
}) => {
  const { addItem } = useCartStore();
  const { success } = useToast();
  const stockStatus = getStockStatus(product.stock);
  const { toggle, has } = useFavoritesStore();
  const router = useRouter();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.isInStock && product.stock > 0) {
      addItem(product);
      success('Товар добавлен', `${product.title} добавлен в корзину`);
    }
  };

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
      MIDDLE: 'bg-primary-100 text-primary-800',
      LUXURY: 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-800',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Image */}
          <Link href={`/products/${product.slug}`} className="md:w-48 flex-shrink-0">
            <div className="aspect-square overflow-hidden rounded-lg">
              <img
                src={product.images[0] || '/placeholder-product.jpg'}
                alt={product.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform"
              />
            </div>
          </Link>

          {/* Content */}
          <div className="flex-1 flex flex-col justify-between">
            <div>
              {/* Badges */}
              <div className="flex items-center gap-2 mb-3">
                <span className={`badge ${getCategoryColor(product.category)}`}>
                  {getCategoryLabel(product.category)}
                </span>
                {product.oldPrice && (
                  <span className="badge bg-red-100 text-red-800">
                    -{Math.round(((Number(product.oldPrice) - Number(product.price)) / Number(product.oldPrice)) * 100)}%
                  </span>
                )}
                <span className={`badge ${stockStatus.status === 'in_stock' ? 'badge-success' : stockStatus.status === 'low_stock' ? 'badge-warning' : 'badge-error'}`}>
                  {stockStatus.message}
                </span>
              </div>

              {/* Title and description */}
              <Link href={`/products/${product.slug}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition-colors mb-2 line-clamp-2">
                  {product.title}
                </h3>
              </Link>
              
              <p className="text-gray-600 line-clamp-2 mb-4">
                {product.description}
              </p>

              {/* Material */}
              {product.material && (
                <p className="text-sm text-gray-500 mb-4">
                  Материал: {product.material}
                </p>
              )}

              
            </div>

            {/* Price and actions */}
            <div className="flex items-end justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatPrice(Number(product.price))}
                  </span>
                  {product.oldPrice && (
                    <span className="text-lg text-gray-500 line-through">
                      {formatPrice(Number(product.oldPrice))}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link href={`/products/${product.slug}`}>
                    <Eye className="h-4 w-4 mr-2" />
                    Подробнее
                  </Link>
                </Button>
                
                <Button
                  onClick={handleAddToCart}
                  disabled={!product.isInStock || product.stock === 0}
                  className="flex items-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {product.isInStock && product.stock > 0 ? 'В корзину' : 'Нет в наличии'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link 
      href={`/products/${product.slug}`}
      className="block bg-white rounded-2xl shadow-lg border-2 border-gray-100 hover:border-primary-200 hover:shadow-2xl transition-all duration-500 overflow-hidden group cursor-pointer card-hover animate-fade-in-up"
      data-testid="product-card"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden image-shine">
        <img
          src={(Array.isArray(product.images) && product.images[0]) || 'https://placehold.co/400x400?text=No+Image'}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 space-y-2 z-10">
          <span className={`badge ${getCategoryColor(product.category)} shadow-lg backdrop-blur-sm font-semibold`}>
            {getCategoryLabel(product.category)}
          </span>
          {product.oldPrice && (
            <span className="badge bg-gradient-to-r from-red-500 to-pink-500 text-white block shadow-lg animate-pulse-slow font-bold">
              -{Math.round(((Number(product.oldPrice) - Number(product.price)) / Number(product.oldPrice)) * 100)}%
            </span>
          )}
        </div>

        {/* Stock status */}
        <div className="absolute top-4 right-4 z-10">
          <span className={`badge ${stockStatus.status === 'in_stock' ? 'badge-success' : stockStatus.status === 'low_stock' ? 'badge-warning' : 'badge-error'} shadow-lg backdrop-blur-sm font-semibold`}>
            {stockStatus.message}
          </span>
        </div>

        {/* Hover actions */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-center justify-center gap-3">
          <Button
            size="sm"
            variant="secondary"
            asChild
            className="flex items-center gap-2 shadow-xl backdrop-blur-md bg-white/90 hover:bg-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300"
          >
            <Link href={`/products/${product.slug}`}>
              <Eye className="h-4 w-4" />
              Подробнее
            </Link>
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className={`shadow-xl backdrop-blur-md bg-white/90 hover:bg-white/100 transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 delay-75 ${has(product.id) ? 'text-red-500' : 'text-gray-700'}`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle(product.id); }}
          >
            <Heart className={`h-4 w-4 ${has(product.id) ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 bg-gradient-to-br from-white to-gray-50">
        

        {/* Title */}
        <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2 group-hover:text-primary-600 transition-colors">
          {product.title}
        </h3>

        {/* Material - всегда занимает место */}
        <div className="h-5 mb-2">
          {product.material && (
            <p className="text-sm text-gray-600 font-medium truncate">
              {product.material}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-3 bg-gradient-to-r from-primary-50 to-accent-50 -mx-4 px-4 py-2">
          <span className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-accent">
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
            <span className="text-lg text-gray-400 line-through font-semibold">
              {formatPrice(Number(product.oldPrice))}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
          <Button 
            className="w-full btn-shimmer shadow-md hover:shadow-xl font-bold"
            onClick={handleAddToCart}
            disabled={!product.isInStock || product.stock === 0}
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            {product.isInStock && product.stock > 0 ? 'В корзину' : 'Нет в наличии'}
          </Button>
          
          <Button variant="outline" size="sm" className="w-full border-2 hover:bg-primary-50 font-semibold">
            <span
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (product.isInStock && product.stock > 0) {
                  addItem(product);
                  router.push('/checkout');
                }
              }}
            >
              Быстрая покупка
            </span>
          </Button>
        </div>
      </div>
    </Link>
  );
};


