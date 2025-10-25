'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, useMutation } from '@/hooks/useApi';
import { Product, ProductVisibility } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import ProductVariantsManager from '@/components/admin/product-variants-manager';
import { 
  ArrowLeft, 
  Save, 
  Upload, 
  X,
  Plus
} from 'lucide-react';

interface PageProps {
  params: { slug: string };
}

const visibilities: ProductVisibility[] = ['VISIBLE', 'HIDDEN', 'DRAFT'];

export default function EditProductPage({ params }: PageProps) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [productData, setProductData] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { mutate: updateProduct, loading: saving } = useMutation<Product>(`/products/${params.slug}`, 'PUT');

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
    tags: [] as string[],
    categoryId: '',
    minOrder: '1',
    weight: '',
    dimensions: '',
    material: '',
    seoTitle: '',
    seoDesc: '',
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [loadingVariants, setLoadingVariants] = useState(true);
  const [imageUrl, setImageUrl] = useState('');
  const discountPercent = useMemo(() => {
    if (!formData.price || !formData.oldPrice) return null;
    const p = Number(formData.price);
    const o = Number(formData.oldPrice);
    if (!o || o <= 0) return null;
    return Math.round(((o - p) / o) * 100);
  }, [formData.price, formData.oldPrice]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        // Use admin preview header to bypass public visibility checks
        const res = await api.get(`/products/${params.slug}`, {
          headers: { Authorization: 'Bearer admin-preview' },
        });
        const json = res.data;
        if (!json?.success) throw new Error(json?.error || 'Не удалось загрузить товар');
        const p = json.data;
        setProductData(p);
        setFormData({
          title: p.title || '',
          description: p.description || '',
          sku: p.sku || '',
          category: p.category || 'ECONOMY',
          price: String(p.price ?? ''),
          oldPrice: p.oldPrice != null ? String(p.oldPrice) : '',
          stock: String(p.stock ?? ''),
          status: p.visibility || 'DRAFT',
          isActive: Boolean(p.isActive),
          images: Array.isArray(p.images) ? p.images : [],
          tags: Array.isArray(p.tags) ? p.tags : [],
          categoryId: p.categoryId || '',
          minOrder: String(p.minOrder ?? '1'),
          weight: p.weight != null ? String(p.weight) : '',
          dimensions: p.dimensions || '',
          material: p.material || '',
          seoTitle: p.seoTitle || '',
          seoDesc: p.seoDesc || '',
        });
      } catch (e: any) {
        setError(e?.message || 'Ошибка загрузки');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.slug]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        const result = await response.json();
        if (result.success) {
          setCategories(result.data);
        } else {
          toastError('Ошибка', 'Не удалось загрузить категории');
        }
      } catch {
        toastError('Ошибка', 'Не удалось загрузить категории');
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [toastError]);

  useEffect(() => {
    const loadVariants = async () => {
      try {
        setLoadingVariants(true);
        const response = await fetch(`/api/admin/products/${params.slug}/variants`, {
          credentials: 'include',
        });
        const result = await response.json();
        if (result.success) {
          setVariants(result.data);
        } else {
          toastError('Ошибка', 'Не удалось загрузить вариации товара');
        }
      } catch (error) {
        console.error('Error loading variants:', error);
        toastError('Ошибка', 'Не удалось загрузить вариации товара');
      } finally {
        setLoadingVariants(false);
      }
    };
    
    if (params.slug) {
      loadVariants();
    }
  }, [params.slug, toastError]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      } catch {}
    }

    if (uploadedPaths.length > 0) {
      setFormData(prev => ({ ...prev, images: [...prev.images, ...uploadedPaths] }));
      success('Изображения загружены', `Добавлено: ${uploadedPaths.length}`);
    } else {
      toastError('Ошибка', 'Не удалось загрузить изображения');
    }
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleAddImageByUrl = () => {
    if (!imageUrl.trim()) {
      setFormError('Введите URL изображения');
      return;
    }

    // Проверка на валидность URL
    try {
      new URL(imageUrl);
    } catch {
      setFormError('Неверный формат URL');
      return;
    }

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, imageUrl.trim()]
    }));
    
    setImageUrl('');
    setFormError(null);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description || undefined,
        // sku и slug менять обычно не нужно на экране редактирования
        category: formData.category,
        price: formData.price !== '' ? parseFloat(formData.price) : undefined,
        oldPrice: formData.oldPrice !== '' ? parseFloat(formData.oldPrice) : undefined,
        stock: formData.stock !== '' ? parseInt(formData.stock) : undefined,
        minOrder: formData.minOrder !== '' ? parseInt(formData.minOrder) : undefined,
        weight: formData.weight !== '' ? parseFloat(formData.weight) : undefined,
        dimensions: formData.dimensions || undefined,
        material: formData.material || undefined,
        visibility: formData.status as ProductVisibility,
        isActive: formData.isActive,
        images: formData.images,
        tags: formData.tags,
        categoryId: formData.categoryId || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDesc: formData.seoDesc || undefined,
      };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === undefined || Number.isNaN(payload[k])) delete payload[k];
      });

      await updateProduct(payload);
      router.push('/admin/products');
    } catch (err: any) {
      setFormError(err?.message || 'Ошибка сохранения');
    }
  };

  if (loading) {
    return <div className="p-6">Загрузка...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">Ошибка: {error}</div>;
  }

  if (!productData) {
    return <div className="p-6">Товар не найден</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/admin/products">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к товарам
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Редактирование товара</h1>
            <p className="text-gray-600">Обновите данные и сохраните изменения</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" asChild>
            <Link href="/admin/products">Отмена</Link>
          </Button>
          <Button onClick={onSubmit as any} disabled={saving} className="bg-primary-600 hover:bg-primary-700">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </Button>
        </div>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Основная информация</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Название товара *</label>
              <Input value={formData.title} onChange={(e) => handleInputChange('title', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SKU *</label>
              <Input value={formData.sku} onChange={(e) => handleInputChange('sku', e.target.value)} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Категория товара *</label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="ECONOMY">Эконом</option>
                <option value="MIDDLE">Средний</option>
                <option value="LUXURY">Люкс</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Статус</label>
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
            <label className="text-sm font-medium text-gray-700">Описание товара</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Категория *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleInputChange('categoryId', e.target.value)}
                className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
                required
                disabled={loadingCategories}
              >
                <option value="">{loadingCategories ? 'Загрузка категорий...' : 'Выберите категорию'}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Материал</label>
              <Input value={formData.material} onChange={(e) => handleInputChange('material', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Вес (кг)</label>
              <Input type="number" value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} min="0" step="0.1" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Размеры</label>
              <Input value={formData.dimensions} onChange={(e) => handleInputChange('dimensions', e.target.value)} placeholder="Например: 200x220 см" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ценообразование</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Цена *</label>
              <Input type="number" value={formData.price} onChange={(e) => handleInputChange('price', e.target.value)} min="0" step="0.01" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Старая цена</label>
              <Input type="number" value={formData.oldPrice} onChange={(e) => handleInputChange('oldPrice', e.target.value)} min="0" step="0.01" />
              {discountPercent !== null && (
                <div className="text-xs text-gray-500 mt-1">Скидка: -{discountPercent}%</div>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Количество на складе *</label>
              <Input type="number" value={formData.stock} onChange={(e) => handleInputChange('stock', e.target.value)} min="0" required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Минимальный заказ *</label>
              <Input type="number" value={formData.minOrder} onChange={(e) => handleInputChange('minOrder', e.target.value)} min="1" required />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-6">
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={!!formData.isActive} onChange={(e) => handleInputChange('isActive', e.target.checked)} />
              Активен
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Изображения товара</h2>
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">Загрузить изображения</span>
                    <input id="image-upload" type="file" multiple accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, WEBP до 10MB</p>
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
                    <img src={image} alt={`Product ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                    <button type="button" onClick={() => handleRemoveImage(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">SEO настройки</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SEO заголовок</label>
              <Input value={formData.seoTitle} onChange={(e) => handleInputChange('seoTitle', e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">SEO описание</label>
              <textarea value={formData.seoDesc} onChange={(e) => handleInputChange('seoDesc', e.target.value)} rows={3} className="w-full rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500" />
            </div>
          </div>
          {formError && <div className="text-red-600 text-sm mt-4">{formError}</div>}
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Вариации товара</h2>
          {loadingVariants ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Загрузка вариаций...</p>
            </div>
          ) : (
            <ProductVariantsManager
              productSlug={params.slug}
              initialVariants={variants}
              onVariantsUpdate={setVariants}
              baseSku={productData?.sku}
            />
          )}
        </div>
      </form>
    </div>
  );
}


