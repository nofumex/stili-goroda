'use client';

import React, { useState } from 'react';
import { useUsers } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Edit, 
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Building,
  Calendar,
  ShoppingCart,
  Star
} from 'lucide-react';
import Link from 'next/link';

const roleColors = {
  CUSTOMER: 'bg-blue-100 text-blue-800',
  ADMIN: 'bg-red-100 text-red-800',
  MANAGER: 'bg-yellow-100 text-yellow-800',
  VIEWER: 'bg-gray-100 text-gray-800',
};

const roleLabels = {
  CUSTOMER: 'Клиент',
  ADMIN: 'Администратор',
  MANAGER: 'Менеджер',
  VIEWER: 'Наблюдатель',
};

export default function CustomersPage() {
  const router = useRouter();
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isBlocked: '',
    page: 1,
    limit: 20,
  });

  const { data: users, pagination, loading, error } = useUsers(filters);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Клиенты</h1>
        <div />
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по имени, email, компании..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Все роли</option>
              <option value="CUSTOMER">Клиент</option>
              <option value="ADMIN">Администратор</option>
              <option value="MANAGER">Менеджер</option>
              <option value="VIEWER">Наблюдатель</option>
            </select>
            <select
              value={filters.isBlocked}
              onChange={(e) => handleFilterChange('isBlocked', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Все статусы</option>
              <option value="false">Активные</option>
              <option value="true">Заблокированные</option>
            </select>
            <Button variant="outline" onClick={() => setFilters({ search: '', role: '', isBlocked: '', page: 1, limit: 20 })}>
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>Список клиентов</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Ошибка загрузки клиентов: {error}</p>
            </div>
          ) : users && users.length > 0 ? (
            <div className="space-y-4">
              {users.map((user: any) => (
                <div key={user.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-medium text-primary-600">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-lg">
                          {user.firstName} {user.lastName}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <p className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {user.email}
                          </p>
                          {user.phone && (
                            <p className="flex items-center">
                              <Phone className="h-4 w-4 mr-1" />
                              {user.phone}
                            </p>
                          )}
                          {user.company && (
                            <p className="flex items-center">
                              <Building className="h-4 w-4 mr-1" />
                              {user.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${roleColors[user.role as keyof typeof roleColors]}`}>
                              {roleLabels[user.role as keyof typeof roleLabels]}
                            </span>
                            {user.isBlocked && (
                              <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                Заблокирован
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <p className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {formatDate(user.createdAt)}
                            </p>
                            <p className="flex items-center">
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              {user._count?.orders || 0} заказов
                            </p>
                            <p className="flex items-center">
                              <Star className="h-4 w-4 mr-1" />
                              {user._count?.reviews || 0} отзывов
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Link href={`/admin/customers/${user.id}`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              if (!confirm('Удалить пользователя?')) return;
                              try {
                                const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE', credentials: 'include' });
                                const json = await res.json();
                                if (!json.success) {
                                  if (json.details) {
                                    alert(`${json.error}\n\nДетали:\n- Заказов: ${json.details.ordersCount}\n- Отзывов: ${json.details.reviewsCount}\n- Адресов: ${json.details.addressesCount}`);
                                  } else {
                                    throw new Error(json.error || 'Ошибка удаления');
                                  }
                                  return;
                                }
                                // simple refresh strategy
                                window.location.reload();
                              } catch (e: any) {
                                alert(e.message || 'Не удалось удалить пользователя');
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Клиенты не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination && users && users.length > 0 && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">Всего: {pagination.total}</div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              disabled={filters.page <= 1}
              onClick={() => setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))}
            >
              Предыдущая
            </Button>
            <span className="px-3">{filters.page} / {pagination.pages || 1}</span>
            <Button
              variant="outline"
              disabled={filters.page >= (pagination.pages || 1)}
              onClick={() => setFilters((f) => ({ ...f, page: Math.min((pagination.pages || 1), f.page + 1) }))}
            >
              Следующая
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
