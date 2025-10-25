'use client';

import React, { useState } from 'react';
import { User, Package, MapPin, Settings, LogOut, Edit } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useLogout } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { Header } from '@/components/layout/header';
import { Footer } from '@/components/layout/footer';
import { ProfileInfo } from '@/components/profile/profile-info';
import { OrderHistory } from '@/components/profile/order-history';
import { AddressBook } from '@/components/profile/address-book';
import { AccountSettings } from '@/components/profile/account-settings';

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('profile');
  const { user, logout: logoutStore } = useAuthStore();
  const { logout } = useLogout();
  const { success } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      logoutStore();
      success('До свидания!', 'Вы успешно вышли из системы');
    } catch (error) {
      // Even if logout fails, clear local state
      logoutStore();
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Необходима авторизация
            </h1>
            <p className="text-gray-600 mb-8">
              Войдите в систему для доступа к личному кабинету
            </p>
            <Button asChild>
              <a href="/login">Войти</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const tabs = [
    {
      id: 'profile',
      name: 'Профиль',
      icon: User,
      component: ProfileInfo,
    },
    {
      id: 'orders',
      name: 'Заказы',
      icon: Package,
      component: OrderHistory,
    },
    {
      id: 'addresses',
      name: 'Адреса',
      icon: MapPin,
      component: AddressBook,
    },
    {
      id: 'settings',
      name: 'Настройки',
      icon: Settings,
      component: AccountSettings,
    },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component || ProfileInfo;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      
      <main className="flex-1 bg-gray-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xl font-bold">
                      {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      {user.firstName} {user.lastName}
                    </h1>
                    <p className="text-gray-600">{user.email}</p>
                    {user.company && (
                      <p className="text-sm text-gray-500">{user.company}</p>
                    )}
                  </div>
                </div>
                
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center space-x-2"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Выйти</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <nav className="space-y-2">
                    {tabs.map((tab) => {
                      const Icon = tab.icon;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                            activeTab === tab.id
                              ? 'bg-primary-100 text-primary-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          <span>{tab.name}</span>
                        </button>
                      );
                    })}
                  </nav>
                </div>
              </div>

              {/* Content */}
              <div className="lg:col-span-3">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <ActiveComponent user={user} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer is global from RootLayout */}
    </div>
  );
}


