'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingCart, User, Search, Phone, LayoutDashboard, MapPin, Mail } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { usePublicSettings } from '@/hooks/useApi';

export const Header: React.FC = () => {
  const [mounted, setMounted] = useState(false);
  React.useEffect(() => setMounted(true), []);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mobileSearchTerm, setMobileSearchTerm] = useState('');
  const { user, isAuthenticated } = useAuthStore();
  const { getTotalItems } = useCartStore();
  const router = useRouter();
  const cartItemsCount = getTotalItems();
  const { data: publicSettings } = usePublicSettings();

  const navigation = [
    { name: 'Главная', href: '/' },
    // External link: Фотопрайсы (Google Drive)
    ...(publicSettings?.photoPricesUrl
      ? [{ name: 'Фотопрайсы', href: publicSettings.photoPricesUrl }]
      : [] as { name: string; href: string }[]),
    { name: 'О компании', href: '/about' },
    { name: 'Избранное', href: '/favorites' },
    { name: 'Отзывы', href: '/reviews' },
    { name: 'Контакты', href: '/contacts' },
  ];

  if (!mounted) {
    return null;
  }

  return (
    <header className="bg-white shadow-lg border-b border-gray-100">
      {/* Top bar */}
      <div className="bg-gradient-to-r from-primary-600 via-primary-700 to-accent py-2.5 animate-gradient">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center text-sm text-white">
            {/* Левые контакты */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <div className="flex items-center space-x-1 hover:text-accent-100 transition-colors">
                <MapPin className="h-4 w-4" />
                <span>{publicSettings?.address || ''}</span>
              </div>
              <div className="flex items-center space-x-1 hover:text-accent-100 transition-colors">
                <Phone className="h-4 w-4" />
                <span>{publicSettings?.contactPhone || ''}</span>
              </div>
              <div className="flex items-center space-x-1 hover:text-accent-100 transition-colors">
                <Mail className="h-4 w-4" />
                <span>{publicSettings?.contactEmail || ''}</span>
              </div>
            </div>
            {/* Правая кнопка Wildberries */}
            <a
              href="https://www.wildberries.ru/seller/4473987"
              className="wildberries-btn hidden md:inline-flex items-center px-4 py-1.5 ml-2 rounded-full font-semibold transition-all duration-200 shadow-xl gradient-primary hover:scale-105 hover:shadow-2xl animate-fade-in"
              target="_blank"
              rel="noopener noreferrer"
              title="Покупайте на WildBerries — наш официальный магазин"
            >
              <svg width="28" height="18" viewBox="0 0 28 18" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                <circle cx="14" cy="9" r="9" fill="#B937C6" />
                <text x="50%" y="54%" textAnchor="middle" fill="white" font-size="9" dy=".3em" font-weight="bold" font-family="Arial,sans-serif">WB</text>
              </svg>
              <span>Мы на WildBerries</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="container mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            {publicSettings?.logo ? (
              <img
                src={publicSettings.logo}
                alt="Логотип"
                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
              />
            ) : (
              <div className="w-12 h-12 bg-gradient-to-br from-gradientStart to-gradientEnd rounded-xl flex items-center justify-center shadow-xl hover:shadow-2xl transition-all duration-300 group-hover:scale-110 animate-glow">
                <span className="text-white font-bold text-xl">СГ</span>
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-shine">Стили Города</h1>
              <p className="text-sm text-gray-500 font-medium">Городские стили и аксессуары</p>
            </div>
          </Link>

          {/* Search bar */}
          <div className="hidden lg:flex flex-1 max-w-lg mx-8">
            <div className="relative w-full group">
              <input
                type="text"
                placeholder="Поиск товаров..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-300 hover:border-primary-300 shadow-sm hover:shadow-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = searchTerm.trim();
                    if (q) router.push(`/?search=${encodeURIComponent(q)}`);
                  }
                }}
              />
              <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400 group-hover:text-primary-500 transition-colors" />
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center space-x-4">
            {/* Cart */}
            <button
              onClick={() => router.push('/cart')}
              className="relative p-3 text-gray-600 hover:text-primary-600 transition-all duration-300 hover:scale-110 rounded-xl hover:bg-primary-50"
            >
              <ShoppingCart className="h-6 w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-6 w-6 bg-gradient-to-r from-primary-600 to-accent text-white text-xs font-bold rounded-full flex items-center justify-center animate-pulse-slow shadow-lg">
                  {cartItemsCount}
                </span>
              )}
            </button>

            {/* User menu */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                user?.role === 'ADMIN' ? (
                  <Link href="/admin">
                    <Button variant="secondary" size="sm" className="shadow-md hover:shadow-lg transition-all">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Админ‑панель
                    </Button>
                  </Link>
                ) : (
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="hover:bg-primary-50">
                      <User className="h-4 w-4 mr-2" />
                      {user?.firstName}
                    </Button>
                  </Link>
                )
              ) : (
                <Link href="/login">
                  <Button size="sm" className="btn-shimmer shadow-lg">
                    Войти
                  </Button>
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-primary-600"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:block mt-6 pb-2">
          <ul className="flex justify-center space-x-8">
            {navigation.map((item) => (
              <li key={item.name}>
                {item.href.startsWith('http') ? (
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-700 hover:text-primary-600 font-semibold transition-all duration-300 relative group py-2"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent group-hover:w-full transition-all duration-300"></span>
                  </a>
                ) : (
                  <Link
                    href={item.href}
                    className="text-gray-700 hover:text-primary-600 font-semibold transition-all duration-300 relative group py-2"
                  >
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-primary-600 to-accent group-hover:w-full transition-all duration-300"></span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {/* Mobile search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Поиск товаров..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                value={mobileSearchTerm}
                onChange={(e) => setMobileSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const q = mobileSearchTerm.trim();
                    if (q) {
                      setIsMenuOpen(false);
                      router.push(`/?search=${encodeURIComponent(q)}`);
                    }
                  }
                }}
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            {/* Mobile navigation */}
            <nav className="space-y-2">
              {navigation.map((item) => (
                item.href.startsWith('http') ? (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </a>
                ) : (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="block py-2 text-gray-700 hover:text-primary-600 font-medium"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                )
              ))}
            </nav>

            {/* Mobile auth/admin */}
            <div className="pt-4 border-t space-y-2">
              {isAuthenticated ? (
                user?.role === 'ADMIN' ? (
                  <Link href="/admin" className="block py-2 text-primary-700">
                    Админ‑панель
                  </Link>
                ) : null
              ) : (
                <>
                  <Link href="/login" className="block py-2 text-gray-700">
                    Вход
                  </Link>
                  <Link href="/register" className="block py-2 text-gray-700">
                    Регистрация
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};


