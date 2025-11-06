'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { StarRating } from '@/components/ui/star-rating';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { useAuthStore } from '@/store/auth';
import { api } from '@/hooks/useApi';
import { formatDate } from '@/lib/utils';

interface SiteReview {
  id: string;
  rating: number;
  content: string;
  isApproved: boolean;
  createdAt: string;
  user: {
    firstName: string;
    lastName: string;
  };
}

export default function ReviewsPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { success, error } = useToast();
  const [reviews, setReviews] = useState<SiteReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Форма отзыва
  const [rating, setRating] = useState(0);
  const [content, setContent] = useState('');

  // Загрузка отзывов
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const response = await api.get('/site-reviews');
        const result = response.data;
        
        if (result.success) {
          setReviews(result.data || []);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  // Отправка отзыва
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      error('Ошибка', 'Необходимо войти в систему для оставления отзыва');
      router.push('/login?redirect=/reviews');
      return;
    }

    if (rating === 0) {
      error('Ошибка', 'Пожалуйста, выберите оценку');
      return;
    }

    if (content.trim().length < 10) {
      error('Ошибка', 'Отзыв должен содержать минимум 10 символов');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/site-reviews', {
        rating,
        content: content.trim(),
      });

      const result = response.data;

      if (result.success) {
        success('Отзыв отправлен', 'Ваш отзыв отправлен на модерацию. После одобрения он появится на странице.');
        setRating(0);
        setContent('');
      } else {
        error('Ошибка', result.error || 'Не удалось отправить отзыв');
      }
    } catch (err: any) {
      console.error('Error submitting review:', err);
      if (err.response?.status === 401) {
        error('Ошибка', 'Необходимо войти в систему');
        router.push('/login?redirect=/reviews');
      } else {
        error('Ошибка', err.response?.data?.error || 'Не удалось отправить отзыв');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-10">
          <div className="mb-6">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Отзывы</h1>
            <p className="text-gray-600">Поделитесь своим мнением о нашей компании</p>
          </div>

          {/* Информация о WildBerries */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8">
            <p className="text-gray-700 text-sm md:text-base">
              Отзывы на каждый отдельный товар можно увидеть на{' '}
              <a
                href="https://www.wildberries.ru/seller/4473987"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium underline"
              >
                WildBerries
              </a>
            </p>
          </div>

          {/* Двухколоночный layout: отзывы слева (главное), форма справа (менее заметная) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Левая колонка - Список отзывов (главное, занимает 2/3 на больших экранах) */}
            <div className="lg:col-span-2">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  Отзывы клиентов
                </h2>
                <p className="text-sm text-gray-500">
                  {loading ? 'Загрузка...' : `${reviews.length} ${reviews.length === 1 ? 'отзыв' : reviews.length < 5 ? 'отзыва' : 'отзывов'}`}
                </p>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">Загрузка отзывов...</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
                  <p className="text-gray-500 text-lg mb-2">Пока нет одобренных отзывов</p>
                  <p className="text-sm text-gray-400">Будьте первым, кто оставит отзыв!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div
                      key={review.id}
                      className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="mb-2">
                            <span className="text-base font-semibold text-gray-900">
                              {review.user.firstName} {review.user.lastName}
                            </span>
                          </div>
                          <div className="mb-2">
                            <StarRating rating={review.rating} size="sm" />
                          </div>
                          <p className="text-sm text-gray-500">
                            {formatDate(new Date(review.createdAt))}
                          </p>
                        </div>
                      </div>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{review.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Правая колонка - Форма создания отзыва (менее заметная, занимает 1/3 на больших экранах) */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-5 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {isAuthenticated ? 'Оставить отзыв' : 'Войдите, чтобы оставить отзыв'}
                </h3>
                
                {isAuthenticated ? (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-2">
                        Оценка <span className="text-red-500">*</span>
                      </label>
                      <StarRating
                        rating={rating}
                        interactive={true}
                        onRatingChange={setRating}
                        size="md"
                      />
                    </div>

                    <div>
                      <label htmlFor="content" className="block text-xs font-medium text-gray-700 mb-2">
                        Ваш отзыв <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        id="content"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        placeholder="Расскажите о вашем опыте..."
                        required
                        minLength={10}
                      />
                      <p className="mt-1 text-xs text-gray-500">
                        Минимум 10 символов
                      </p>
                    </div>

                    <div className="text-xs text-gray-600 pb-2 border-b">
                      <p>Отображаемое имя: <strong>{user?.firstName} {user?.lastName}</strong></p>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting || rating === 0 || content.trim().length < 10}
                      className="w-full"
                      size="sm"
                    >
                      {submitting ? 'Отправка...' : 'Отправить'}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-600">
                      Чтобы оставить отзыв, необходимо войти в систему.
                    </p>
                    <div className="flex flex-col gap-2">
                      <Button asChild size="sm" className="w-full">
                        <Link href="/login?redirect=/reviews">Войти</Link>
                      </Button>
                      <Button variant="outline" asChild size="sm" className="w-full">
                        <Link href="/register?redirect=/reviews">Зарегистрироваться</Link>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
  );
}
