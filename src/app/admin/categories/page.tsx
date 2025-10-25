'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { useCategories } from '@/hooks/useApi';

export default function AdminCategoriesPage() {
  const { data: categories, refetch } = useCategories();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [form, setForm] = useState<any>({ name: '', slug: '', description: '', parentId: '', sortOrder: 0, isActive: true });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!Array.isArray(categories)) return [] as any[];
    const q = search.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((c: any) => c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q));
  }, [categories, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', parentId: '', sortOrder: 0, isActive: true });
    setModalOpen(true);
  };

  const openEdit = (cat: any) => {
    setEditing(cat);
    setForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      parentId: cat.parentId || '',
      sortOrder: cat.sortOrder ?? 0,
      isActive: cat.isActive ?? true,
      image: cat.image || '',
      seoTitle: cat.seoTitle || '',
      seoDesc: cat.seoDesc || '',
    });
    setModalOpen(true);
  };

  const submit = async () => {
    setSaving(true);
    try {
      const payload = { ...form, parentId: form.parentId || undefined, sortOrder: Number(form.sortOrder) || 0 };
      const res = await fetch(editing ? `/api/categories/${editing.id}` : '/api/categories', {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Ошибка сохранения');
      setModalOpen(false);
      await refetch();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert((e as any)?.message || 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/categories/${deletingId}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Ошибка удаления');
      setDeletingId(null);
      await refetch();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
      alert((e as any)?.message || 'Ошибка удаления');
    }
  };

  useEffect(() => {
    // ensure data loaded on mount
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Категории</h1>
          <p className="text-gray-600">Создание, редактирование и удаление категорий</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" /> Обновить
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4 mr-2" /> Новая категория
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 flex items-center gap-3">
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск по названию или URL" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Название</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">URL</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Родитель</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Порядок</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filtered.map((cat: any) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">{cat.name}</td>
                <td className="px-6 py-3 text-gray-600">{cat.slug}</td>
                <td className="px-6 py-3 text-gray-600">{cat.parent?.name || '-'}</td>
                <td className="px-6 py-3 text-gray-600">{cat.sortOrder ?? 0}</td>
                <td className="px-6 py-3">
                  <div className="flex items-center justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(cat)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeletingId(cat.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td className="px-6 py-8 text-center text-gray-500" colSpan={5}>Категории не найдены</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Изменить категорию' : 'Новая категория'}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Название</label>
            <Input value={form.name} onChange={(e) => setForm((p: any) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL (slug)</label>
            <Input value={form.slug} onChange={(e) => setForm((p: any) => ({ ...p, slug: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea className="w-full border rounded px-3 py-2" value={form.description} onChange={(e) => setForm((p: any) => ({ ...p, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Родительская категория</label>
              <select className="w-full border rounded px-3 py-2" value={form.parentId} onChange={(e) => setForm((p: any) => ({ ...p, parentId: e.target.value }))}>
                <option value="">(нет)</option>
                {Array.isArray(categories) && categories.filter((c: any) => !editing || c.id !== editing.id).map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label>
              <Input type="number" value={form.sortOrder} onChange={(e) => setForm((p: any) => ({ ...p, sortOrder: e.target.value }))} />
            </div>
          </div>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Отмена</Button>
            <Button onClick={submit} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={!!deletingId} onClose={() => setDeletingId(null)} title="Удалить категорию" size="sm">
        <div className="space-y-4">
          <p>Вы уверены, что хотите удалить эту категорию? Действие нельзя отменить.</p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Отмена</Button>
            <Button variant="destructive" onClick={confirmDelete}>Удалить</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}



