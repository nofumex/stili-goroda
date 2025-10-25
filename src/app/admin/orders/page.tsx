'use client';

import React, { useState, useEffect } from 'react';
import { useOrders } from '@/hooks/useApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  Filter, 
  Edit, 
  MoreHorizontal,
  Calendar,
  User,
  Package,
  Trash2
} from 'lucide-react';

const statusColors = {
  NEW: 'bg-blue-100 text-blue-800',
  PROCESSING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  NEW: 'Новый',
  PROCESSING: 'В обработке',
  SHIPPED: 'Отправлен',
  DELIVERED: 'Доставлен',
  CANCELLED: 'Отменен',
};

export default function OrdersPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    page: 1,
    limit: 20,
  });

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    orderId: string | null;
    orderNumber: string | null;
  }>({
    isOpen: false,
    orderId: null,
    orderNumber: null,
  });

  const [isDeleting, setIsDeleting] = useState(false);

  const { data: orders, loading, error, refetch } = useOrders(filters);

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handleDeleteOrder = (orderId: string, orderNumber: string) => {
    setDeleteModal({
      isOpen: true,
      orderId,
      orderNumber,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.orderId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/orders/${deleteModal.orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем список заказов
        if (refetch) {
          refetch();
        }
        setDeleteModal({ isOpen: false, orderId: null, orderNumber: null });
        // Можно добавить уведомление об успешном удалении
      } else {
        console.error('Ошибка удаления заказа:', result.error);
        // Можно добавить уведомление об ошибке
      }
    } catch (error) {
      console.error('Ошибка удаления заказа:', error);
      // Можно добавить уведомление об ошибке
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setDeleteModal({ isOpen: false, orderId: null, orderNumber: null });
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
        <h1 className="text-3xl font-bold text-gray-900">Заказы</h1>
        <Button>
          <Package className="h-4 w-4 mr-2" />
          Новый заказ
        </Button>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Поиск по номеру, имени, email..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
            >
              <option value="">Все статусы</option>
              <option value="NEW">Новый</option>
              <option value="PROCESSING">В обработке</option>
              <option value="SHIPPED">Отправлен</option>
              <option value="DELIVERED">Доставлен</option>
              <option value="CANCELLED">Отменен</option>
            </select>
            <Button variant="outline" onClick={() => setFilters({ search: '', status: '', page: 1, limit: 20 })}>
              Сбросить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      <Card>
        <CardHeader>
          <CardTitle>Список заказов</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600">Ошибка загрузки заказов: {error}</p>
            </div>
          ) : orders && orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order: any) => (
                <div key={order.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h3 className="font-medium text-lg">#{order.orderNumber}</h3>
                          <p className="text-sm text-gray-600">
                            {order.firstName} {order.lastName}
                          </p>
                        </div>
                        <div className="text-sm text-gray-600">
                          <p className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {order.email}
                          </p>
                          <p className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(order.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="text-lg font-bold">{formatCurrency(Number(order.total))}</p>
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[order.status as keyof typeof statusColors]}`}>
                            {statusLabels[order.status as keyof typeof statusLabels]}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm" asChild>
                            <a href={`/admin/orders/${order.id}`}>
                              <Edit className="h-4 w-4" />
                            </a>
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteOrder(order.id, order.orderNumber)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Товары в заказе:</h4>
                      <div className="space-y-2">
                        {order.items.map((item: any, index: number) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-3">
                              {item.product?.images?.[0] && (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.title}
                                  className="w-10 h-10 object-cover rounded"
                                />
                              )}
                              <div>
                                <p className="font-medium">{item.product?.title}</p>
                                <p className="text-gray-600">Артикул: {item.product?.sku}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p>{item.quantity} шт.</p>
                              <p className="font-medium">{formatCurrency(Number(item.price))}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Заказы не найдены</h3>
              <p className="text-gray-600">Попробуйте изменить параметры поиска</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {orders && orders.length > 0 && (
        <div className="flex justify-center">
          <div className="flex items-center space-x-2">
            <Button variant="outline" disabled>
              Предыдущая
            </Button>
            <Button variant="outline" className="bg-primary-600 text-white">
              1
            </Button>
            <Button variant="outline">2</Button>
            <Button variant="outline">3</Button>
            <Button variant="outline">
              Следующая
            </Button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Подтверждение удаления
            </h3>
            <p className="text-gray-600 mb-6">
              Вы уверены, что хотите удалить заказ #{deleteModal.orderNumber}? 
              Это действие нельзя отменить.
            </p>
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={cancelDelete}
                disabled={isDeleting}
              >
                Отмена
              </Button>
              <Button
                variant="destructive"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {isDeleting ? 'Удаление...' : 'Удалить'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
