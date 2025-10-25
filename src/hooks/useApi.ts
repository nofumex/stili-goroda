import { useState, useEffect } from 'react';
import axios, { AxiosError } from 'axios';
import { ApiResponse } from '@/types';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  // Token will be sent via cookies automatically
  return config;
});

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        console.log('API: Token expired, attempting refresh...');
        const refreshResponse = await fetch('/api/auth/refresh', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (refreshResponse.ok) {
          console.log('API: Token refreshed successfully');
          return api(originalRequest);
        } else {
          console.log('API: Token refresh failed, redirecting to login');
          window.location.href = '/login';
          return Promise.reject(error);
        }
      } catch (refreshError) {
        console.log('API: Token refresh error:', refreshError);
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { api };

// Generic API hook
export function useApi<T = any>(
  url: string,
  options?: {
    immediate?: boolean;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    data?: any;
    dependencies?: any[];
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (customData?: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.request({
        url,
        method: options?.method || 'GET',
        data: customData || options?.data,
      });

      const result: ApiResponse<T> = response.data;

      if (result.success && result.data !== undefined) {
        setData(result.data);
      } else {
        setError(result.error || 'Произошла ошибка');
      }

      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options?.immediate !== false) {
      execute();
    }
  }, options?.dependencies || []);

  return {
    data,
    loading,
    error,
    execute,
    refetch: () => execute(),
  };
}

// Auth hooks
export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/login', { email, password });
      const result: ApiResponse = response.data;

      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Ошибка входа');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка входа';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const register = async (userData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    company?: string;
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/auth/register', userData);
      const result: ApiResponse = response.data;

      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Ошибка регистрации');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка регистрации';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}

export function useLogout() {
  const [loading, setLoading] = useState(false);

  const logout = async () => {
    try {
      setLoading(true);
      await api.post('/auth/logout');
    } catch (err) {
      // Ignore logout errors
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  };

  return { logout, loading };
}

// Products hooks
export function useProducts(filters?: any) {
  return useApi('/products', {
    dependencies: [JSON.stringify(filters)],
  });
}

// Products list with query params and pagination support for catalog
export function useProductsList(filters?: any) {
  const [data, setData] = useState<any[] | null>(null);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            if (Array.isArray(value)) {
              value.forEach((v) => params.append(key, String(v)));
            } else {
              params.append(key, String(value));
            }
          });
        }

        const url = `/products${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await api.get(url);
        const result: ApiResponse = response.data;

        if (result.success) {
          setData(result.data);
          setPagination((result as any).pagination || null);
        } else {
          setError(result.error || 'Произошла ошибка');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [JSON.stringify(filters)]);

  return { data, pagination, loading, error };
}

export function useProduct(slug: string) {
  return useApi(`/products/${slug}`, {
    immediate: !!slug,
    dependencies: [slug],
  });
}

// Categories hooks
export function useCategories(includeProducts = false) {
  return useApi(`/categories?includeProducts=${includeProducts}`);
}

// Orders hooks
export function useOrders(filters?: any) {
  return useApi('/orders', {
    dependencies: [JSON.stringify(filters)],
  });
}

export function useOrder(id: string) {
  return useApi(`/orders/${id}`, {
    immediate: !!id,
    dependencies: [id],
  });
}

// Create order hook
export function useCreateOrder() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrder = async (orderData: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.post('/orders', orderData);
      const result: ApiResponse = response.data;

      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Ошибка создания заказа');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка создания заказа';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createOrder, loading, error };
}

// Analytics hook
export function useAnalytics(filters?: any) {
  return useApi('/admin/analytics', {
    dependencies: [JSON.stringify(filters)],
  });
}

// Users hook
export function useUsers(filters?: any) {
  const [data, setData] = useState<any[] | null>(null);
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams();
        if (filters) {
          Object.entries(filters).forEach(([key, value]) => {
            if (value === undefined || value === null || value === '') return;
            params.append(key, String(value));
          });
        }

        const url = `/users${params.toString() ? `?${params.toString()}` : ''}`;
        const response = await api.get(url);
        const result: ApiResponse = response.data;

        if ((result as any).pagination) setPagination((result as any).pagination);
        if (result.success) {
          setData(result.data as any[]);
        } else {
          setError(result.error || 'Произошла ошибка');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [JSON.stringify(filters)]);

  return { data, pagination, loading, error };
}

// Settings hook
export function useSettings() {
  return useApi('/admin/settings');
}

// Public settings for site pages
export function usePublicSettings() {
  return useApi('/public-settings');
}

// Mutations hook for generic operations
export function useMutation<T = any>(
  url: string,
  method: 'POST' | 'PUT' | 'DELETE' = 'POST'
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = async (data?: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.request({
        url,
        method,
        data,
      });

      const result: ApiResponse<T> = response.data;

      if (result.success) {
        return result.data;
      } else {
        setError(result.error || 'Произошла ошибка');
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Произошла ошибка';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading, error };
}


