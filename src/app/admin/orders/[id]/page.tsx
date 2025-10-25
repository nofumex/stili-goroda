'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface PageProps { params: { id: string } }

export default function AdminOrderDetailPage({ params }: PageProps) {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('');
  const [trackNumber, setTrackNumber] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/orders/${params.id}`);
        const json = await res.json();
        if (json.success) {
          setOrder(json.data);
          setStatus(json.data.status);
          setTrackNumber(json.data.trackNumber || '');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const handleSave = async () => {
    try {
      setSaving(true);
      await fetch(`/api/orders/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, trackNumber }),
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6">Загрузка...</div>;
  if (!order) return <div className="p-6">Заказ не найден</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/admin/orders" className="text-sm text-gray-600 hover:text-gray-900">Назад к заказам</Link>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-900 font-medium">Заказ #{order.orderNumber}</span>
        </div>
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Состав заказа</h2>
            <div className="space-y-3">
              {order.items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    {item.product?.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product?.title} className="w-10 h-10 rounded object-cover" />
                    )}
                    <div>
                      <div className="font-medium">{item.product?.title}</div>
                      <div className="text-gray-500">SKU: {item.product?.sku}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div>{item.quantity} шт.</div>
                    <div className="font-medium">{Number(item.price).toLocaleString('ru-RU')} ₽</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Покупатель</h2>
            <div className="text-sm text-gray-700">
              <div>{order.firstName} {order.lastName}</div>
              <div>{order.email}</div>
              <div>{order.phone}</div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Управление</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-700">Статус</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="NEW">Новый</option>
                  <option value="PROCESSING">В обработке</option>
                  <option value="SHIPPED">Отправлен</option>
                  <option value="DELIVERED">Доставлен</option>
                  <option value="CANCELLED">Отменен</option>
                </select>
              </div>
              <div>
                <label className="text-sm text-gray-700">Трек-номер</label>
                <Input value={trackNumber} onChange={(e) => setTrackNumber(e.target.value)} />
              </div>
              <div className="pt-2 border-t text-sm">
                <div className="flex items-center justify-between">
                  <span>Итого</span>
                  <span className="font-semibold">{Number(order.total).toLocaleString('ru-RU')} ₽</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








