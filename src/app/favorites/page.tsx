'use client';

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag } from 'lucide-react';
import { useFavoritesStore } from '@/store/favorites';
import { ProductCard } from '@/components/product/product-card';
import { Button } from '@/components/ui/button';

export default function FavoritesPage() {
  const { ids } = useFavoritesStore();
  
  // Убираем возможные дубликаты
  const uniqueIds = React.useMemo(() => Array.from(new Set(ids)), [ids]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="container mx-auto px-4 py-12">
        {/* Заголовок */}
        <div className="mb-10 animate-fade-in-up">
          <div className="mb-4">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-2">
              Избранное
            </h1>
            <p className="text-gray-600 text-lg font-medium">
              {uniqueIds.length > 0 ? `Товаров в избранном: ${uniqueIds.length}` : 'Здесь появятся товары, которые вам понравились'}
            </p>
          </div>
        </div>

        {uniqueIds.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-12 max-w-md mx-auto">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-12 w-12 text-gray-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Список избранного пуст</h2>
              <p className="text-gray-600 mb-8">
                Добавляйте понравившиеся товары в избранное, чтобы не потерять их
              </p>
              <Link href="/">
                <Button size="lg" className="btn-shimmer shadow-xl font-bold">
                  <ShoppingBag className="h-5 w-5 mr-2" />
                  Перейти в каталог
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <FavoritesList ids={uniqueIds} />
        )}
      </div>
    </div>
  );
}

function FavoritesList({ ids }: { ids: string[] }) {
  const [products, setProducts] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        ids.forEach(id => params.append('id', id));
        const res = await fetch(`/api/products?${params.toString()}`);
        const json = await res.json();
        if (json.success) setProducts(json.data || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [JSON.stringify(ids)]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Загрузка избранных товаров...</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-xl border-2 border-gray-100 p-12 max-w-md mx-auto">
          <div className="bg-gradient-to-br from-yellow-100 to-orange-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="h-12 w-12 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Товары не найдены</h2>
          <p className="text-gray-600 mb-8">
            Некоторые товары могут быть удалены из каталога
          </p>
          <Link href="/">
            <Button size="lg" className="btn-shimmer shadow-xl font-bold">
              <ShoppingBag className="h-5 w-5 mr-2" />
              Вернуться в каталог
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map((p: any) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
}








