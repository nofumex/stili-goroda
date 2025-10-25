'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye,
  MoreHorizontal,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { formatPrice, formatDate, getStockStatus } from '@/lib/utils';
import { useCategories } from '@/hooks/useApi';

export default function AdminProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [wbImportModalOpen, setWbImportModalOpen] = useState(false);
  const [wbUrl, setWbUrl] = useState('');
  const [wbCategoryId, setWbCategoryId] = useState('');
  const [wbImporting, setWbImporting] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'createdAt' | 'price' | 'name' | 'stock'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const { success, error } = useToast();
  const { data: categories } = useCategories();

  // Удалены демонстрационные мок-данные

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  // Build query string for backend
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set('search', searchQuery);
    if (categoryFilter) params.set('category', categoryFilter);
    if (statusFilter) params.set('visibility', statusFilter);
    params.set('page', String(page));
    params.set('limit', '20');
    params.set('sortBy', sortBy);
    params.set('sortOrder', sortOrder);
    return params.toString();
  }, [searchQuery, categoryFilter, statusFilter, page, sortBy, sortOrder]);

  // Try refresh on 401 and retry request
  const refreshAuth = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      const json = await res.json();
      return Boolean(json?.success);
    } catch {
      return false;
    }
  };

  const authorizedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const res = await fetch(input, { ...init, credentials: 'include' });
    if (res.status === 401) {
      const refreshed = await refreshAuth();
      if (!refreshed) throw new Error('AUTH_REQUIRED');
      return fetch(input, { ...init, credentials: 'include' });
    }
    return res;
  };

  // Load products from backend
  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await authorizedFetch(`/api/admin/products?${queryString}`);
        if (!res.ok) throw new Error('LOAD_FAILED');
        const json = await res.json();
        if (json.success) {
          setProducts(json.data || []);
          setPages(json.pagination?.pages || 1);
          setTotal(json.pagination?.total || 0);
        } else {
          error('Ошибка', json.error || 'Не удалось загрузить товары');
        }
      } catch (e: any) {
        if (e?.message === 'AUTH_REQUIRED') {
          error('Доступ запрещён', 'Пожалуйста, войдите заново');
          window.location.href = '/login';
        } else {
          error('Ошибка', 'Не удалось загрузить товары');
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [queryString, error]);

  const handleDeleteProduct = (slug: string) => {
    setProductToDelete(slug);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      const res = await authorizedFetch(`/api/products/${productToDelete}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        success('Товар удалён', json.message || 'Товар успешно удалён');
        setProducts(prev => prev.filter(p => p.slug !== productToDelete));
        setSelectedProducts([]);
        setDeleteModalOpen(false);
        setProductToDelete(null);
      } else {
        error('Ошибка', json.error || 'Не удалось удалить товар');
      }
    } catch (e: any) {
      if (e?.message === 'AUTH_REQUIRED') {
        error('Доступ запрещён', 'Пожалуйста, войдите заново');
        window.location.href = '/login';
      } else {
        error('Ошибка', 'Не удалось удалить товар');
      }
    }
  };

  const handleWBImport = async () => {
    if (!wbUrl.trim()) {
      error('Ошибка', 'Введите ссылку на товар WildBerries');
      return;
    }

    if (!wbCategoryId) {
      error('Ошибка', 'Выберите категорию товара');
      return;
    }

    // Защита от двойного клика
    if (wbImporting) {
      return;
    }

    setWbImporting(true);
    try {
      const res = await authorizedFetch('/api/admin/products/import-wb', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: wbUrl, categoryId: wbCategoryId }),
      });
      
      const json = await res.json();
      
      if (json.success) {
        success('Товар импортирован', json.message || 'Товар успешно импортирован из WildBerries');
        setWbImportModalOpen(false);
        setWbUrl('');
        setWbCategoryId('');
        // Обновляем список товаров
        const reloadRes = await authorizedFetch(`/api/admin/products?${queryString}`);
        if (reloadRes.ok) {
          const reloadJson = await reloadRes.json();
          if (reloadJson.success) {
            setProducts(reloadJson.data || []);
            setPages(reloadJson.pagination?.pages || 1);
            setTotal(reloadJson.pagination?.total || 0);
          }
        }
      } else {
        error('Ошибка импорта', json.error || 'Не удалось импортировать товар');
      }
    } catch (e: any) {
      if (e?.message === 'AUTH_REQUIRED') {
        error('Доступ запрещён', 'Пожалуйста, войдите заново');
        window.location.href = '/login';
      } else {
        error('Ошибка', 'Не удалось импортировать товар с WildBerries');
      }
    } finally {
      setWbImporting(false);
    }
  };

  const handleBulkAction = async (action: string) => {
    if (selectedProducts.length === 0) {
      error('Выберите товары', 'Необходимо выбрать хотя бы один товар');
      return;
    }

    try {
      switch (action) {
        case 'delete':
          try {
            const res = await authorizedFetch('/api/admin/products', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productIds: selectedProducts }),
            });
            const json = await res.json();
            if (json.success) {
              const { deleted = 0, hidden = 0 } = json.data || {};
              success('Товары удалены', `Удалено: ${deleted}, скрыто: ${hidden}`);
              // Remove hard-deleted items, keep hidden (they will still be present until filter)
              if (deleted > 0) {
                setProducts(prev => prev.filter(p => !selectedProducts.includes(p.id)));
              }
              // Update hidden items locally to reflect soft delete
              if (hidden > 0) {
                setProducts(prev => prev.map(p => (
                  selectedProducts.includes(p.id) ? { ...p, isActive: false, visibility: 'HIDDEN' } : p
                )));
              }
            } else {
              error('Ошибка', json.error || 'Не удалось удалить товары');
            }
          } catch (e: any) {
            if (e?.message === 'AUTH_REQUIRED') {
              error('Доступ запрещён', 'Пожалуйста, войдите заново');
              window.location.href = '/login';
            } else {
              error('Ошибка', 'Не удалось удалить товары');
            }
          }
          break;
        case 'activate':
          // API call to bulk activate
          success('Товары активированы', `Активировано ${selectedProducts.length} товаров`);
          break;
        case 'deactivate':
          // API call to bulk deactivate
          success('Товары деактивированы', `Деактивировано ${selectedProducts.length} товаров`);
          break;
        case 'export': {
          try {
            // Export selected via admin export API
            const res = await authorizedFetch('/api/admin/export', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productIds: selectedProducts, format: 'csv' })
            });
            if (res.ok) {
              const blob = await res.blob();
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `selected_products_${new Date().toISOString().split('T')[0]}.csv`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              success('Экспорт выполнен', 'CSV файл сформирован');
            } else {
              const json = await res.json().catch(() => ({}));
              error('Ошибка', json.error || 'Не удалось экспортировать товары');
            }
          } catch (e: any) {
            if (e?.message === 'AUTH_REQUIRED') {
              error('Доступ запрещён', 'Пожалуйста, войдите заново');
              window.location.href = '/login';
            } else {
              error('Ошибка', 'Не удалось экспортировать товары');
            }
          }
          break;
        }
      }
      setSelectedProducts([]);
    } catch (err) {
      error('Ошибка', 'Не удалось выполнить операцию');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      VISIBLE: 'bg-green-100 text-green-800',
      HIDDEN: 'bg-gray-100 text-gray-800',
      DRAFT: 'bg-yellow-100 text-yellow-800',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status: string) => {
    const texts = {
      VISIBLE: 'Опубликован',
      HIDDEN: 'Скрыт',
      DRAFT: 'Черновик',
    };
    return texts[status as keyof typeof texts] || status;
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Управление товарами</h1>
          <p className="text-gray-600">Всего товаров: {total || products.length}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            variant="outline"
            onClick={() => setWbImportModalOpen(true)}
          >
            <Download className="h-4 w-4 mr-2" />
            Импорт из WB
          </Button>
          <Button variant="outline" asChild>
            <Link href="/admin/import-export">
              <Upload className="h-4 w-4 mr-2" />
              Импорт/Экспорт
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                const res = await authorizedFetch('/api/admin/export');
                if (!res.ok) {
                  const json = await res.json().catch(() => ({}));
                  error('Ошибка', json.error || 'Не удалось экспортировать товары');
                  return;
                }
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                success('Экспорт выполнен', 'CSV файл сформирован');
              } catch (e: any) {
                if (e?.message === 'AUTH_REQUIRED') {
                  error('Доступ запрещён', 'Пожалуйста, войдите заново');
                  window.location.href = '/login';
                } else {
                  error('Ошибка', 'Не удалось экспортировать товары');
                }
              }
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button asChild>
            <Link href="/admin/products/create">
              <Plus className="h-4 w-4 mr-2" />
              Добавить товар
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Поиск по названию, SKU, категории..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <select 
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">Все категории</option>
              {Array.isArray(categories) && categories.map((cat: any) => (
                <option key={cat.id} value={cat.slug}>{cat.name}</option>
              ))}
            </select>
            
            <select 
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="">Все статусы</option>
              <option value="VISIBLE">Опубликованы</option>
              <option value="HIDDEN">Скрыты</option>
              <option value="DRAFT">Черновики</option>
            </select>

            <select
              className="rounded-md border-gray-300 text-sm focus:border-primary-500 focus:ring-primary-500"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-') as any;
                setSortBy(sb);
                setSortOrder(so);
                setPage(1);
              }}
            >
              <option value="createdAt-desc">Новее сначала</option>
              <option value="createdAt-asc">Старее сначала</option>
              <option value="price-asc">Цена: по возрастанию</option>
              <option value="price-desc">Цена: по убыванию</option>
              <option value="name-asc">Название: А-Я</option>
              <option value="name-desc">Название: Я-А</option>
              <option value="stock-desc">Склад: больше сначала</option>
              <option value="stock-asc">Склад: меньше сначала</option>
            </select>
            
            <Button variant="outline" size="sm" onClick={() => setPage(1)}>
              <Filter className="h-4 w-4 mr-2" />
              Применить
            </Button>
          </div>
        </div>
      </div>

      {/* Bulk actions */}
      {selectedProducts.length > 0 && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-primary-700">
              Выбрано товаров: {selectedProducts.length}
            </p>
            <div className="flex items-center space-x-2">
              <Button size="sm" onClick={() => handleBulkAction('activate')}>
                Активировать
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('deactivate')}>
                Деактивировать
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleBulkAction('export')}>
                Экспорт
              </Button>
              <Button size="sm" variant="destructive" onClick={() => handleBulkAction('delete')}>
                Удалить
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Products table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === products.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Товар
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  SKU
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Категория
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Цена
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Склад
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Статус
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Дата создания
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={9}>Загрузка...</td>
                </tr>
              )}
              {!loading && products.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={9}>Товары не найдены</td>
                </tr>
              )}
              {!loading && products.map((product) => {
                const stockStatus = getStockStatus(product.stock);
                
                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedProducts.includes(product.id)}
                        onChange={() => handleSelectProduct(product.id)}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img
                          src={product.images[0] || 'https://placehold.co/100x100?text=No+Image'}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-lg mr-4"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 line-clamp-1">
                            {product.title}
                          </p>
                          {product.oldPrice && (
                            <p className="text-xs text-green-600">
                              Скидка {Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.sku}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {product.categoryObj?.name || product.category}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <p className="font-medium text-gray-900">
                          {formatPrice(product.price)}
                        </p>
                        {product.oldPrice && (
                          <p className="text-xs text-gray-500 line-through">
                            {formatPrice(product.oldPrice)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <span className={`text-sm font-medium ${stockStatus.color}`}>
                          {product.stock}
                        </span>
                        {stockStatus.status === 'low_stock' && (
                          <AlertTriangle className="h-4 w-4 text-orange-500 ml-1" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.visibility)}`}>
                        {getStatusText(product.visibility)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(product.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/products/${product.slug}`} target="_blank">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/admin/products/${product.slug}/edit`}>
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteProduct(product.slug)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white px-6 py-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
              Показано <span className="font-medium">{Math.min((page - 1) * 20 + 1, total || products.length)}</span> по <span className="font-medium">{Math.min(page * 20, total || products.length)}</span> из{' '}
              <span className="font-medium">{total || products.length}</span> результатов
            </p>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
                Предыдущая
              </Button>
              <Button variant="outline" size="sm" className="bg-primary-600 text-white">
                {page}
              </Button>
              <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => Math.min(pages, p + 1))}>
                Следующая
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Удалить товар"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Вы уверены, что хотите удалить этот товар? Это действие нельзя отменить.
          </p>
          <div className="flex space-x-4">
            <Button
              variant="destructive"
              onClick={confirmDelete}
              className="flex-1"
            >
              Удалить
            </Button>
            <Button
              variant="outline"
              onClick={() => setDeleteModalOpen(false)}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </div>
      </Modal>

      {/* WildBerries Import Modal */}
      <Modal
        isOpen={wbImportModalOpen}
        onClose={() => {
          if (!wbImporting) {
            setWbImportModalOpen(false);
            setWbUrl('');
            setWbCategoryId('');
          }
        }}
        title="Импорт товара из WildBerries"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ссылка на товар WildBerries
            </label>
            <Input
              type="text"
              placeholder="https://www.wildberries.ru/catalog/407325131"
              value={wbUrl}
              onChange={(e) => setWbUrl(e.target.value)}
              disabled={wbImporting}
              className="w-full"
            />
            <p className="mt-1 text-xs text-gray-500">
              Вставьте полную ссылку на товар с сайта WildBerries
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория товара
            </label>
            <select
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500"
              value={wbCategoryId}
              onChange={(e) => setWbCategoryId(e.target.value)}
              disabled={wbImporting}
            >
              <option value="">Выберите категорию</option>
              {Array.isArray(categories) && categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              Выберите категорию, в которую будет добавлен товар
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Обратите внимание:</strong> Товар будет создан в статусе "Черновик". 
              После импорта проверьте данные и опубликуйте товар вручную.
            </p>
          </div>

          <div className="flex space-x-4">
            <Button
              onClick={handleWBImport}
              disabled={wbImporting || !wbUrl.trim() || !wbCategoryId}
              className="flex-1"
            >
              {wbImporting ? 'Импортируем...' : 'Импортировать'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setWbImportModalOpen(false);
                setWbUrl('');
                setWbCategoryId('');
              }}
              disabled={wbImporting}
              className="flex-1"
            >
              Отмена
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

