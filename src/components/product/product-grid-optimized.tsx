'use client';

import React, { useState, memo } from 'react';
import { ProductCard } from './product-card';
import { ProductWithDetails } from '@/types';
import { Modal } from '@/components/ui/modal';
import { ProductDetails } from './product-details';
import { X } from 'lucide-react';

interface ProductGridProps {
  products: ProductWithDetails[];
  loading?: boolean;
  viewMode?: 'grid' | 'list';
  showQuickView?: boolean;
}

// Memoized product card wrapper for performance
const MemoizedProductCard = memo(({ product, viewMode, onQuickView }: { 
  product: ProductWithDetails; 
  viewMode: 'grid' | 'list';
  onQuickView?: (product: ProductWithDetails) => void;
}) => {
  return (
    <div className="relative group">
      <ProductCard product={product} viewMode={viewMode} />
      {onQuickView && viewMode === 'grid' && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onQuickView(product);
          }}
          className="absolute top-4 right-4 z-10 bg-white/90 hover:bg-white text-gray-900 p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg"
          aria-label="Быстрый просмотр"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        </button>
      )}
    </div>
  );
});

MemoizedProductCard.displayName = 'MemoizedProductCard';

export const ProductGridOptimized: React.FC<ProductGridProps> = ({ 
  products, 
  loading = false,
  viewMode = 'grid',
  showQuickView = true,
}) => {
  const [quickViewProduct, setQuickViewProduct] = useState<ProductWithDetails | null>(null);

  const handleQuickView = (product: ProductWithDetails) => {
    setQuickViewProduct(product);
  };

  const closeQuickView = () => {
    setQuickViewProduct(null);
  };

  if (loading) {
    return (
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border overflow-hidden animate-pulse">
            <div className="aspect-square bg-gray-200"></div>
            <div className="p-6 space-y-3">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-gray-400 mb-4">
          <svg className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Товары не найдены
        </h3>
        <p className="text-gray-600 mb-6">
          Попробуйте изменить параметры поиска или фильтры
        </p>
      </div>
    );
  }

  return (
    <>
      <div className={`grid gap-6 ${
        viewMode === 'grid' 
          ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
          : 'grid-cols-1'
      }`}>
        {products.map((product) => (
          <MemoizedProductCard
            key={product.id}
            product={product}
            viewMode={viewMode}
            onQuickView={showQuickView ? handleQuickView : undefined}
          />
        ))}
      </div>

      {/* Quick View Modal */}
      {quickViewProduct && (
        <Modal isOpen={true} onClose={closeQuickView} size="xl">
          <div className="relative">
            <button
              onClick={closeQuickView}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/90 hover:bg-white text-gray-900 shadow-lg transition-all"
              aria-label="Закрыть"
            >
              <X className="h-5 w-5" />
            </button>
            
            <ProductDetails product={quickViewProduct} compact />
          </div>
        </Modal>
      )}
    </>
  );
};

