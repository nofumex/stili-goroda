'use client';

import React, { useState } from 'react';
import { Edit, Save, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useMutation } from '@/hooks/useApi';
import { updateProfileSchema, UpdateProfileInput } from '@/lib/validations';
import { AuthUser } from '@/types';

interface ProfileInfoProps {
  user: AuthUser;
}

export const ProfileInfo: React.FC<ProfileInfoProps> = ({ user }) => {
  const [isEditing, setIsEditing] = useState(false);
  const { success, error } = useToast();
  const { mutate: updateProfile, loading } = useMutation('/api/users/profile', 'PUT');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      company: user.company || '',
    },
  });

  const onSubmit = async (data: UpdateProfileInput) => {
    try {
      await updateProfile(data);
      success('Профиль обновлён', 'Изменения успешно сохранены');
      setIsEditing(false);
    } catch (err) {
      error('Ошибка обновления', 'Не удалось сохранить изменения');
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Личная информация</h2>
        {!isEditing && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2"
          >
            <Edit className="h-4 w-4" />
            <span>Редактировать</span>
          </Button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Имя"
              {...register('firstName')}
              error={errors.firstName?.message}
            />
            <Input
              label="Фамилия"
              {...register('lastName')}
              error={errors.lastName?.message}
            />
          </div>

          <Input
            label="Телефон"
            type="tel"
            {...register('phone')}
            error={errors.phone?.message}
            placeholder="+7 (___) ___-__-__"
          />

          <Input
            label="Компания"
            {...register('company')}
            error={errors.company?.message}
            placeholder="Название компании"
          />

          <div className="flex space-x-4">
            <Button
              type="submit"
              loading={loading}
              className="flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Сохранить</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Отмена</span>
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Имя
              </label>
              <p className="text-gray-900">{user.firstName}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Фамилия
              </label>
              <p className="text-gray-900">{user.lastName}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <p className="text-gray-900">{user.email}</p>
            <p className="text-sm text-gray-500 mt-1">
              Для изменения email обратитесь в поддержку
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Телефон
            </label>
            <p className="text-gray-900">{user.phone || 'Не указан'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Компания
            </label>
            <p className="text-gray-900">{user.company || 'Не указана'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Роль
            </label>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {user.role === 'ADMIN' ? 'Администратор' : 
               user.role === 'MANAGER' ? 'Менеджер' : 'Клиент'}
            </span>
          </div>
        </div>
      )}

      {/* Account statistics: removed mock values; will be populated from real data later */}
    </div>
  );
};


