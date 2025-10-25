'use client';

import React from 'react';

// Используем официальный виджет отзывов Яндекс.Карт
const YANDEX_WIDGET_URL = 'https://yandex.ru/maps-reviews-widget/1288972620?comments';

export default function ReviewsPage() {
  // Яндекс Карты: показываем организацию «Стили Города»
  const YANDEX_MAP_EMBED = 'https://yandex.ru/map-widget/v1/?ol=biz&oid=1288972620&z=16';

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Отзывы</h1>
        <p className="text-gray-600 mb-6">Отзывы клиентов из Яндекс Карт</p>

        <div className="bg-white rounded-xl shadow-sm border p-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Reviews widget */}
            <div className="rounded-lg overflow-hidden h-[60vh] lg:h-[75vh]">
              <iframe
                title="Отзывы — Яндекс Карты"
                src={YANDEX_WIDGET_URL}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
              />
            </div>

            {/* Map widget */}
            <div className="rounded-lg overflow-hidden h-[40vh] lg:h-[75vh]">
              <iframe
                title="Карта — ул. Маерчака, 49Г, склад № 5Б"
                src={YANDEX_MAP_EMBED}
                className="w-full h-full"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}


