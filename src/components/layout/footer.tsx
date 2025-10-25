'use client';
import React from 'react';
import Link from 'next/link';
import { Phone, Mail, MapPin, Clock } from 'lucide-react';
import { usePublicSettings } from '@/hooks/useApi';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  const { data: publicSettings } = usePublicSettings();

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white relative overflow-hidden">
      {/* Декоративные элементы */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-primary-500 to-accent rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-accent to-primary-500 rounded-full blur-3xl animate-float-x"></div>
      </div>
      
      <div className="container mx-auto px-4 py-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Company info */}
          <div className="space-y-5">
            <div className="flex items-center space-x-3 group">
              <div className="w-12 h-12 bg-gradient-to-br from-gradientStart to-gradientEnd rounded-xl flex items-center justify-center shadow-2xl group-hover:shadow-primary-500/50 transition-all duration-300 animate-glow">
                <span className="text-white font-bold text-xl">СГ</span>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-shine">Стили Города</h3>
                <p className="text-sm text-gray-400 font-medium">Городские стили и аксессуары</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              «Стили Города» — интернет-магазин городской одежды и аксессуаров. 
              Широкий выбор стильных товаров, быстрая доставка, индивидуальный подход к каждому клиенту.
            </p>
          </div>

          {/* Navigation */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Навигация</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Главная
                </Link>
              </li>
              <li>
                <Link href="/catalog" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Каталог
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  О компании
                </Link>
              </li>
              <li>
                <Link href="/favorites" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Избранное
                </Link>
              </li>
              <li>
                <Link href="/contacts" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Контакты
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Услуги</h4>
            <ul className="space-y-3">
              <li>
                <Link href="/services/custom" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Индивидуальная отшивка
                </Link>
              </li>
              <li>
                <Link href="/services/wholesale" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Оптовые поставки
                </Link>
              </li>
              <li>
                <Link href="/services/samples" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Заказ образцов
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Часто задаваемые вопросы
                </Link>
              </li>
              <li>
                <Link href="/return" className="text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group">
                  <span className="w-0 h-0.5 bg-gradient-to-r from-primary-500 to-accent group-hover:w-4 transition-all duration-300"></span>
                  Возврат и обмен
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact info */}
          <div className="space-y-5">
            <h4 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Контакты</h4>
            <div className="space-y-4">
              <div className="group">
                <div className="text-gray-400 text-sm mb-1">Адрес</div>
                <div className="text-white font-semibold group-hover:text-primary-300 transition-colors">{publicSettings?.address || ''}</div>
              </div>
              <div className="group">
                <div className="text-gray-400 text-sm mb-1">Единый номер телефона</div>
                <a href={`tel:${publicSettings?.contactPhone || ''}`} className="text-white font-semibold hover:text-primary-300 transition-colors">{publicSettings?.contactPhone || ''}</a>
              </div>
              <div className="group">
                <div className="text-gray-400 text-sm mb-1">Единая почта</div>
                <a href={`mailto:${publicSettings?.contactEmail || ''}`} className="text-white font-semibold hover:text-primary-300 transition-colors">{publicSettings?.contactEmail || ''}</a>
              </div>
              <div className="text-gray-400 text-sm">660048, г. Красноярск, ул. Маерчака, 49Г, склад № 5Б</div>
              {(publicSettings?.extraContacts || []).length > 0 && (
                <div className="space-y-3 mt-4">
                  {publicSettings?.extraContacts?.map((group: any, idx: number) => (
                    <div key={idx}>
                      <div className="text-gray-300">{group.title}</div>
                      {(group.values || []).map((v: string, i: number) => (
                        <div key={i} className="text-white">{v}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-12 border-t border-gray-700/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center space-y-3 group">
              <div className="relative inline-block">
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 group-hover:scale-110 transition-transform duration-300">20+</div>
                <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary-500 to-accent opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </div>
              <p className="text-gray-300 font-semibold">лет на рынке</p>
            </div>
            <div className="text-center space-y-3 group">
              <div className="relative inline-block">
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 group-hover:scale-110 transition-transform duration-300">5000+</div>
                <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary-500 to-accent opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </div>
              <p className="text-gray-300 font-semibold">довольных клиентов</p>
            </div>
            <div className="text-center space-y-3 group">
              <div className="relative inline-block">
                <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 group-hover:scale-110 transition-transform duration-300">24/7</div>
                <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-primary-500 to-accent opacity-50 group-hover:opacity-75 transition-opacity"></div>
              </div>
              <p className="text-gray-300 font-semibold">поддержка клиентов</p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mt-16">
          <h4 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400 mb-6">Наш адрес на карте</h4>
          <div className="w-full h-80 rounded-2xl overflow-hidden border-2 border-gray-700/50 shadow-2xl hover:shadow-primary-500/20 transition-all duration-500">
            <iframe
              title={"Карта — " + (publicSettings?.address || '')}
              src={"https://www.google.com/maps?q=" + encodeURIComponent(publicSettings?.address || '') + "&output=embed"}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-16 pt-8 border-t border-gray-700/50">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-gray-400 text-sm font-medium">
              © {currentYear} «Стили Города». Все права защищены.
            </div>
            <div className="flex items-center">
              <a
                href="https://casadigital.ru/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-xl border-2 border-gray-700/50 bg-gray-800/40 backdrop-blur-sm px-4 py-3 text-gray-300 hover:text-white hover:border-primary-500/50 hover:bg-gray-800 transition-all duration-300 hover:shadow-lg hover:shadow-primary-500/20"
                aria-label="Сайт разработан агентством Casa Digital"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-lg group-hover:scale-110 transition-transform">
                  <img
                    src="/CasaDigitalLogo.png"
                    alt="Casa Digital"
                    className="h-7 w-7 object-contain"
                  />
                </span>
                <span className="text-sm">Сайт разработан агентством <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Casa Digital</span></span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};


