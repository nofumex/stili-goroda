'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  description?: string;
  _count?: {
    products: number;
  };
}

interface CategoryShowcaseProps {
  categories: Category[];
}

export const CategoryShowcase: React.FC<CategoryShowcaseProps> = ({ categories }) => {
  const mainCategories = categories.slice(0, 6);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Категории товаров
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Выберите категорию, которая вам интересна, и откройте для себя мир стильной одежды
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mainCategories.map((category, index) => {
            const isLarge = index === 0;
            
            return (
              <Link
                key={category.id}
                href={`/catalog?category=${category.slug}`}
                className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-500 ${
                  isLarge ? 'md:col-span-2 md:row-span-2' : ''
                }`}
              >
                {/* Image */}
                <div className={`relative ${isLarge ? 'h-96 lg:h-full' : 'h-64'}`}>
                  <img
                    src={category.image || '/product-placeholder.png'}
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent group-hover:from-black/90 transition-all duration-500" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-6">
                  <div className="transform group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className={`font-bold text-white mb-2 ${isLarge ? 'text-3xl lg:text-4xl' : 'text-2xl'}`}>
                      {category.name}
                    </h3>
                    
                    {category.description && (
                      <p className="text-gray-200 text-sm mb-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {category.description}
                      </p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <span className="text-white/80 text-sm">
                        {category._count?.products || 0} товаров
                      </span>
                      
                      <div className="flex items-center gap-2 text-yellow-400 group-hover:gap-4 transition-all duration-300">
                        <span className="font-semibold">Смотреть</span>
                        <ArrowRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Accent corner */}
                <div className="absolute top-4 right-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center text-gray-900 font-bold text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {category._count?.products || 0}
                </div>
              </Link>
            );
          })}
        </div>

        {/* View all button */}
        {categories.length > 6 && (
          <div className="text-center mt-12">
            <Link href="/catalog">
              <button className="px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2 mx-auto">
                Посмотреть все категории
                <ArrowRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

