'use client';

import React, { useState } from 'react';
import { useAnalytics } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  Calendar,
  Download
} from 'lucide-react';

export default function AnalyticsPage() {
  const [period, setPeriod] = useState('30d');
  const { data: analytics, loading, error } = useAnalytics({ period });

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ru-RU').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Ошибка загрузки аналитики: {error}</p>
        </div>
      </div>
    );
  }

  const stats = analytics?.overview || {};

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Аналитика</h1>
        <div className="flex space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          {['7d', '30d', '90d', '1y'].map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === '7d' ? '7 дней' : 
               p === '30d' ? '30 дней' : 
               p === '90d' ? '90 дней' : '1 год'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общая выручка</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground flex items-center">
              {stats.revenueGrowth >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              {Math.abs(stats.revenueGrowth || 0).toFixed(1)}% к прошлому периоду
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalOrders || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatNumber(stats.newOrders || 0)} за период
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего клиентов</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalUsers || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +{formatNumber(stats.newUsers || 0)} за период
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Средний чек</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageOrderValue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Конверсия: {stats.conversionRate?.toFixed(1) || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Выручка по дням
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.revenueChart && analytics.revenueChart.length > 0 ? (
              <div className="space-y-4">
                <div className="h-64 flex items-end space-x-1">
                  {analytics.revenueChart.map((item: any, index: number) => {
                    const maxRevenue = Math.max(...analytics.revenueChart.map((r: any) => r.revenue));
                    const height = (item.revenue / maxRevenue) * 100;
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div
                          className="bg-primary-500 rounded-t w-full"
                          style={{ height: `${height}%` }}
                        ></div>
                        <div className="text-xs text-gray-600 mt-2 transform -rotate-45 origin-left">
                          {formatDate(item.date)}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="text-center text-sm text-gray-600">
                  Период: {formatDate(analytics.period.from)} - {formatDate(analytics.period.to)}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Статусы заказов
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics?.orderStats && analytics.orderStats.length > 0 ? (
              <div className="space-y-4">
                {analytics.orderStats.map((stat: any, index: number) => {
                  const total = analytics.orderStats.reduce((sum: number, s: any) => sum + s.count, 0);
                  const percentage = (stat.count / total) * 100;
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">{stat.status}</span>
                        <span className="text-gray-600">{stat.count} ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Нет данных для отображения
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      {analytics?.topProducts && analytics.topProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Package className="h-5 w-5 mr-2" />
              Популярные товары
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topProducts.slice(0, 10).map((product: any, index: number) => (
                <div key={product.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm font-medium text-primary-600">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-gray-600">{product.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{product.salesCount} продаж</p>
                    <p className="text-sm text-gray-600">
                      {formatCurrency(Number(product.price))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Statistics */}
      {analytics?.userStats && analytics.userStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2" />
              Статистика пользователей
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {analytics.userStats.map((stat: any, index: number) => (
                <div key={index} className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary-600">{stat.count}</div>
                  <div className="text-sm text-gray-600">{stat.role}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
