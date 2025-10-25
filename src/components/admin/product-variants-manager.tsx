'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ProductVariant } from '@prisma/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface ProductVariantsManagerProps {
  productSlug: string;
  initialVariants: ProductVariant[];
  onVariantsUpdate: (variants: ProductVariant[]) => void;
  baseSku?: string;
}

interface VariantFormData {
  id?: string;
  size: string;
  color: string;
  material: string;
  price: number;
  stock: number;
  sku: string;
  isActive: boolean;
  imageUrl?: string;
}

export const ProductVariantsManager: React.FC<ProductVariantsManagerProps> = ({
  productSlug,
  initialVariants,
  onVariantsUpdate,
  baseSku,
}) => {
  const [variants, setVariants] = useState<ProductVariant[]>(initialVariants);
  const [isEditing, setIsEditing] = useState(false);
  const [editingVariant, setEditingVariant] = useState<VariantFormData | null>(null);
  const [editorAnchorId, setEditorAnchorId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { success, error } = useToast();

  // Bulk generator state
  const [colorsInput, setColorsInput] = useState<string>('');
  const [sizesInput, setSizesInput] = useState<string>('');
  const [generated, setGenerated] = useState<VariantFormData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const normalizedBaseSku = useMemo(() => (baseSku || '').trim(), [baseSku]);
  const colorOptions = useMemo(() => {
    return Array.from(new Set(variants.map(v => (v.color || '').trim()).filter(Boolean)));
  }, [variants]);
  const sizeOptions = useMemo(() => {
    return Array.from(new Set(variants.map(v => (v.size || '').trim()).filter(Boolean)));
  }, [variants]);

  const normalizeSize = (value: string): string => {
    if (!value) return '';
    // Replace any latin/cyrillic X variants and trim spaces around separators
    const xUnified = value
      .replace(/[\u0425\u0445xX]+/g, 'x') // Х х x X -> x
      .replace(/\s*x\s*/g, 'x');
    return xUnified;
  };

  const toColorCode = (color: string): string => {
    const code = color
      .toLowerCase()
      .replace(/[а-я]/g, (char) => {
        const translit: Record<string, string> = {
          'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
          'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
          'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
          'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
          'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
        };
        return translit[char] || char;
      })
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return code;
  };

  const generateVariantSku = (base: string, color?: string, size?: string): string => {
    let sku = base || 'SKU';
    if (color) sku += `-${toColorCode(color)}`;
    if (size) sku += `-${normalizeSize(String(size)).toLowerCase().replace(/\s+/g, '-')}`;
    return sku;
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      // Parse colors (comma or newline separated)
      const colors = colorsInput
        .split(/[,\n]/)
        .map(c => c.trim())
        .filter(Boolean);

      // Parse sizes with prices: each line like "30x40 - 600" or "30x40,600"
      const sizeLines = sizesInput
        .split(/\n/)
        .map(l => l.trim())
        .filter(Boolean);

      const sizePricePairs: { size: string; price: number }[] = [];
      for (const line of sizeLines) {
        const parts = line.split(/[-,;]|\s+-\s+/).map(p => p.trim()).filter(Boolean);
        if (parts.length >= 2) {
          const size = normalizeSize(parts[0]);
          const priceNum = parseFloat(parts[1].replace(/[^0-9.,]/g, '').replace(',', '.'));
          if (size && !Number.isNaN(priceNum)) {
            sizePricePairs.push({ size, price: priceNum });
          }
        }
      }

      // If no colors provided, generate size-only variants
      const finalVariants: VariantFormData[] = [];
      const colorsToUse = colors.length > 0 ? colors : [undefined as any];
      for (const color of colorsToUse) {
        for (const sp of sizePricePairs) {
          finalVariants.push({
            size: sp.size,
            color: color as any as string, // may be undefined
            material: '',
            price: sp.price,
            stock: 1,
            sku: generateVariantSku(normalizedBaseSku, color as any as string, sp.size),
            isActive: true,
            // imageUrl intentionally omitted when not set
          });
        }
      }

      setGenerated(finalVariants);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleToggleGeneratedStock = (index: number) => {
    setGenerated(prev => prev.map((v, i) => i === index ? { ...v, stock: v.stock > 0 ? 0 : 1 } : v));
  };

  const handleBulkSave = async () => {
    if (!generated.length) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productSlug}/variants`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variants: generated.map(v => ({
            size: v.size || undefined,
            color: v.color || undefined,
            material: v.material || undefined,
            price: v.price,
            stock: v.stock,
            sku: v.sku,
            isActive: v.isActive,
            imageUrl: v.imageUrl && v.imageUrl.length > 0 ? v.imageUrl : undefined,
          })),
        }),
        credentials: 'include',
      });
      const result = await response.json();
      if (result.success) {
        // Reload variants list
        const res = await fetch(`/api/admin/products/${productSlug}/variants`, { credentials: 'include' });
        const list = await res.json();
        if (list.success) {
          setVariants(list.data);
          onVariantsUpdate(list.data);
        }
        success('Вариации созданы', result.message || 'Сгенерированные вариации сохранены');
        setGenerated([]);
      } else {
        error('Ошибка сохранения', result.error || 'Не удалось сохранить вариации');
      }
    } catch (e) {
      error('Ошибка сохранения', 'Произошла ошибка при сохранении вариаций');
    } finally {
      setIsLoading(false);
    }
  };

  // Image upload helpers (reuse logic from other admin upload flows)
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

  const handleUploadColorImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingVariant) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const fd = new FormData();
    fd.append('file', file);
    setIsLoading(true);
    try {
      const res = await authorizedUpload(fd);
      const json = await res.json();
      if (json?.success && json?.path) {
        setEditingVariant({ ...editingVariant, imageUrl: json.path });
        success('Изображение загружено', 'Картинка для цвета добавлена');
      } else {
        error('Ошибка загрузки', json?.error || 'Не удалось загрузить изображение');
      }
    } catch (err) {
      error('Ошибка загрузки', 'Не удалось загрузить изображение');
    } finally {
      setIsLoading(false);
      // reset input value so same file can be reselected if needed
      (e.target as HTMLInputElement).value = '';
    }
  };

  const handleAddVariant = () => {
    setEditingVariant({
      size: '',
      color: '',
      material: '',
      price: 0,
      stock: 0,
      sku: '',
      isActive: true,
    });
    setEditorAnchorId(null);
    setIsEditing(true);
  };

  const handleEditVariant = (variant: ProductVariant) => {
    setEditingVariant({
      id: variant.id,
      size: variant.size || '',
      color: variant.color || '',
      material: variant.material || '',
      price: Number(variant.price),
      stock: variant.stock,
      sku: variant.sku,
      isActive: variant.isActive,
      imageUrl: (variant as any).imageUrl || '',
    });
    setEditorAnchorId(variant.id);
    setIsEditing(true);
  };

  const handleSaveVariant = async () => {
    if (!editingVariant) return;

    setIsLoading(true);
    try {
      const url = editingVariant.id
        ? `/api/admin/products/${productSlug}/variants/${editingVariant.id}`
        : `/api/admin/products/${productSlug}/variants`;

      const method = editingVariant.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          size: editingVariant.size || undefined,
          color: editingVariant.color || undefined,
          material: editingVariant.material || undefined,
          price: editingVariant.price,
          stock: editingVariant.stock,
          sku: editingVariant.sku,
          isActive: editingVariant.isActive,
          imageUrl: editingVariant.imageUrl || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Обновляем локальное состояние
        let updatedVariants;
        if (editingVariant.id) {
          updatedVariants = variants.map(v => 
            v.id === editingVariant.id ? result.data : v
          );
        } else {
          updatedVariants = [...variants, result.data];
        }
        
        setVariants(updatedVariants);
        onVariantsUpdate(updatedVariants);
        success('Вариация сохранена', 'Вариация товара успешно сохранена');

        // If imageUrl set and color provided: propagate image to all variants with same color
        if ((editingVariant.imageUrl && editingVariant.imageUrl.length > 0) && editingVariant.color) {
          const sameColor = updatedVariants.filter(v => (v.color || '') === editingVariant.color && v.id !== result.data.id);
          for (const v of sameColor) {
            try {
              await fetch(`/api/admin/products/${productSlug}/variants/${v.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ imageUrl: editingVariant.imageUrl }),
                credentials: 'include',
              });
            } catch {}
          }
          // Refresh list to reflect updates
          try {
            const res = await fetch(`/api/admin/products/${productSlug}/variants`, { credentials: 'include' });
            const list = await res.json();
            if (list.success) {
              setVariants(list.data);
              onVariantsUpdate(list.data);
            }
          } catch {}
        }
        setIsEditing(false);
        setEditingVariant(null);
      } else {
        error('Ошибка сохранения', result.error);
      }
    } catch (err) {
      error('Ошибка сохранения', 'Произошла ошибка при сохранении вариации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVariant = async (variantId: string) => {
    if (!confirm('Вы уверены, что хотите удалить эту вариацию?')) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/products/${productSlug}/variants/${variantId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        const updatedVariants = variants.filter(v => v.id !== variantId);
        setVariants(updatedVariants);
        onVariantsUpdate(updatedVariants);
        success('Вариация удалена', 'Вариация товара успешно удалена');
      } else {
        error('Ошибка удаления', result.error);
      }
    } catch (err) {
      error('Ошибка удаления', 'Произошла ошибка при удалении вариации');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingVariant(null);
    setEditorAnchorId(null);
  };

  const Datalists = React.memo(({ colors, sizes }: { colors: string[]; sizes: string[] }) => (
    <>
      <datalist id="colorOptions">
        {colors.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="sizeOptions">
        {sizes.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  ));
  
  Datalists.displayName = 'Datalists';

  const VariantEditor: React.FC = () => (
    <div className="border rounded-lg p-6 bg-white">
      <h4 className="text-lg font-semibold mb-4">
        {editingVariant && editingVariant.id ? 'Редактировать вариацию' : 'Добавить вариацию'}
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цвет
          </label>
          <input
            type="text"
            value={editingVariant?.color || ''}
            list="colorOptions"
            onChange={(e) => setEditingVariant(prev => ({
              ...(prev as VariantFormData),
              color: e.target.value,
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например: Белый, Красный, Синий"
          />
          <p className="text-xs text-gray-500 mt-1">
            Указывайте только цвета. Не используйте категории товаров (например: "пестротканное").
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Размер
          </label>
          <input
            type="text"
            value={editingVariant?.size || ''}
            list="sizeOptions"
            onChange={(e) => setEditingVariant(prev => ({
              ...(prev as VariantFormData),
              size: e.target.value,
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например: 50x70"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Материал
          </label>
          <input
            type="text"
            value={editingVariant?.material || ''}
            onChange={(e) => setEditingVariant(prev => ({
              ...(prev as VariantFormData),
              material: e.target.value,
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Например: Хлопок"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Картинка для цвета
          </label>
          <div className="flex items-center gap-3">
            <label className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md cursor-pointer text-sm bg-white hover:bg-gray-50">
              <input type="file" accept="image/*" onChange={handleUploadColorImage} className="hidden" />
              Загрузить изображение
            </label>
            {editingVariant?.imageUrl && (
              <div className="flex items-center gap-2">
                <img src={editingVariant.imageUrl} alt="Цвет" className="w-12 h-12 object-cover rounded" />
                <button
                  type="button"
                  className="text-xs text-red-600 hover:text-red-700"
                  onClick={() => setEditingVariant(prev => ({ ...(prev as VariantFormData), imageUrl: '' }))}
                >
                  Удалить
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-1">Необязательно. Если не указано, картинка товара не меняется при выборе цвета.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Артикул
          </label>
          <input
            type="text"
            value={editingVariant?.sku || ''}
            onChange={(e) => setEditingVariant(prev => ({
              ...(prev as VariantFormData),
              sku: e.target.value,
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Уникальный артикул"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Цена (₽)
          </label>
          <input
            type="number"
            value={editingVariant?.price ?? 0}
            onChange={(e) => setEditingVariant(prev => ({
              ...(prev as VariantFormData),
              price: parseFloat(e.target.value) || 0,
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            step="0.01"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Остаток (шт.)
          </label>
          <input
            type="number"
            value={editingVariant?.stock ?? 0}
            onChange={(e) => setEditingVariant(prev => ({
              ...(prev as VariantFormData),
              stock: parseInt(e.target.value) || 0,
            }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            min="0"
            required
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={!!editingVariant?.isActive}
            onChange={(e) => setEditingVariant(prev => ({
              ...(prev as VariantFormData),
              isActive: e.target.checked,
            }))}
            className="mr-2"
          />
          <span className="text-sm font-medium text-gray-700">Активна</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelEdit}
          disabled={isLoading}
        >
          Отмена
        </Button>
        <Button
          type="button"
          onClick={handleSaveVariant}
          disabled={isLoading || !editingVariant || !editingVariant.sku || (editingVariant.price as any) <= 0}
        >
          {isLoading ? 'Сохранение...' : 'Сохранить'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Bulk generator */}
      <div className="border rounded-lg p-4 bg-white">
        <h3 className="text-lg font-semibold mb-4">Генератор вариаций</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Цвета (через запятую или с новой строки)</label>
            <textarea
              value={colorsInput}
              onChange={(e) => setColorsInput(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Например: Зеленый, Синий, Белый"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Размеры и цены (каждый с новой строки)</label>
            <textarea
              value={sizesInput}
              onChange={(e) => setSizesInput(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Например:\n20x20 - 400\n30x40 - 600`}
            />
            <p className="text-xs text-gray-500 mt-1">Формат строки: размер - цена</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-gray-500">Базовый SKU товара: <span className="font-mono">{normalizedBaseSku || '—'}</span></div>
          <div className="flex gap-2">
            <Button type="button" onClick={handleGenerate} disabled={isGenerating || !sizesInput.trim()}>
              {isGenerating ? 'Генерация...' : 'Сгенерировать'}
            </Button>
            <Button type="button" onClick={handleBulkSave} disabled={isLoading || generated.length === 0}>
              {isLoading ? 'Сохранение...' : 'Сохранить сгенерированные'}
            </Button>
          </div>
        </div>

        {generated.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-semibold mb-2">Предпросмотр ({generated.length})</h4>
            <div className="space-y-2">
              {generated.map((v, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm border rounded p-2">
                  <div className="flex-1">
                    <span className="text-gray-600">{v.color || '—'}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">{v.size}</span>
                    <span className="mx-2">•</span>
                    <span className="text-gray-900">{new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' }).format(v.price)}</span>
                    <span className="mx-2">•</span>
                    <span className="font-mono text-gray-700">{v.sku}</span>
                  </div>
                  <label className="inline-flex items-center gap-2 ml-4">
                    <input type="checkbox" checked={v.stock > 0} onChange={() => handleToggleGeneratedStock(idx)} />
                    <span className="text-xs">В наличии</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Вариации товара</h3>
        <Button type="button" onClick={handleAddVariant} disabled={isLoading}>
          Добавить вариацию
        </Button>
      </div>

      {/* Форма создания новой вариации перед списком */}
      {isEditing && editingVariant && !editingVariant.id && (
        <div className="mb-4">
          <VariantEditor />
        </div>
      )}

      {/* Список вариаций */}
      {variants.length > 0 ? (
        <div className="space-y-4">
          {variants.map((variant) => (
            <div key={variant.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Цвет:</span>
                      <div className="text-gray-900">
                        {variant.color && !['пестротканное', 'пестротканые', 'гладкокрашеное', 'гладкокрашеные'].some(keyword => 
                          variant.color?.toLowerCase().includes(keyword.toLowerCase())
                        ) ? variant.color : 'Не указан'}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Размер:</span>
                      <div className="text-gray-900">{variant.size || 'Не указан'}</div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Цена:</span>
                      <div className="text-gray-900">
                        {new Intl.NumberFormat('ru-RU', { 
                          style: 'currency', 
                          currency: 'RUB' 
                        }).format(Number(variant.price))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Остаток:</span>
                      <div className={`text-gray-900 ${variant.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {variant.stock} шт.
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-gray-600">Артикул:</span>
                    <span className="text-gray-900 ml-1">{variant.sku}</span>
                    <label className="ml-3 inline-flex items-center gap-2 align-middle">
                      <input
                        type="checkbox"
                        defaultChecked={variant.isActive}
                        onChange={async (e) => {
                          const next = e.target.checked;
                          try {
                            const res = await fetch(`/api/admin/products/${productSlug}/variants/${variant.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ isActive: next }),
                              credentials: 'include',
                            });
                            const json = await res.json();
                            if (json.success) {
                              setVariants(prev => prev.map(v => v.id === variant.id ? { ...v, isActive: next } as any : v));
                              onVariantsUpdate(variants.map(v => v.id === variant.id ? { ...v, isActive: next } as any : v));
                            } else {
                              error('Ошибка', json.error || 'Не удалось изменить статус');
                              e.target.checked = !next;
                            }
                          } catch {
                            error('Ошибка', 'Не удалось изменить статус');
                            e.target.checked = !next;
                          }
                        }}
                      />
                      <span className={`px-2 py-1 rounded text-xs ${variant.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {variant.isActive ? 'Активна' : 'Неактивна'}
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleEditVariant(variant)}
                    disabled={isLoading}
                  >
                    Редактировать
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteVariant(variant.id)}
                    disabled={isLoading}
                    className="text-red-600 hover:text-red-700"
                  >
                    Удалить
                  </Button>
                </div>
              </div>
              {isEditing && editingVariant && editorAnchorId === variant.id && (
                <div className="mt-4">
                  <VariantEditor />
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>У товара пока нет вариаций</p>
          <p className="text-sm">Нажмите "Добавить вариацию" для создания первой вариации</p>
        </div>
      )}
      <Datalists colors={colorOptions} sizes={sizeOptions} />
    </div>
  );
};

export default ProductVariantsManager;
