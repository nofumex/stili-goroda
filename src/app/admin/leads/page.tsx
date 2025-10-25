'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { Trash2, Eye } from 'lucide-react';

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { success, error: toastError } = useToast();

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST', credentials: 'include' });
      const json = await res.json();
      return Boolean(json?.success);
    } catch {
      return false;
    }
  }, []);

  const authorizedFetch = useCallback(async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const res = await fetch(input, { ...init, credentials: 'include' });
    if (res.status === 401) {
      const refreshed = await refreshAuth();
      if (!refreshed) throw new Error('AUTH_REQUIRED');
      return fetch(input, { ...init, credentials: 'include' });
    }
    return res;
  }, [refreshAuth]);

  const loadLeads = useCallback(async () => {
      try {
        setLoading(true);
        // Fetch all pages to include older leads
        const firstRes = await authorizedFetch('/api/leads?page=1&limit=100');
        if (!firstRes.ok) throw new Error('LOAD_FAILED');
        const firstJson = await firstRes.json();
        if (!firstJson?.success) throw new Error('LOAD_FAILED');

        const pages = Number(firstJson?.pagination?.pages || 1);
        const total = Number(firstJson?.pagination?.total || firstJson?.data?.length || 0);
        const collected: any[] = Array.isArray(firstJson.data) ? [...firstJson.data] : [];

        // Fetch remaining pages (if any)
        if (pages > 1) {
          const fetches: Promise<Response>[] = [];
          for (let p = 2; p <= pages; p++) {
            fetches.push(authorizedFetch(`/api/leads?page=${p}&limit=100`));
          }
          const results = await Promise.all(fetches);
          for (const r of results) {
            if (!r.ok) continue;
            const j = await r.json();
            if (j?.success && Array.isArray(j.data)) collected.push(...j.data);
          }
        }

        setLeads(collected);
        setTotalCount(total || collected.length);
      } catch (e: any) {
        if (e?.message === 'AUTH_REQUIRED') {
          window.location.href = '/login';
        } else {
          setError('Не удалось загрузить заявки');
        }
      } finally {
        setLoading(false);
      }
  }, [authorizedFetch]);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        loadLeads();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [loadLeads]);

  const openView = (lead: any) => {
    setSelectedLead(lead);
    setIsModalOpen(true);
  };

  const closeView = () => {
    setIsModalOpen(false);
    setSelectedLead(null);
  };

  const deleteLead = async (id: string) => {
    const confirmed = window.confirm('Удалить эту заявку?');
    if (!confirmed) return;
    try {
      setDeletingId(id);
      const res = await authorizedFetch(`/api/leads/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json?.error || 'DELETE_FAILED');
      setLeads((prev) => prev.filter((l) => l.id !== id));
      success('Заявка удалена');
    } catch (e: any) {
      if (e?.message === 'AUTH_REQUIRED') {
        window.location.href = '/login';
      } else {
        toastError('Не удалось удалить заявку');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return leads;
    const q = search.toLowerCase();
    return leads.filter((l) =>
      [l.name, l.email, l.phone, l.company, l.source, l.message]
        .filter(Boolean)
        .some((v: string) => String(v).toLowerCase().includes(q))
    );
  }, [leads, search]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Заявки</h1>
          <p className="text-gray-600">Всего: {totalCount}</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto md:items-center">
          <div className="w-full md:w-80">
            <Input
              placeholder="Поиск по имени, email, телефону..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button onClick={loadLeads} disabled={loading}>
            {loading ? 'Обновление...' : 'Обновить'}
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Дата</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Имя</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Контакты</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Компания</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Сообщение</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Источник</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Действия</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>Загрузка...</td>
                </tr>
              )}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td className="px-6 py-8 text-center text-gray-500" colSpan={6}>Заявок нет</td>
                </tr>
              )}
              {!loading && filtered.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(lead.createdAt).toLocaleString('ru-RU')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {lead.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    <div>{lead.phone || '-'}</div>
                    <div className="text-gray-500">{lead.email || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{lead.company || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-700 max-w-xl">
                    <div className="line-clamp-2" title={lead.message || ''}>{lead.message || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                      {lead.source || '-'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right space-x-2">
                    <Button variant="secondary" size="sm" onClick={() => openView(lead)}>
                      <Eye className="w-4 h-4 mr-1" /> Полный текст
                    </Button>
                    <Button variant="destructive" size="sm" disabled={deletingId===lead.id} onClick={() => deleteLead(lead.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> {deletingId===lead.id ? 'Удаление...' : 'Удалить'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* View modal */}
      <Modal isOpen={isModalOpen} onClose={closeView} title="Заявка">
        {selectedLead && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs uppercase text-gray-500">Имя</div>
                <div className="text-gray-900">{selectedLead.name}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Компания</div>
                <div className="text-gray-900">{selectedLead.company || '-'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Телефон</div>
                <div className="text-gray-900">{selectedLead.phone || '-'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Email</div>
                <div className="text-gray-900">{selectedLead.email || '-'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Источник</div>
                <div className="text-gray-900">{selectedLead.source || '-'}</div>
              </div>
              <div>
                <div className="text-xs uppercase text-gray-500">Дата</div>
                <div className="text-gray-900">{new Date(selectedLead.createdAt).toLocaleString('ru-RU')}</div>
              </div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-500 mb-1">Сообщение</div>
              <div className="rounded border bg-gray-50 p-3 whitespace-pre-wrap text-gray-900 min-h-[80px]">
                {selectedLead.message || '-'}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={closeView}>Закрыть</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}


