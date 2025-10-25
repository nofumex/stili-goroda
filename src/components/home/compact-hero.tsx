'use client';

import React from 'react';
import Link from 'next/link';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
}

interface CompactHeroProps {
  categories: Category[];
}

export const CompactHero: React.FC<CompactHeroProps> = ({ categories }) => {
  return (
    <div className="bg-white border-b sticky top-16 z-40 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-hide">
          <Link
            href="/"
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition-colors whitespace-nowrap"
          >
            Все товары
          </Link>
          
          {categories.slice(0, 8).map((category) => (
            <Link
              key={category.id}
              href={`/?category=${category.slug}`}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              {category.name}
              {category._count?.products && (
                <span className="ml-1.5 text-xs text-gray-500">
                  ({category._count.products})
                </span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

