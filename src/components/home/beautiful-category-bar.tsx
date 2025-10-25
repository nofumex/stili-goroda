'use client';

import React from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  _count?: {
    products: number;
  };
}

interface BeautifulCategoryBarProps {
  categories: Category[];
}

export const BeautifulCategoryBar: React.FC<BeautifulCategoryBarProps> = ({ categories }) => {
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get('category') || '';

  return (
    <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 border-b border-primary-900 shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 py-4 overflow-x-auto scrollbar-hide">
          {/* Все товары */}
          <Link
            href="/"
            className={`group px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
              !activeCategory
                ? 'bg-white text-primary-700 shadow-xl'
                : 'bg-white/10 text-white hover:bg-white/20'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <span>Все товары</span>
            </div>
          </Link>
          
          {/* Категории */}
          {categories.slice(0, 8).map((category) => {
            const isActive = activeCategory === category.slug;
            
            return (
              <Link
                key={category.id}
                href={`/?category=${category.slug}`}
                className={`group px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-primary-700 shadow-xl'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{category.name}</span>
                  {category._count?.products && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isActive 
                        ? 'bg-primary-100 text-primary-700' 
                        : 'bg-white/20 text-white'
                    }`}>
                      {category._count.products}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}

          {/* Ещё категории */}
          {categories.length > 8 && (
            <Link
              href="/"
              className="px-6 py-3 rounded-xl text-sm font-semibold bg-white/10 text-white hover:bg-white/20 transition-all duration-300 whitespace-nowrap"
            >
              Ещё +{categories.length - 8}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

