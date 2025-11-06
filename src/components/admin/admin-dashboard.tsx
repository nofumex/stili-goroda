'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Eye,
  Plus,
  DollarSign,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/lib/utils';

export const AdminDashboard: React.FC = () => {
  // Убраны мок‑данные. Блоки ниже отображают только структуру интерфейса.
  const stats = { totalRevenue: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0, revenueChange: 0, ordersChange: 0, productsChange: 0, customersChange: 0 };
  const recentOrders: any[] = [];
  const topProducts: any[] = [];
  const lowStockProducts: any[] = [];

  const getStatusColor = (status: string) => {
    const colors = {
      NEW: 'bg-blue-100 text-blue-800',
      PROCESSING: 'bg-yellow-100 text-yellow-800',
      SHIPPED: 'bg-purple-100 text-purple-800',
      DELIVERED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      NEW: 'Новый',
      PROCESSING: 'В обработке',
      SHIPPED: 'Отгружен',
      DELIVERED: 'Доставлен',
      CANCELLED: 'Отменён',
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent">Панель управления</h1>
          <p className="text-gray-600">
            Добро пожаловать в админ-панель Стиль Города
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" asChild>
            <Link href="/admin/products/create" className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Link>
          </Button>
          <Button asChild>
            <Link href="/admin/orders" className="inline-flex items-center">
              <Eye className="h-4 w-4 mr-2" />
              Все заказы
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Выручка</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatPrice(stats.totalRevenue)}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.revenueChange > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${stats.revenueChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(stats.revenueChange)}%
            </span>
            <span className="text-sm text-gray-500 ml-2">с прошлого месяца</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Заказы</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <ShoppingCart className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.ordersChange > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${stats.ordersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(stats.ordersChange)}%
            </span>
            <span className="text-sm text-gray-500 ml-2">с прошлого месяца</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Товары</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.productsChange > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${stats.productsChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(stats.productsChange)}%
            </span>
            <span className="text-sm text-gray-500 ml-2">с прошлого месяца</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Клиенты</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
            </div>
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center">
            {stats.customersChange > 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
            )}
            <span className={`text-sm font-medium ${stats.customersChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {Math.abs(stats.customersChange)}%
            </span>
            <span className="text-sm text-gray-500 ml-2">с прошлого месяца</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Последние заказы</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/orders">Все заказы</Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                    <p className="text-xs text-gray-500">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(order.total)}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top products */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Популярные товары</h2>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/analytics">Аналитика</Link>
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {topProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 line-clamp-1">{product.title}</p>
                    <p className="text-sm text-gray-600">{product.sales} продаж</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{formatPrice(product.revenue)}</p>
                    <p className={`text-sm ${product.stock <= 5 ? 'text-red-600' : 'text-gray-600'}`}>
                      Склад: {product.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Товары с низким остатком</h2>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {lowStockProducts.map((product) => (
                <div key={product.id} className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <p className="font-medium text-gray-900 mb-2 line-clamp-2">{product.title}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Остаток: <span className="font-medium text-orange-600">{product.stock}</span>
                    </span>
                    <span className="text-sm text-gray-600">
                      Мин: {product.minStock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/products?filter=low-stock">
                  Посмотреть все товары с низким остатком
                </Link>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 items-stretch">
          <Button variant="outline" className="h-full" asChild>
            <Link href="/admin/products/create" className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center break-words">
              <Plus className="h-6 w-6" />
              <span>Добавить товар</span>
            </Link>
          </Button>
          
          <Button variant="outline" className="h-full" asChild>
            <Link href="/admin/import-export" className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center break-words">
              <Package className="h-6 w-6" />
              <span>Импорт/Экспорт</span>
            </Link>
          </Button>
          
          <Button variant="outline" className="h-full" asChild>
            <Link href="/admin/customers" className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center break-words">
              <Users className="h-6 w-6" />
              <span>Управление клиентами</span>
            </Link>
          </Button>
          
          <Button variant="outline" className="h-full" asChild>
            <Link href="/admin/analytics" className="flex h-full w-full flex-col items-center justify-center gap-2 p-4 text-center break-words">
              <TrendingUp className="h-6 w-6" />
              <span>Аналитика</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};


