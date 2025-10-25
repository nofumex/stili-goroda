'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi } from '@/hooks/useApi';

interface PageProps { params: { id: string } }

export default function AdminCustomerDetailPage({ params }: PageProps) {
  const router = useRouter();
  const { data, loading, error } = useApi(`/users/${params.id}`, { dependencies: [params.id], immediate: !!params.id });

  const [form, setForm] = useState<any>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: 'CUSTOMER',
    isBlocked: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (data) {
      setForm({
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        company: data.company || '',
        role: data.role || 'CUSTOMER',
        isBlocked: !!data.isBlocked,
      });
    }
  }, [data]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-8 w-1/4 bg-gray-200 rounded mb-6" />
        <div className="h-32 bg-gray-200 rounded" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-gray-700">Пользователь не найден</p>
            <div className="mt-4">
              <Button variant="outline" onClick={() => router.push('/admin/customers')}>Назад к списку</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const saveUser = async () => {
    try {
      setSaving(true);
      setMessage('');
      const res = await fetch(`/api/users/${data.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Не удалось сохранить');
      setMessage('Сохранено');
      setTimeout(() => setMessage(''), 2000);
    } catch (e: any) {
      setMessage(e.message || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const deleteUser = async () => {
    if (!confirm('Удалить пользователя?')) return;
    try {
      const res = await fetch(`/api/users/${data.id}`, { method: 'DELETE', credentials: 'include' });
      const json = await res.json();
      if (!json.success) {
        if (json.details) {
          alert(`${json.error}\n\nДетали:\n- Заказов: ${json.details.ordersCount}\n- Отзывов: ${json.details.reviewsCount}\n- Адресов: ${json.details.addressesCount}`);
        } else {
          throw new Error(json.error || 'Не удалось удалить');
        }
        return;
      }
      router.push('/admin/customers');
    } catch (e: any) {
      alert(e.message || 'Ошибка удаления');
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{data.firstName} {data.lastName}</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push('/admin/customers')}>Назад</Button>
          <Button variant="outline" onClick={deleteUser}>Удалить</Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Информация о клиенте</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {message && (
            <div className={`p-2 rounded text-sm ${message.includes('Ошибка') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>{message}</div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700">Имя</label>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Фамилия</label>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Email</label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Телефон</label>
              <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Компания</label>
              <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-gray-700">Роль</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-primary-500"
              >
                <option value="CUSTOMER">Клиент</option>
                <option value="MANAGER">Менеджер</option>
                <option value="VIEWER">Наблюдатель</option>
                <option value="ADMIN">Администратор</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input id="blocked" type="checkbox" checked={!!form.isBlocked} onChange={(e) => setForm({ ...form, isBlocked: e.target.checked })} />
              <label htmlFor="blocked" className="text-sm text-gray-700">Заблокирован</label>
            </div>
          </div>
          <div>
            <Button onClick={saveUser} disabled={saving}>{saving ? 'Сохранение...' : 'Сохранить'}</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}














