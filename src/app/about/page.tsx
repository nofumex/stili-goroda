import React from 'react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent mb-8">О компании</h1>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p>
              <strong>«Стиль Города»</strong> — современный интернет-магазин городской одежды и аксессуаров.
              Мы предлагаем Стильные решения для людей, которые ценят качество, комфорт и индивидуальность.
            </p>
            <p>
              Наша миссия — помочь каждому найти свой уникальный Стиль, который отражает характер и образ жизни.
              Мы тщательно отбираем товары от проверенных производителей и следим за актуальными трендами моды.
            </p>
            <p>
              В нашем каталоге вы найдете широкий выбор одежды и аксессуаров для любого случая — от повседневных образов
              до Стильных решений для особых событий.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-10 mb-4">Наши преимущества</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Широкий выбор Стильной одежды и аксессуаров</li>
              <li>Качественные материалы и проверенные бренды</li>
              <li>Доступные цены и регулярные акции</li>
              <li>Быстрая доставка по всей России</li>
              <li>Индивидуальный подход к каждому клиенту</li>
              <li>Удобная система оплаты и возврата</li>
              <li>Профессиональная консультация по выбору</li>
            </ul>

            <div className="mt-10 p-6 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200">
              <p className="mb-4 text-gray-800 font-medium">
                Откройте свой Стиль города вместе с нами! Перейдите в каталог и найдите то, что подчеркнет вашу индивидуальность.
              </p>
              <a
                href="/catalog"
                className="inline-flex items-center px-6 py-3 rounded-lg bg-gradient-to-r from-gradientStart to-gradientEnd text-white font-semibold hover:shadow-lg transition-all"
              >
                Перейти в каталог
              </a>
            </div>
          </div>
        </div>
      </main>
      {/* Footer is global from RootLayout */}
    </div>
  );
}


