"use client";
import React, { Suspense } from 'react';
import { BeautifulCategoryBar } from '@/components/home/beautiful-category-bar';
import { MainCatalog } from '@/components/home/main-catalog';
import { useCategories } from '@/hooks/useApi';

function HomeContent() {
  const { data: categories } = useCategories(true);

  return (
    <div className="min-h-screen flex flex-col">
      <BeautifulCategoryBar categories={categories || []} />
      <main className="flex-1">
        <MainCatalog />
      </main>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Загрузка...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}

