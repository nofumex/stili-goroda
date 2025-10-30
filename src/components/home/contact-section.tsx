'use client';

import React, { useState } from 'react';
import { usePublicSettings } from '@/hooks/useApi';
import { Phone, Mail, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    message: '',
  });
  const [consent, setConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: publicSettings } = usePublicSettings();
  const { success, error } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) return;
    setIsSubmitting(true);

    try {
      // Here you would send the form data to your API
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      success('Заявка отправлена!', 'Мы свяжемся с вами в ближайшее время');
      setFormData({
        name: '',
        phone: '',
        email: '',
        company: '',
        message: '',
      });
      setConsent(false);
    } catch (err) {
      error('Ошибка отправки', 'Попробуйте еще раз или свяжитесь с нами по телефону');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      success('Скопировано', text);
    } catch (e) {
      error('Не удалось скопировать', 'Скопируйте вручную');
    }
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Свяжитесь с нами
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Готовы ответить на ваши вопросы и предложить лучшие решения для вашего бизнеса
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">
                Контактная информация
              </h3>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Phone className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Телефон</h4>
                    <p className="text-gray-600">{publicSettings?.contactPhone || '+7'}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <Mail className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Email</h4>
                    <p className="text-gray-600">{publicSettings?.contactEmail || ''}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-1">Адрес</h4>
                    <p className="text-gray-600">{publicSettings?.address || ''}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trust indicators */}
            <div className="bg-gray-50 rounded-xl p-6">
              <h4 className="font-semibold text-gray-900 mb-4">Почему стоит обратиться к нам</h4>
              <ul className="space-y-3">
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Бесплатная консультация специалиста
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Персональное коммерческое предложение
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Образцы товаров для ознакомления
                </li>
                <li className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mr-3"></div>
                  Расчёт стоимости доставки
                </li>
              </ul>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Оставить заявку
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Имя"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Ваше имя"
              />

              <Input
                label="Телефон"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                required
                placeholder="+7 (___) ___-__-__"
              />

              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="your@email.com"
              />

              <Input
                label="Компания"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                placeholder="Название компании (необязательно)"
              />

              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">
                  Сообщение
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={4}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  placeholder="Расскажите о ваших потребностях..."
                />
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  required
                  aria-required="true"
                />
                <label className="ml-2 text-sm text-gray-600">
                  Я даю согласие на обработку персональных данных и принимаю{' '}
                  <a href="/privacy" className="text-primary-600 hover:text-primary-500 underline">Политику конфиденциальности</a>.
                </label>
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full"
                loading={isSubmitting}
              >
                <Send className="h-5 w-5 mr-2" />
                Отправить заявку
              </Button>
            </form>

          </div>
        </div>

        {/* Quick contact options */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-blue-50 rounded-xl">
            <Phone className="h-8 w-8 text-blue-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Позвонить</h4>
            <p className="text-gray-600 mb-3">Получите консультацию прямо сейчас</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(publicSettings?.contactPhone || '')}
            >
              {publicSettings?.contactPhone || ''}
            </Button>
          </div>

            <div className="text-center p-6 bg-green-50 rounded-xl">
            <Mail className="h-8 w-8 text-green-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Написать</h4>
            <p className="text-gray-600 mb-3">Отправьте нам письмо</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(publicSettings?.contactEmail || '')}
            >
              {publicSettings?.contactEmail || ''}
            </Button>
          </div>

            <div className="text-center p-6 bg-purple-50 rounded-xl">
            <MapPin className="h-8 w-8 text-purple-600 mx-auto mb-3" />
            <h4 className="font-semibold text-gray-900 mb-2">Приехать</h4>
            <p className="text-gray-600 mb-3">Посетите наш офис</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(publicSettings?.address || '')}
            >
              {publicSettings?.address || ''}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};


