'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Grid, List, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductFilters } from '@/components/product/product-filters';
import { ProductGridOptimized } from '@/components/product/product-grid-optimized';
import { useProductsList, useCategories } from '@/hooks/useApi';

export const MainCatalog: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(16); // Увеличено для главной
  const [filters, setFilters] = useState({
    category: '',
    priceMin: undefined as number | undefined,
    priceMax: undefined as number | undefined,
    inStock: true as boolean | undefined, // По умолчанию только в наличии
    productCategory: '',
    material: '',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: products, pagination, loading } = useProductsList({ 
    ...filters, 
    page, 
    limit 
  });
  const { data: categories } = useCategories(true);

  useEffect(() => {
    const category = searchParams.get('category');
    const pageParam = searchParams.get('page');
    
    if (category) {
      setFilters(prev => ({ ...prev, category }));
    }
    if (pageParam) setPage(Number(pageParam) || 1);
  }, [searchParams]);

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPage(1);
    
    const params = new URLSearchParams();
    Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });
    params.set('page', '1');
    params.set('limit', String(limit));
    router.push(`/?${params.toString()}`);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(newPage));
    router.push(`/?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 via-white to-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar with filters */}
          <div className={`lg:w-72 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 animate-slide-down">
              <ProductFilters
                filters={filters}
                onFiltersChange={handleFilterChange}
                categories={categories || []}
              />
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1">
            {/* Controls */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 mb-8 animate-slide-down">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Results count */}
                <div className="text-sm text-gray-700 font-medium">
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent"></span>
                      Загрузка...
                    </span>
                  ) : (
                    <>
                      Показано <span className="font-bold text-primary-600">{products?.length || 0}</span> из{' '}
                      <span className="font-bold text-primary-600">{pagination?.total || 0}</span> товаров
                    </>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3">
                  {/* Sort */}
                  <select
                    value={`${filters.sortBy}-${filters.sortOrder}`}
                    onChange={(e) => {
                      const [sortBy, sortOrder] = e.target.value.split('-');
                      handleFilterChange({ sortBy, sortOrder });
                    }}
                    className="text-sm rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 py-2 px-4 font-medium transition-all hover:border-primary-300"
                  >
                    <option value="createdAt-desc">Новинки</option>
                    <option value="price-asc">Дешевле</option>
                    <option value="price-desc">Дороже</option>
                    <option value="name-asc">По названию</option>
                  </select>

                  {/* View mode */}
                  <div className="hidden sm:flex items-center border-2 border-gray-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-3 transition-all duration-300 ${viewMode === 'grid' ? 'bg-gradient-to-r from-primary-600 to-accent text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                      <Grid className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-3 transition-all duration-300 ${viewMode === 'list' ? 'bg-gradient-to-r from-primary-600 to-accent text-white' : 'text-gray-400 hover:bg-gray-50'}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Mobile filter button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowFilters(!showFilters)}
                    className="lg:hidden border-2 rounded-xl hover:bg-primary-50"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <ProductGridOptimized
              products={products || []}
              loading={loading}
              viewMode={viewMode}
              showQuickView={true}
            />

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-10 flex justify-center animate-fade-in">
                <div className="flex items-center gap-3 bg-white rounded-2xl shadow-xl border border-gray-100 p-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => handlePageChange(page - 1)}
                    className="rounded-xl border-2 font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Назад
                  </Button>
                  
                  {Array.from({ length: Math.min(pagination.pages, 5) }).map((_, idx) => {
                    let pageNum;
                    if (pagination.pages <= 5) {
                      pageNum = idx + 1;
                    } else if (page <= 3) {
                      pageNum = idx + 1;
                    } else if (page >= pagination.pages - 2) {
                      pageNum = pagination.pages - 4 + idx;
                    } else {
                      pageNum = page - 2 + idx;
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant="outline"
                        size="sm"
                        className={`rounded-xl border-2 font-bold min-w-[40px] transition-all hover:scale-110 ${pageNum === page ? 'bg-gradient-to-r from-primary-600 to-accent text-white border-transparent shadow-lg' : 'hover:bg-primary-50'}`}
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= pagination.pages}
                    onClick={() => handlePageChange(page + 1)}
                    className="rounded-xl border-2 font-semibold hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Вперед
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

