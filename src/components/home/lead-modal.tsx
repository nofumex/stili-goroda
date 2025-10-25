'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSource?: string;
  defaultMessage?: string;
}

export const LeadModal: React.FC<LeadModalProps> = ({ isOpen, onClose, defaultSource = 'website', defaultMessage }) => {
  const [form, setForm] = useState({ name: '', phone: '', email: '', company: '', message: defaultMessage || '' });
  const [loading, setLoading] = useState(false);
  const { success, error } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: defaultSource }),
      });
      const json = await res.json();
      if (json.success) {
        success('Заявка отправлена', 'Мы свяжемся с вами в ближайшее время');
        setForm({ name: '', phone: '', email: '', company: '', message: '' });
        onClose();
      } else {
        error('Ошибка', json.error || 'Не удалось отправить заявку');
      }
    } catch {
      error('Ошибка', 'Не удалось отправить заявку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Оставить заявку" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input label="Имя" name="name" value={form.name} onChange={handleChange} required placeholder="Ваше имя" />
        <Input label="Телефон" name="phone" value={form.phone} onChange={handleChange} placeholder="+7 (___) ___-__-__" />
        <Input label="Email" type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@email.com" />
        <Input label="Компания" name="company" value={form.company} onChange={handleChange} placeholder="Название компании" />
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Сообщение</label>
          <textarea
            name="message"
            value={form.message}
            onChange={handleChange}
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Опишите запрос"
          />
        </div>
        <Button type="submit" loading={loading} className="w-full">Отправить</Button>
      </form>
    </Modal>
  );
};







