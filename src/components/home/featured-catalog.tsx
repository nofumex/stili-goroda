'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Sparkles, Clock } from 'lucide-react';
import { ProductGridOptimized } from '@/components/product/product-grid-optimized';
import { useProductsList } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';

type TabType = 'popular' | 'new' | 'sale';

export const FeaturedCatalog: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('popular');
  
  // Fetch products based on active tab
  const popularQuery = useProductsList({ 
    sortBy: 'rating', 
    sortOrder: 'desc', 
    page: 1, 
    limit: 8,
    inStock: true,
  });
  
  const newQuery = useProductsList({ 
    sortBy: 'createdAt', 
    sortOrder: 'desc', 
    page: 1, 
    limit: 8,
    inStock: true,
  });
  
  const saleQuery = useProductsList({ 
    sortBy: 'price', 
    sortOrder: 'asc', 
    page: 1, 
    limit: 8,
    inStock: true,
  });

  const tabs = [
    {
      id: 'popular' as TabType,
      label: 'Популярное',
      icon: TrendingUp,
      query: popularQuery,
    },
    {
      id: 'new' as TabType,
      label: 'Новинки',
      icon: Sparkles,
      query: newQuery,
    },
    {
      id: 'sale' as TabType,
      label: 'Распродажа',
      icon: Clock,
      query: saleQuery,
    },
  ];

  const currentQuery = tabs.find(tab => tab.id === activeTab)?.query;

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Наши товары
            </h2>
            <p className="text-lg text-gray-600">
              Тщательно отобранные коллекции для вас
            </p>
          </div>

          <Link href="/catalog">
            <Button 
              variant="outline" 
              size="lg"
              className="mt-4 md:mt-0 group"
            >
              Все товары
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 justify-center md:justify-start">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:scale-102'
                }`}
              >
                <Icon className="h-5 w-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Products Grid */}
        <ProductGridOptimized
          products={currentQuery?.data || []}
          loading={currentQuery?.loading}
          viewMode="grid"
          showQuickView={true}
        />

        {/* Load More */}
        <div className="text-center mt-12">
          <Link href={`/catalog?sortBy=${
            activeTab === 'popular' ? 'rating' : 
            activeTab === 'new' ? 'createdAt' : 
            'price'
          }&sortOrder=${activeTab === 'sale' ? 'asc' : 'desc'}`}>
            <Button 
              size="lg"
              variant="outline"
              className="group"
            >
              Показать больше
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

