'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Search, TrendingUp, Star, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
}

interface ModernHeroProps {
  categories?: Category[];
}

export const ModernHero: React.FC<ModernHeroProps> = ({ categories = [] }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/catalog?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const quickCategories = categories.slice(0, 4);

  return (
    <section className="relative bg-gradient-to-br from-gray-900 via-primary-900 to-gray-900 text-white overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container mx-auto px-4 py-12 lg:py-16 relative z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-4">
              <Star className="h-4 w-4 text-yellow-400" />
              <span className="text-sm font-medium">Розничный интернет-магазин одежды</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Откройте <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">свой стиль</span> города
            </h1>
            
            <p className="text-lg md:text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Модная одежда и аксессуары для современных людей. Быстрая доставка, проверенное качество
            </p>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-8">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Найти одежду, аксессуары..."
                className="pl-14 pr-4 py-6 text-lg rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-md text-white placeholder:text-gray-400 focus:border-white/40 focus:bg-white/20 transition-all"
              />
              <Button 
                type="submit"
                size="lg"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-gray-900 font-semibold"
              >
                Искать
              </Button>
            </div>
          </form>

          {/* Quick categories */}
          {quickCategories.length > 0 && (
            <div className="flex flex-wrap items-center justify-center gap-3">
              <span className="text-sm text-gray-400">Популярное:</span>
              {quickCategories.map((category) => (
                <Link
                  key={category.id}
                  href={`/catalog?category=${category.slug}`}
                  className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 transition-all text-sm font-medium"
                >
                  {category.name}
                </Link>
              ))}
            </div>
          )}

          {/* Trust indicators */}
          <div className="grid grid-cols-3 gap-4 mt-12 max-w-2xl mx-auto">
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-6 w-6 text-green-400" />
              </div>
              <div className="text-2xl font-bold mb-1">5000+</div>
              <div className="text-xs text-gray-400">Товаров</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="text-2xl font-bold mb-1">99%</div>
              <div className="text-xs text-gray-400">Довольных клиентов</div>
            </div>
            
            <div className="text-center p-4 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
              <div className="flex items-center justify-center mb-2">
                <Zap className="h-6 w-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold mb-1">24ч</div>
              <div className="text-xs text-gray-400">Доставка</div>
            </div>
          </div>
        </div>
      </div>

      {/* Wave divider */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="rgb(249, 250, 251)" />
        </svg>
      </div>
    </section>
  );
};

