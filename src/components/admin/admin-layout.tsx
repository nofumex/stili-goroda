'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  BarChart3, 
  Settings, 
  Upload, 
  Download,
  X,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Hide public site header/footer on admin pages
  useEffect(() => {
    document.body.classList.add('admin-page');
    return () => {
      document.body.classList.remove('admin-page');
    };
  }, []);
  
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser, logout: logoutStore } = useAuthStore();
  const { logout } = useLogout();
  const { success } = useToast();

  useEffect(() => {
    let isMounted = true;
    const hydrateUser = async () => {
      try {
        setAuthError(null);
        console.log('AdminLayout: Starting auth check, current user:', user);
        
        // If we already have a user with correct role, no need to fetch
        if (user && (user.role === 'ADMIN' || user.role === 'MANAGER')) {
          console.log('AdminLayout: User already authenticated with correct role');
          if (isMounted) setCheckingAuth(false);
          return;
        }

        console.log('AdminLayout: Fetching user from server...');
        // Try to fetch current user from server session
        const res = await fetch('/api/auth/me', { 
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('AdminLayout: /api/auth/me response:', res.status, res.statusText);
        
        if (res.ok) {
          const json = await res.json();
          console.log('AdminLayout: User data received:', json);
          const fetchedUser = json?.data?.user;
          if (fetchedUser && (fetchedUser.role === 'ADMIN' || fetchedUser.role === 'MANAGER')) {
            setUser(fetchedUser);
            if (isMounted) setCheckingAuth(false);
            return;
          } else {
            console.log('AdminLayout: User role not sufficient:', fetchedUser?.role);
          }
        }

        // If unauthorized, try to refresh token and retry once
        if (res.status === 401) {
          console.log('AdminLayout: 401 received, trying to refresh token...');
          try {
            const refreshRes = await fetch('/api/auth/refresh', {
              method: 'POST',
              credentials: 'include',
              headers: {
                'Content-Type': 'application/json',
              }
            });
            
            console.log('AdminLayout: Refresh response:', refreshRes.status, refreshRes.statusText);
            
            if (refreshRes.ok) {
              const meRetry = await fetch('/api/auth/me', { 
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                }
              });
              
              console.log('AdminLayout: Retry /api/auth/me response:', meRetry.status, meRetry.statusText);
              
              if (meRetry.ok) {
                const json = await meRetry.json();
                const fetchedUser = json?.data?.user;
                if (fetchedUser && (fetchedUser.role === 'ADMIN' || fetchedUser.role === 'MANAGER')) {
                  setUser(fetchedUser);
                  if (isMounted) setCheckingAuth(false);
                  return;
                }
              }
            }
          } catch (refreshError) {
            console.error('AdminLayout: Refresh token error:', refreshError);
          }
        }

        // Not authorized
        console.log('AdminLayout: Not authorized, redirecting to login');
        if (isMounted) {
          setCheckingAuth(false);
          setAuthError('Недостаточно прав для доступа к админ-панели');
          router.push('/login');
        }
      } catch (error) {
        console.error('AdminLayout: Auth check error:', error);
        if (isMounted) {
          setCheckingAuth(false);
          setAuthError('Ошибка проверки аутентификации');
          router.push('/login');
        }
      }
    };

    hydrateUser();
    return () => {
      isMounted = false;
    };
  }, [user, setUser, router]);

  const handleLogout = async () => {
    try {
      await logout();
      logoutStore();
      success('До свидания!', 'Вы успешно вышли из админ-панели');
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      logoutStore();
      router.push('/login');
    }
  };

  const navigation = [
    {
      name: 'Главная',
      href: '/admin',
      icon: LayoutDashboard,
      current: pathname === '/admin',
    },
    {
      name: 'Товары',
      href: '/admin/products',
      icon: Package,
      current: pathname.startsWith('/admin/products'),
    },
    {
      name: 'Заказы',
      href: '/admin/orders',
      icon: ShoppingCart,
      current: pathname.startsWith('/admin/orders'),
    },
    {
      name: 'Клиенты',
      href: '/admin/customers',
      icon: Users,
      current: pathname.startsWith('/admin/customers'),
    },
    {
      name: 'Категории',
      href: '/admin/categories',
      icon: Package,
      current: pathname.startsWith('/admin/categories'),
    },
    {
      name: 'Аналитика',
      href: '/admin/analytics',
      icon: BarChart3,
      current: pathname.startsWith('/admin/analytics'),
    },
    {
      name: 'Импорт/Экспорт',
      href: '/admin/import-export',
      icon: Upload,
      current: pathname.startsWith('/admin/import-export'),
    },
    {
      name: 'Настройки',
      href: '/admin/settings',
      icon: Settings,
      current: pathname.startsWith('/admin/settings'),
    },
  ];

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Загрузка...</h1>
          <p className="text-gray-600">Проверяем доступ к админ-панели</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-bold">Ошибка аутентификации</p>
            <p>{authError}</p>
          </div>
          <Button onClick={() => router.push('/login')}>
            Перейти к входу
          </Button>
        </div>
      </div>
    );
  }

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MANAGER')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Доступ запрещён
          </h1>
          <p className="text-gray-600 mb-8">
            У вас недостаточно прав для доступа к админ-панели
          </p>
          <Button onClick={() => router.push('/')}>
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <Link href="/admin" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">ТК</span>
              </div>
              <span className="font-semibold text-gray-900">Админ-панель</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded-md hover:bg-gray-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    item.current
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Quick actions */}
            <div className="pt-6 mt-6 border-t border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Быстрые действия
              </p>
              <div className="space-y-2">
                <Link
                  href="/admin/import-export"
                  className="flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                >
                  <Upload className="h-4 w-4" />
                  <span>Импорт/Экспорт</span>
                </Link>
              </div>
            </div>
          </nav>

          {/* User info */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-gray-700">
                  {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user.role === 'ADMIN' ? 'Администратор' : 'Менеджер'}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="w-full mb-2"
            >
              <Link href="/" target="_blank">Перейти на сайт</Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full flex items-center space-x-2"
            >
              <LogOut className="h-4 w-4" />
              <span>Выйти</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};