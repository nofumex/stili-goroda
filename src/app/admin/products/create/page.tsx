'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';

export default function CreateProductPage() {
  const router = useRouter();
  const { success, error } = useToast();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    sku: '',
    category: 'ECONOMY',
    price: '',
    oldPrice: '',
    stock: '',
    status: 'DRAFT',
    isActive: true,
    images: [] as string[],
    specifications: [] as { key: string; value: string }[],
    tags: [] as string[],
    categoryId: '',
    minOrder: '1',
    weight: '',
    dimensions: '',
    material: '',
    seoTitle: '',
    seoDesc: '',
  });

  const [newSpec, setNewSpec] = useState({ key: '', value: '' });
  const [newTag, setNewTag] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        
        if (result.success) {
          setCategories(result.data);
        } else {
          error('Ошибка', 'Не удалось загрузить категории');
        }
      } catch (err) {
        error('Ошибка', 'Не удалось загрузить категории');
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, [error]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddSpecification = () => {
    if (newSpec.key && newSpec.value) {
      setFormData(prev => ({
        ...prev,
        specifications: [...prev.specifications, newSpec]
      }));
      setNewSpec({ key: '', value: '' });
    }
  };

  const handleRemoveSpecification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const handleAddTag = () => {
    if (newTag.trim()) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const uploadedPaths: string[] = [];
    const refreshAuth = async (): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
        const json = await res.json();
        return Boolean(json?.success);
      } catch {
        return false;
      }
    };

    const authorizedUpload = async (fd: FormData): Promise<Response> => {
      const res = await fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      if (res.status === 401) {
        const refreshed = await refreshAuth();
        if (!refreshed) throw new Error('AUTH_REQUIRED');
        return fetch('/api/upload', { method: 'POST', body: fd, credentials: 'include' });
      }
      return res;
    };

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await authorizedUpload(fd);
        const json = await res.json();
        if (json.success && json.path) {
          uploadedPaths.push(json.path);
        }
      } catch (err) {
        // ignore single-file error; show toast on final
      }
    }

    if (uploadedPaths.length > 0) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedPaths]
      }));
      success('Изображения загружены', `Добавлено: ${uploadedPaths.length}`);
    } else {
      error('Ошибка', 'Не удалось загрузить изображения');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddImageByUrl = () => {
    if (!imageUrl.trim()) {
      error('Ошибка', 'Введите URL изображения');
      return;
    }

    // Проверка на валидность URL
    try {
      new URL(imageUrl);
    } catch {
      error('Ошибка', 'Неверный формат URL');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl.trim()]
    }));
    
    setImageUrl('');
    success('Изображение добавлено', 'Изображение по URL успешно добавлено');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Authorized fetch with refresh on 401
      const refreshAuth = async (): Promise<boolean> => {
        try {
          const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
          const json = await res.json();
          return Boolean(json?.success);
        } catch {
          return false;
        }
      };

      const doRequest = async () => {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            title: formData.title,
            description: formData.description,
            sku: formData.sku,
            category: formData.category,
            price: parseFloat(formData.price),
            oldPrice: formData.oldPrice ? parseFloat(formData.oldPrice) : undefined,
            stock: parseInt(formData.stock),
            minOrder: parseInt(formData.minOrder),
            weight: formData.weight ? parseFloat(formData.weight) : undefined,
            dimensions: formData.dimensions || undefined,
            material: formData.material || undefined,
            visibility: formData.status,
            isActive: formData.isActive,
            images: formData.images,
            tags: formData.tags,
            categoryId: formData.categoryId,
            seoTitle: formData.seoTitle || undefined,
            seoDesc: formData.seoDesc || undefined,
          }),
        });
        if (res.status === 401) {
          const refreshed = await refreshAuth();
          if (!refreshed) throw new Error('AUTH_REQUIRED');
          return doRequest();
        }
        return res;
      };

      const response = await doRequest();
      const result = await response.json();

      if (result.success) {
        success('Товар создан', 'Товар успешно добавлен в каталог');
        router.push('/admin/products');
      } else {
        console.error('API Error:', result);
        error('Ошибка', result.error || 'Не удалось создать товар');
        if (result.details) {
          console.error('Error details:', result.details);
        }
      }
    } catch (e: any) {
      if (e?.message === 'AUTH_REQUIRED') {
        error('Доступ запрещён', 'Пожалуйста, войдите заново');
        window.location.href = '/login';
      } else {
        error('Ошибка', 'Не удалось создать товар');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к товарам
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Создание товара</h1>
            <p className="text-gray-600">Добавьте новый товар в каталог</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" asChild>
            <Link href="/admin/products">
              Отмена
            </Link>
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-primary-600 hover:bg-primary-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Сохранение...' : 'Сохранить товар'}
          </Button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Название товара
              </label>
              <Input
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="Введите название товара"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                SKU
              </label>
              <Input
                value={formData.sku}
                onChange={(e) => handleInputChange('sku', e.target.value)}
                placeholder="Введите SKU товара"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Категория товара
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="ECONOMY">Эконом</option>
                <option value="MIDDLE">Средний</option>
                <option value="LUXURY">Люкс</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Статус
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="DRAFT">Черновик</option>
                <option value="VISIBLE">Опубликован</option>
                <option value="HIDDEN">Скрыт</option>
              </select>
            </div>
          </div>
          
          <div className="mt-6 space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Описание товара
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Введите описание товара"
              rows={4}
              className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Категория
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                disabled={loadingCategories}
              >
                <option value="">
                  {loadingCategories ? 'Загрузка категорий...' : 'Выберите категорию'}
                </option>
                {categories.length === 0 && !loadingCategories ? (
                  <option value="" disabled>
                    Нет доступных категорий
                  </option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Материал
              </label>
              <Input
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                placeholder="Введите материал"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Вес (кг)
              </label>
              <Input
                type="number"
                value={formData.weight}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                placeholder="0"
                min="0"
                step="0.1"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Размеры
              </label>
              <Input
                value={formData.dimensions}
                onChange={(e) => handleInputChange('dimensions', e.target.value)}
                placeholder="Например: 200x220 см"
              />
            </div>
          </div>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ценообразование</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Цена
              </label>
              <Input
                type="number"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Старая цена
              </label>
              <Input
                type="number"
                value={formData.oldPrice}
                onChange={(e) => handleInputChange('oldPrice', e.target.value)}
                placeholder="0"
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Количество на складе
              </label>
              <Input
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange('stock', e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Минимальный заказ
              </label>
              <Input
                type="number"
                value={formData.minOrder}
                onChange={(e) => handleInputChange('minOrder', e.target.value)}
                placeholder="1"
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Images */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Изображения товара</h2>
          
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      Загрузить изображения
                    </span>
                    <input
                      id="image-upload"
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, GIF до 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Добавление изображения по URL */}
            <div className="border border-gray-300 rounded-lg p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Или добавьте изображение по URL
              </label>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://basket-23.wbbasket.ru/vol4061/part406112/..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddImageByUrl();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  type="button"
                  onClick={handleAddImageByUrl}
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Добавить
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Вставьте прямую ссылку на изображение (например, с WildBerries или другого источника)
              </p>
            </div>
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative">
                    <img
                      src={image}
                      alt={`Product ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Specifications */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Характеристики</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Input
                value={newSpec.key}
                onChange={(e) => setNewSpec(prev => ({ ...prev, key: e.target.value }))}
                placeholder="Название характеристики"
                className="flex-1"
              />
              <Input
                value={newSpec.value}
                onChange={(e) => setNewSpec(prev => ({ ...prev, value: e.target.value }))}
                placeholder="Значение"
                className="flex-1"
              />
              <Button type="button" onClick={handleAddSpecification}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.specifications.map((spec, index) => (
              <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{spec.key}:</span>
                <span className="text-gray-600">{spec.value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSpecification(index)}
                  className="ml-auto text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Теги</h2>
          
          <div className="space-y-4">
            <div className="flex space-x-4">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Добавить тег"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              />
              <Button type="button" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(index)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SEO */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO настройки</h2>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                SEO заголовок
              </label>
              <Input
                value={formData.seoTitle}
                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                placeholder="Введите SEO заголовок"
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                SEO описание
              </label>
              <textarea
                value={formData.seoDesc}
                onChange={(e) => handleInputChange('seoDesc', e.target.value)}
                placeholder="Введите SEO описание"
                rows={3}
                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
