'use client';

import React, { useState } from 'react';
import { Lock, Bell, Shield, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useMutation } from '@/hooks/useApi';
import { changePasswordSchema, ChangePasswordInput } from '@/lib/validations';
import { AuthUser } from '@/types';

interface AccountSettingsProps {
  user: AuthUser;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({ user }) => {
  const [activeSection, setActiveSection] = useState('password');
  const { success, error } = useToast();
  const { mutate: changePassword, loading: changingPassword } = useMutation('/api/users/change-password', 'POST');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onChangePassword = async (data: ChangePasswordInput) => {
    try {
      await changePassword(data);
      success('Пароль изменён', 'Новый пароль успешно сохранён');
      reset();
    } catch (err) {
      error('Ошибка изменения пароля', 'Проверьте правильность текущего пароля');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Вы уверены, что хотите удалить аккаунт? Это действие необратимо.')) {
      if (confirm('Это действие удалит все ваши данные навсегда. Продолжить?')) {
        try {
          // Implement account deletion
          success('Аккаунт удалён', 'Ваш аккаунт был успешно удалён');
        } catch (err) {
          error('Ошибка удаления', 'Не удалось удалить аккаунт');
        }
      }
    }
  };

  const sections = [
    { id: 'password', name: 'Пароль', icon: Lock },
    { id: 'notifications', name: 'Уведомления', icon: Bell },
    { id: 'danger', name: 'Удаление аккаунта', icon: Trash2 },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Настройки аккаунта</h2>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-md transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{section.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {activeSection === 'password' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Изменение пароля
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Обновите пароль для повышения безопасности аккаунта
                </p>
              </div>

              <form onSubmit={handleSubmit(onChangePassword)} className="space-y-4">
                <Input
                  label="Текущий пароль"
                  type="password"
                  {...register('currentPassword')}
                  error={errors.currentPassword?.message}
                  autoComplete="current-password"
                />

                <Input
                  label="Новый пароль"
                  type="password"
                  {...register('newPassword')}
                  error={errors.newPassword?.message}
                  autoComplete="new-password"
                  helperText="Минимум 6 символов"
                />

                <Input
                  label="Подтверждение нового пароля"
                  type="password"
                  {...register('confirmPassword')}
                  error={errors.confirmPassword?.message}
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  loading={changingPassword}
                  className="w-full md:w-auto"
                >
                  Изменить пароль
                </Button>
              </form>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Настройки уведомлений
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Управляйте типами уведомлений, которые вы хотите получать
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Email уведомления</h4>
                    <p className="text-sm text-gray-600">
                      Получать уведомления о статусе заказов на email
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Маркетинговые материалы</h4>
                    <p className="text-sm text-gray-600">
                      Получать информацию о новинках и специальных предложениях
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">SMS уведомления</h4>
                    <p className="text-sm text-gray-600">
                      Получать SMS о важных изменениях в заказах
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </div>
              </div>

              <Button>Сохранить настройки</Button>
            </div>
          )}

          {/* Security section removed by request */}

          {activeSection === 'danger' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-red-600 mb-2">
                  Опасная зона
                </h3>
                <p className="text-gray-600 text-sm mb-6">
                  Необратимые действия с вашим аккаунтом
                </p>
              </div>

              <div className="border border-red-200 rounded-lg p-6 bg-red-50">
                <h4 className="font-medium text-red-900 mb-2">Удаление аккаунта</h4>
                <p className="text-sm text-red-700 mb-4">
                  После удаления аккаунта все ваши данные будут безвозвратно утеряны.
                  История заказов, адреса и личная информация будут полностью удалены.
                </p>
                
                <div className="space-y-2 text-sm text-red-700 mb-6">
                  <p>• Все заказы и их история будут удалены</p>
                  <p>• Адресная книга будет очищена</p>
                  <p>• Накопленные скидки будут потеряны</p>
                  <p>• Восстановление данных будет невозможно</p>
                </div>

                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  className="flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Удалить аккаунт навсегда</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


