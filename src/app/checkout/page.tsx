'use client';

import React, { useState } from 'react';
import { useCartStore } from '@/store/cart';
import { authorizedFetch } from '@/lib/authorized-fetch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';

export default function CheckoutPage() {
  const { items, clearCart, getTotalPrice } = useCartStore();
  const { success, error } = useToast();
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuthStore();

  const [form, setForm] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    deliveryType: 'PICKUP',
    address: '',
    comment: '',
  });
  const [errorsMap, setErrorsMap] = useState<Record<string, string>>({});

  const handleSubmit = async () => {
    try {
      if (!isAuthenticated) {
        error('Требуется аккаунт', 'Создайте аккаунт или войдите перед оформлением');
        return;
      }
      if (items.length === 0) {
        error('Корзина пуста', 'Добавьте товары для оформления');
        return;
      }
      // Simple required fields validation with highlighting
      const required = ['firstName','lastName','email','phone','address'];
      const nextErrors: Record<string, string> = {};
      for (const key of required) {
        if (!form[key]) {
          nextErrors[key] = 'Обязательное поле';
        }
      }
      // basic email/phone checks
      if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
        nextErrors.email = 'Некорректный email';
      }
      if (form.phone && String(form.phone).replace(/\D/g, '').length < 10) {
        nextErrors.phone = 'Некорректный номер телефона';
      }
      setErrorsMap(nextErrors);
      if (Object.keys(nextErrors).length > 0) {
        error('Проверьте поля', 'Исправьте подсвеченные поля');
        return;
      }
      setLoading(true);
      const payload: any = {
        ...form,
        notes: form.comment,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          variantId: i.variantId,
          selectedColor: i.selectedColor,
          selectedSize: i.selectedSize,
        })),
      };
      delete payload.comment;
      const res = await authorizedFetch('/api/orders', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        error('Требуется вход', 'Авторизуйтесь, чтобы оформить заказ');
        return;
      }
      const json = await res.json();
      if (!json.success) {
        // Map server-side field errors to inputs if provided
        if (Array.isArray(json.details)) {
          const fieldErrors: Record<string, string> = {};
          for (const d of json.details) {
            if (d?.field && d?.message) fieldErrors[d.field] = d.message;
          }
          if (Object.keys(fieldErrors).length > 0) setErrorsMap(fieldErrors);
        }
        throw new Error(json.error || 'Не удалось оформить заказ');
      }
      success('Заказ оформлен', 'Мы получили ваш заказ');
      clearCart();
    } catch (e: any) {
      error('Ошибка', e.message || 'Попробуйте позже');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Оформление заказа</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {!isAuthenticated && (
            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 rounded-lg p-4">
              <p className="text-sm">
                Для оформления заказа требуется аккаунт.{' '}
                <Link href="/register" className="underline font-medium">Создайте аккаунт</Link>{' '}или{' '}
                <Link href="/login" className="underline font-medium">войдите</Link>.
              </p>
            </div>
          )}
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Контактные данные</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700">Имя</label>
                <Input value={form.firstName} onChange={(e) => { setForm({ ...form, firstName: e.target.value }); setErrorsMap((m) => ({ ...m, firstName: '' })); }} error={errorsMap.firstName} autoComplete="given-name" name="given-name" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Фамилия</label>
                <Input value={form.lastName} onChange={(e) => { setForm({ ...form, lastName: e.target.value }); setErrorsMap((m) => ({ ...m, lastName: '' })); }} error={errorsMap.lastName} autoComplete="family-name" name="family-name" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Email</label>
                <Input type="email" value={form.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrorsMap((m) => ({ ...m, email: '' })); }} error={errorsMap.email} autoComplete="email" name="email" inputMode="email" />
              </div>
              <div>
                <label className="text-sm text-gray-700">Телефон</label>
                <Input value={form.phone} onChange={(e) => { setForm({ ...form, phone: e.target.value }); setErrorsMap((m) => ({ ...m, phone: '' })); }} error={errorsMap.phone} autoComplete="tel" name="tel" inputMode="tel" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Доставка</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700">Способ доставки</label>
                <select
                  value={form.deliveryType}
                  onChange={(e) => setForm({ ...form, deliveryType: e.target.value })}
                  className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                >
                  <option value="PICKUP">Самовывоз</option>
                  <option value="COURIER">Курьер</option>
                  <option value="TRANSPORT">Транспортная компания</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-700">Адрес</label>
                <Input value={form.address} onChange={(e) => { setForm({ ...form, address: e.target.value }); setErrorsMap((m) => ({ ...m, address: '' })); }} error={errorsMap.address} autoComplete="street-address" name="street-address" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-gray-700">Комментарий</label>
                <textarea
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  rows={3}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border p-6 space-y-4">
            <h2 className="text-lg font-semibold">Ваш заказ</h2>
            {items.length === 0 ? (
              <p className="text-sm text-gray-600">Корзина пуста. <Link href="/catalog" className="text-primary-600 underline">Каталог</Link></p>
            ) : (
              <div className="space-y-3">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="line-clamp-1">{item.product.title}</span>
                    <span>{item.quantity} x {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(item.price)}</span>
                  </div>
                ))}
                <div className="pt-3 border-t flex items-center justify-between font-semibold">
                  <span>Итого</span>
                  <span>{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(getTotalPrice())}</span>
                </div>
                <Button className="w-full" onClick={handleSubmit} disabled={loading}>
                  {loading ? 'Отправка...' : 'Оформить заказ'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


