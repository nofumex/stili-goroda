'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PageProps { params: { id: string } }

export default function OrderDetailPage({ params }: PageProps) {
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/orders/${params.id}`, { credentials: 'include' });
        const json = await res.json();
        if (!json?.success) throw new Error(json?.error || 'Ошибка получения заказа');
        setOrder(json.data);
      } catch (e: any) {
        setError(e?.message || 'Ошибка получения заказа');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-1/3 bg-gray-200 rounded mb-4" />
        <div className="h-40 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            <p className="text-gray-700">{error || 'Заказ не найден'}</p>
            <Button variant="outline" onClick={() => router.push('/profile')}>Назад в профиль</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Заказ #{order.orderNumber}</h1>
        <Button variant="outline" onClick={() => router.back()}>Назад</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Состав заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {order.items?.map((item: any) => (
            <div key={item.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img src={item.product?.images?.[0] || '/placeholder-product.jpg'} alt={item.product?.title} className="w-12 h-12 object-cover rounded" />
                <div>
                  <div className="font-medium">{item.product?.title}</div>
                  <div className="text-sm text-gray-600">{item.quantity} шт.</div>
                </div>
              </div>
              <div className="font-medium">{Number(item.total).toLocaleString('ru-RU')} ₽</div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}












