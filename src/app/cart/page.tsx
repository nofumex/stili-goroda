'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();

  const currency = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(n);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-center mb-6">Ваша корзина</h1>
        <div className="bg-white border rounded-lg p-8 text-center max-w-xl mx-auto">
          <p className="text-gray-600 mb-6">Ваша корзина пуста. Перейдите в каталог, чтобы выбрать товары!</p>
          <Link href="/catalog">
            <Button className="bg-blue-100 text-blue-800 hover:bg-blue-200">В каталог</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-6">Ваша корзина</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white border rounded-lg p-6">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                    {item.product.images?.[0] && (
                      <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium">{item.product.title}</div>
                    {(item.selectedColor || (item.selectedSize && item.selectedSize !== '0')) && (
                      <div className="text-sm text-gray-600">
                        {item.selectedColor && <span>Цвет: {item.selectedColor}</span>}
                        {item.selectedColor && item.selectedSize && item.selectedSize !== '0' && <span>, </span>}
                        {item.selectedSize && item.selectedSize !== '0' && <span>Размер: {item.selectedSize}</span>}
                      </div>
                    )}
                    <div className="text-sm text-gray-500">Цена: {currency(item.price)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex items-center border rounded">
                    <button
                      className="px-3 py-1 text-lg"
                      onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                    >-
                    </button>
                    <input
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 1;
                        updateQuantity(item.id, Math.max(1, val));
                      }}
                      className="w-12 text-center"
                    />
                    <button
                      className="px-3 py-1 text-lg"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >+
                    </button>
                  </div>
                  <div className="font-semibold w-28 text-right">{currency(item.price * item.quantity)}</div>
                  <button
                    className="text-red-600 hover:text-red-700"
                    onClick={() => removeItem(item.id)}
                    aria-label="Удалить"
                    title="Удалить"
                  >×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-between text-lg">
              <span>Итого</span>
              <span className="font-bold">{currency(getTotalPrice())}</span>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href="/checkout">
                <Button className="w-full bg-blue-100 text-blue-900 hover:bg-blue-200">Оформить заказ</Button>
              </Link>
              <Link href="/catalog">
                <Button variant="outline" className="w-full">Продолжить покупки</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}








