'use client';
import React from 'react';
import { Clock, Calendar, MapPin, Phone, Mail } from 'lucide-react';
import { usePublicSettings } from '@/hooks/useApi';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';

export default function ContactsPage() {
  const { data: publicSettings } = usePublicSettings();
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      <main className="flex-1 bg-white">
        <div className="container mx-auto px-4 py-12 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent mb-8">Контакты</h1>

          <div className="prose prose-lg max-w-none text-gray-800">
            <p className="text-lg"><strong>Свяжитесь с нами</strong> удобным для вас способом!</p>
            <p>Мы всегда рады помочь с выбором товаров, ответить на вопросы о доставке и оплате.</p>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Наши контакты</h2>
            
            <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6 mb-6 space-y-4 animate-fade-in">
              {/* Телефон */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300 group">
                <div className="bg-blue-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Phone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Телефон</p>
                  <a href={`tel:${publicSettings?.contactPhone || ''}`} className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors">
                    {publicSettings?.contactPhone || '+7 (495) 123-45-67'}
                  </a>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-300 group">
                <div className="bg-purple-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Email</p>
                  <a href={`mailto:${publicSettings?.contactEmail || ''}`} className="text-lg font-bold text-gray-900 hover:text-purple-600 transition-colors">
                    {publicSettings?.contactEmail || 'info@stili-goroda.ru'}
                  </a>
                </div>
              </div>

              {/* Адрес */}
              <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300 group">
                <div className="bg-green-500 p-3 rounded-xl group-hover:scale-110 transition-transform">
                  <MapPin className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 font-medium">Адрес</p>
                  <p className="text-lg font-bold text-gray-900">
                    {publicSettings?.address || 'г. Москва, ул. Примерная, д. 123'}
                  </p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-semibold mt-8 mb-4">Мы в социальных сетях</h2>
            <ul className="space-y-2">
              {(publicSettings?.socialLinks || []).map((s: any, i: number) => (
                <li key={i}>
                  <a 
                    href={(s.url || '').startsWith('http') ? s.url : `https://${s.url}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-primary-600 hover:text-accent font-medium hover:underline"
                  >
                    {s.label} — {s.url}
                  </a>
                </li>
              ))}
            </ul>

            {(publicSettings?.extraContacts || []).length > 0 && (
              <>
                <h3 className="text-xl font-semibold mt-8 mb-4">Дополнительные контакты</h3>
                <ul className="space-y-2">
                  {(publicSettings?.extraContacts || []).map((group: any, idx: number) => (
                    <li key={idx}>
                      <strong>{group.title}:</strong> {Array.isArray(group.values) ? group.values.join(', ') : ''}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Режим работы */}
            <div className="mt-10 bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden animate-fade-in">
              {/* Заголовок */}
              <div className="bg-gradient-to-r from-primary-600 to-accent p-6">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Режим работы</h3>
                </div>
              </div>

              {/* Список дней */}
              <div className="p-6 space-y-3">
                {/* Понедельник - Пятница */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="bg-green-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Понедельник — Пятница</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Clock className="h-4 w-4 text-green-600" />
                    <span className="font-bold text-green-700">09:00 – 18:00</span>
                  </div>
                </div>

                {/* Суббота */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Суббота</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="font-bold text-blue-700">10:00 – 14:00</span>
                  </div>
                </div>

                {/* Воскресенье */}
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500 p-2 rounded-lg group-hover:scale-110 transition-transform">
                      <Calendar className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-gray-900">Воскресенье</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-sm">
                    <span className="font-bold text-red-700">Выходной</span>
                  </div>
                </div>
              </div>

              {/* Нижний баннер */}
              <div className="bg-gradient-to-r from-primary-50 to-accent-50 p-4 border-t border-gray-100">
                <p className="text-center text-sm text-gray-600">
                  💬 <strong>Всегда на связи!</strong> Отвечаем на вопросы в мессенджерах круглосуточно
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      {/* Footer is global from RootLayout */}
    </div>
  );
}


