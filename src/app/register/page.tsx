'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useRegister } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { registerSchema, RegisterInput } from '@/lib/validations';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();
  const { register: registerUser } = useRegister();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const result = await registerUser(data);
      
      if (result.user) {
        setUser(result.user);
        success('Регистрация успешна!', 'Добро пожаловать в Стиль Города');
        router.push('/profile');
      }
    } catch (err) {
      error('Ошибка регистрации', 'Возможно, пользователь с таким email уже существует');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header is global from RootLayout */}
      
      <main className="flex-1 bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Регистрация</h1>
                <p className="text-gray-600 mt-2">
                  Создайте аккаунт для оформления заказов
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Имя"
                    {...register('firstName')}
                    error={errors.firstName?.message}
                    placeholder="Иван"
                    autoComplete="given-name"
                  />

                  <Input
                    label="Фамилия"
                    {...register('lastName')}
                    error={errors.lastName?.message}
                    placeholder="Петров"
                    autoComplete="family-name"
                  />
                </div>

                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="your@email.com"
                  autoComplete="email"
                />

                <Input
                  label="Телефон"
                  type="tel"
                  {...register('phone')}
                  error={errors.phone?.message}
                  placeholder="+7 (___) ___-__-__"
                  autoComplete="tel"
                  helperText="Необязательно"
                />

                <Input
                  label="Компания"
                  {...register('company')}
                  error={errors.company?.message}
                  placeholder="ООО Ваша компания"
                  autoComplete="organization"
                  helperText="Необязательно"
                />

                <div className="relative">
                  <Input
                    label="Пароль"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={errors.password?.message}
                    placeholder="Минимум 6 символов"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex items-start">
                  <input
                    type="checkbox"
                    required
                    className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label className="ml-2 text-sm text-gray-600">
                    Я согласен на обработку персональных данных
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={isSubmitting}
                >
                  Зарегистрироваться
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Уже есть аккаунт?{' '}
                  <Link
                    href="/login"
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Войти
                  </Link>
                </p>
              </div>

            </div>
          </div>
        </div>
      </main>
      
      {/* Footer is global from RootLayout */}
    </div>
  );
}


