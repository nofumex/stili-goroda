import React from 'react';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function FAQPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12 max-w-3xl">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Часто задаваемые вопросы</h1>
          <div className="space-y-6 text-gray-700">
            <div>
              <h2 className="font-semibold">Как оформить заказ?</h2>
              <p>Добавьте товары в корзину и оформите заказ через форму.</p>
            </div>
            <div>
              <h2 className="font-semibold">Сроки доставки?</h2>
              <p>По Москве 1-3 дня, по России согласно ТК.</p>
            </div>
          </div>
        </div>
      </main>
      {/* Footer is global from RootLayout */}
    </div>
  );
}


