'use client';

import React from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { Button } from '@/components/ui/button';

export const CartDrawer: React.FC = () => {
  const { isOpen, items, updateQuantity, removeItem, closeCart, getTotalPrice } = useCartStore();

  const currency = (n: number) => new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB', minimumFractionDigits: 0 }).format(n);

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? '' : 'pointer-events-none'}`} aria-hidden={!isOpen}>
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black transition-opacity ${isOpen ? 'opacity-50' : 'opacity-0'}`}
        onClick={closeCart}
      />
      {/* Panel */}
      <div
        className={`absolute right-0 top-0 h-full w-full sm:w-[420px] bg-white shadow-xl transform transition-transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
        role="dialog"
        aria-label="Корзина"
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Ваша корзина</h2>
          <button className="text-gray-500 hover:text-gray-700" onClick={closeCart} aria-label="Закрыть">×</button>
        </div>

        {items.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-4">Ваша корзина пуста. Перейдите в каталог, чтобы выбрать товары!</p>
            <Link href="/catalog" onClick={closeCart}>
              <Button className="bg-blue-100 text-blue-800 hover:bg-blue-200">В каталог</Button>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-auto p-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden flex items-center justify-center">
                      {item.product.images?.[0] && (
                        <img src={item.product.images[0]} alt={item.product.title} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-medium line-clamp-2 w-40">{item.product.title}</div>
                      {(item.selectedColor || item.selectedSize) && (
                        <div className="text-xs text-gray-600">
                          {item.selectedColor && <span>Цвет: {item.selectedColor}</span>}
                          {item.selectedColor && item.selectedSize && <span>, </span>}
                          {item.selectedSize && <span>Размер: {item.selectedSize}</span>}
                        </div>
                      )}
                      <div className="text-xs text-gray-500">{currency(item.price)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded">
                      <button className="px-2" onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>-</button>
                      <input
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          updateQuantity(item.id, Math.max(1, val));
                        }}
                        className="w-10 text-center"
                      />
                      <button className="px-2" onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <div className="w-20 text-right text-sm font-semibold">{currency(item.price * item.quantity)}</div>
                    <button className="text-red-600" onClick={() => removeItem(item.id)} aria-label="Удалить">×</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4 space-y-3">
              <div className="flex items-center justify-between text-lg">
                <span>Итого</span>
                <span className="font-bold">{currency(getTotalPrice())}</span>
              </div>
              <Link href="/checkout" onClick={closeCart}>
                <Button className="w-full bg-blue-100 text-blue-900 hover:bg-blue-200">Оформить заказ</Button>
              </Link>
              <Link href="/catalog" onClick={closeCart}>
                <Button variant="outline" className="w-full">Продолжить покупки</Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};








