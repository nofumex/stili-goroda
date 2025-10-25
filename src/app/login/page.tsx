'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { useLogin } from '@/hooks/useApi';
import { useAuthStore } from '@/store/auth';
import { loginSchema, LoginInput } from '@/lib/validations';
import { Header } from '@/components/layout/header';

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { success, error } = useToast();
  const { login } = useLogin();
  const { setUser } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const result = await login(data.email, data.password);
      
      if (result.user) {
        setUser(result.user);
        success('Добро пожаловать!', 'Вы успешно вошли в систему');
        
        // Redirect based on role
        if (result.user.role === 'ADMIN' || result.user.role === 'MANAGER') {
          router.push('/admin');
        } else {
          router.push('/profile');
        }
      }
    } catch (err) {
      error('Ошибка входа', 'Проверьте правильность email и пароля');
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
                  <LogIn className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Вход в систему</h1>
                <p className="text-gray-600 mt-2">
                  Войдите в свой аккаунт для оформления заказов
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <Input
                  label="Email"
                  type="email"
                  {...register('email')}
                  error={errors.email?.message}
                  placeholder="your@email.com"
                  autoComplete="email"
                />

                <div className="relative">
                  <Input
                    label="Пароль"
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    error={errors.password?.message}
                    placeholder="Введите пароль"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-sm text-gray-600">Запомнить меня</span>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  loading={isSubmitting}
                >
                  Войти
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-600">
                  Нет аккаунта?{' '}
                  <Link
                    href="/register"
                    className="text-primary-600 hover:text-primary-500 font-medium"
                  >
                    Зарегистрироваться
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


