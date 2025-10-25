'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Package, Eye, RefreshCw, Calendar, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOrders } from '@/hooks/useApi';
import { formatDate, formatPrice, getOrderStatusText, getOrderStatusColor } from '@/lib/utils';
import { AuthUser } from '@/types';

interface OrderHistoryProps {
  user: AuthUser;
}

export const OrderHistory: React.FC<OrderHistoryProps> = ({ user }) => {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const { data: orders, loading, error, refetch } = useOrders({ userId: user.id, status: statusFilter });

  const handleRepeatOrder = async (orderId: string) => {
    // Implement repeat order logic
    console.log('Repeat order:', orderId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Ошибка загрузки заказов</p>
        <Button onClick={refetch} className="mt-4">
          Попробовать снова
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">История заказов</h2>
        <div className="flex items-center space-x-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
          >
            <option value="">Все заказы</option>
            <option value="NEW">Новые</option>
            <option value="PROCESSING">В обработке</option>
            <option value="SHIPPED">Отгружены</option>
            <option value="DELIVERED">Доставлены</option>
            <option value="CANCELLED">Отменены</option>
          </select>
        </div>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Заказов пока нет
          </h3>
          <p className="text-gray-600 mb-6">
            Оформите свой первый заказ в нашем каталоге
          </p>
          <Button asChild>
            <Link href="/catalog">Перейти к покупкам</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Заказ #{order.orderNumber}
                  </h3>
                  <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(order.createdAt)}</span>
                    </span>
                    <span>{order.items?.length || 0} товар(ов)</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPrice(Number(order.total))}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusText(order.status)}
                  </span>
                </div>
              </div>

              {/* Order items preview */}
              {order.items && order.items.length > 0 && (
                <div className="mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {order.items.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex items-center space-x-3">
                        <img
                          src={item.product.images?.[0] || '/placeholder-product.jpg'}
                          alt={item.product.title}
                          className="w-12 h-12 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {item.product.title}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.quantity} шт. × {formatPrice(Number(item.price))}
                          </p>
                        </div>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="flex items-center justify-center text-sm text-gray-600">
                        +{order.items.length - 3} товар(ов)
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Order actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {order.deliveryType === 'COURIER' && 'Доставка курьером'}
                  {order.deliveryType === 'PICKUP' && 'Самовывоз'}
                  {order.deliveryType === 'TRANSPORT' && 'Доставка транспортом'}
                  {order.trackNumber && (
                    <span className="ml-2">
                      • Трек-номер: <span className="font-medium">{order.trackNumber}</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRepeatOrder(order.id)}
                    className="flex items-center space-x-1"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Повторить</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex items-center space-x-1"
                  >
                    <Link href={`/orders/${order.id}`}>
                      <Eye className="h-4 w-4" />
                      <span>Подробнее</span>
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-center pt-6">
            <Button variant="outline">Загрузить ещё</Button>
          </div>
        </div>
      )}
    </div>
  );
};


