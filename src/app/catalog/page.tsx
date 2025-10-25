'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CatalogPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Редирект на главную с сохранением всех параметров
    const params = searchParams.toString();
    router.replace(params ? `/?${params}` : '/');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Перенаправление...</p>
      </div>
    </div>
  );
}
