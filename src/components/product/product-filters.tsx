'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePublicSettings } from '@/hooks/useApi';
import { Input } from '@/components/ui/input';

interface Category {
  id: string;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
}

interface ProductFiltersProps {
  filters: {
    category: string;
    priceMin?: number;
    priceMax?: number;
    inStock?: boolean;
    productCategory: string;
    material: string;
    sortBy: string;
    sortOrder: string;
  };
  onFiltersChange: (filters: any) => void;
  categories: Category[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFiltersChange,
  categories,
}) => {
  const { data: publicSettings } = usePublicSettings();
  const materials = [
    '100% хлопок',
    'Сатин',
    'Перкаль',
    'Пенополиуретан',
    'Гусиный пух',
    'Холлофайбер',
    'Махра',
    'Бамбук',
  ];

  const resetFilters = () => {
    onFiltersChange({
      category: '',
      priceMin: undefined,
      priceMax: undefined,
      inStock: undefined,
      productCategory: '',
      material: '',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    });
  };

  const hasActiveFilters = filters.category || 
    filters.priceMin || 
    filters.priceMax || 
    filters.inStock !== undefined || 
    filters.productCategory || 
    filters.material;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Фильтры</h2>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-red-600 hover:text-red-700"
          >
            <X className="h-4 w-4 mr-1" />
            Сбросить
          </Button>
        )}
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Категории</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="category"
              value=""
              checked={filters.category === ''}
              onChange={(e) => onFiltersChange({ category: e.target.value })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Все категории</span>
          </label>
          
          {categories.map((category) => (
            <label key={category.id} className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="radio"
                  name="category"
                  value={category.slug}
                  checked={filters.category === category.slug}
                  onChange={(e) => onFiltersChange({ category: e.target.value })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-gray-700">{category.name}</span>
              </div>
              <span className="text-xs text-gray-500">
                ({category._count?.products || 0})
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Цена, ₽</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              placeholder="От"
              value={filters.priceMin || ''}
              onChange={(e) => onFiltersChange({ 
                priceMin: e.target.value ? Number(e.target.value) : undefined 
              })}
              min="0"
            />
            <Input
              type="number"
              placeholder="До"
              value={filters.priceMax || ''}
              onChange={(e) => onFiltersChange({ 
                priceMax: e.target.value ? Number(e.target.value) : undefined 
              })}
              min="0"
            />
          </div>
          
          {/* Quick price filters */}
          <div className="space-y-2">
            {[
              { label: 'До 1 000 ₽', min: 0, max: 1000 },
              { label: '1 000 - 3 000 ₽', min: 1000, max: 3000 },
              { label: '3 000 - 5 000 ₽', min: 3000, max: 5000 },
              { label: 'От 5 000 ₽', min: 5000, max: undefined },
            ].map((range) => (
              <button
                key={range.label}
                onClick={() => onFiltersChange({ 
                  priceMin: range.min, 
                  priceMax: range.max 
                })}
                className={`w-full text-left text-sm py-1 px-2 rounded hover:bg-gray-100 ${
                  filters.priceMin === range.min && filters.priceMax === range.max
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-700'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Category */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Сегмент</h3>
        <div className="space-y-2">
          {[
            { value: '', label: 'Все сегменты' },
            { value: 'ECONOMY', label: 'Эконом' },
            { value: 'MIDDLE', label: 'Средний' },
            { value: 'LUXURY', label: 'Люкс' },
          ].map((option) => (
            <label key={option.value} className="flex items-center">
              <input
                type="radio"
                name="productCategory"
                value={option.value}
                checked={filters.productCategory === option.value}
                onChange={(e) => onFiltersChange({ productCategory: e.target.value })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Material */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Материал</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="material"
              value=""
              checked={filters.material === ''}
              onChange={(e) => onFiltersChange({ material: e.target.value })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Все материалы</span>
          </label>
          
          {materials.map((material) => (
            <label key={material} className="flex items-center">
              <input
                type="radio"
                name="material"
                value={material}
                checked={filters.material === material}
                onChange={(e) => onFiltersChange({ material: e.target.value })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="ml-2 text-sm text-gray-700">{material}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Наличие</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={filters.inStock === true}
              onChange={(e) => onFiltersChange({ 
                inStock: e.target.checked ? true : undefined 
              })}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Только в наличии</span>
          </label>
        </div>
      </div>

      {/* Special offers */}
      <div>
        <h3 className="font-medium text-gray-900 mb-3">Специальные предложения</h3>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Товары со скидкой</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Новинки</span>
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-700">Хиты продаж</span>
          </label>
        </div>
      </div>

      {/* Quick actions */}
      <div className="pt-4 border-t border-gray-200">
        <div className="space-y-2">
          {/* Removed "Заказать образцы" per request */}
          {publicSettings?.photoPricesUrl ? (
            <a
              href={publicSettings.photoPricesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button variant="outline" size="sm" className="w-full">
                Скачать каталог
              </Button>
            </a>
          ) : (
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href="/delivery">Скачать каталог</a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};


