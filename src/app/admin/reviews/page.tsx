'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { StarRating } from '@/components/ui/star-rating';
import { Check, X, Trash2, Eye } from 'lucide-react';
import { formatDate } from '@/lib/utils';

interface SiteReview {
  id: string;
  rating: number;
  content: string;
  isApproved: boolean;
  createdAt: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('all');
  const [selectedReview, setSelectedReview] = useState<SiteReview | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
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

  const loadReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `/api/admin/site-reviews?status=${statusFilter === 'all' ? '' : statusFilter}`;
      const res = await authorizedFetch(url);
      
      if (!res.ok) throw new Error('LOAD_FAILED');
      
      const json = await res.json();
      
      if (!json?.success) throw new Error('LOAD_FAILED');

      setReviews(Array.isArray(json.data) ? json.data : []);
    } catch (e: any) {
      if (e?.message === 'AUTH_REQUIRED') {
        window.location.href = '/login';
      } else {
        setError('Не удалось загрузить отзывы');
      }
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, statusFilter]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleApprove = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await authorizedFetch(`/api/admin/site-reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: true }),
      });

      if (!res.ok) throw new Error('APPROVE_FAILED');

      const json = await res.json();
      if (!json?.success) throw new Error('APPROVE_FAILED');

      success('Отзыв одобрен', 'Отзыв теперь виден на странице отзывов');
      await loadReviews();
    } catch (e: any) {
      toastError('Ошибка', 'Не удалось одобрить отзыв');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    try {
      setProcessingId(id);
      const res = await authorizedFetch(`/api/admin/site-reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isApproved: false }),
      });

      if (!res.ok) throw new Error('REJECT_FAILED');

      const json = await res.json();
      if (!json?.success) throw new Error('REJECT_FAILED');

      success('Отзыв отклонен', 'Отзыв скрыт от пользователей');
      await loadReviews();
    } catch (e: any) {
      toastError('Ошибка', 'Не удалось отклонить отзыв');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить этот отзыв?')) return;

    try {
      setProcessingId(id);
      const res = await authorizedFetch(`/api/admin/site-reviews/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('DELETE_FAILED');

      const json = await res.json();
      if (!json?.success) throw new Error('DELETE_FAILED');

      success('Отзыв удален', 'Отзыв успешно удален из базы данных');
      await loadReviews();
    } catch (e: any) {
      toastError('Ошибка', 'Не удалось удалить отзыв');
    } finally {
      setProcessingId(null);
    }
  };

  const openView = (review: SiteReview) => {
    setSelectedReview(review);
    setIsModalOpen(true);
  };

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-accent bg-clip-text text-transparent">
            Модерация отзывов
          </h1>
          <p className="text-gray-600 mt-1">
            Управление отзывами клиентов о компании
          </p>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-gray-600">Всего отзывов</div>
          <div className="text-2xl font-bold text-gray-900">{reviews.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">На модерации</div>
          <div className="text-2xl font-bold text-orange-600">{pendingCount}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-gray-600">Одобрено</div>
          <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
        </Card>
      </div>

      {/* Фильтры */}
      <div className="flex gap-2">
        <Button
          variant={statusFilter === 'all' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('all')}
          size="sm"
        >
          Все ({reviews.length})
        </Button>
        <Button
          variant={statusFilter === 'pending' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('pending')}
          size="sm"
        >
          На модерации ({pendingCount})
        </Button>
        <Button
          variant={statusFilter === 'approved' ? 'default' : 'outline'}
          onClick={() => setStatusFilter('approved')}
          size="sm"
        >
          Одобрено ({approvedCount})
        </Button>
      </div>

      {/* Список отзывов */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">Загрузка отзывов...</p>
        </div>
      ) : error ? (
        <Card className="p-6">
          <p className="text-red-600">{error}</p>
        </Card>
      ) : reviews.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-gray-500">Нет отзывов для отображения</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id} className="p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={review.rating} size="sm" />
                    <span className="font-medium text-gray-900">
                      {review.user.firstName} {review.user.lastName}
                    </span>
                    <span className="text-sm text-gray-500">
                      {review.user.email}
                    </span>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        review.isApproved
                          ? 'bg-green-100 text-green-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {review.isApproved ? 'Одобрен' : 'На модерации'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mb-3">
                    {formatDate(new Date(review.createdAt))}
                  </p>
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">
                    {review.content}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openView(review)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Подробнее
                    </Button>
                    {!review.isApproved && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleApprove(review.id)}
                        disabled={processingId === review.id}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Одобрить
                      </Button>
                    )}
                    {review.isApproved && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(review.id)}
                        disabled={processingId === review.id}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Отклонить
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                      disabled={processingId === review.id}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Удалить
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Модальное окно для просмотра */}
      {isModalOpen && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Детали отзыва</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Закрыть
                </Button>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <StarRating rating={selectedReview.rating} size="md" />
                    <span className="font-medium text-gray-900">
                      {selectedReview.user.firstName} {selectedReview.user.lastName}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{selectedReview.user.email}</p>
                  <p className="text-sm text-gray-500">
                    {formatDate(new Date(selectedReview.createdAt))}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Отзыв:</p>
                  <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                    {selectedReview.content}
                  </p>
                </div>
                <div className="flex gap-2 pt-4 border-t">
                  {!selectedReview.isApproved && (
                    <Button
                      variant="default"
                      onClick={() => {
                        handleApprove(selectedReview.id);
                        setIsModalOpen(false);
                      }}
                      disabled={processingId === selectedReview.id}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Одобрить
                    </Button>
                  )}
                  {selectedReview.isApproved && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleReject(selectedReview.id);
                        setIsModalOpen(false);
                      }}
                      disabled={processingId === selectedReview.id}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Отклонить
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleDelete(selectedReview.id);
                      setIsModalOpen(false);
                    }}
                    disabled={processingId === selectedReview.id}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Удалить
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

