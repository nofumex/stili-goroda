// Универсальная функция для авторизованных запросов
export async function authorizedFetch(url: string, options: RequestInit = {}) {
  const defaultOptions: RequestInit = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  // Если получили 401, пытаемся обновить токен
  if (response.status === 401) {
    try {
      console.log('Authorized fetch: Token expired, attempting refresh...');
      const refreshResponse = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (refreshResponse.ok) {
        console.log('Authorized fetch: Token refreshed, retrying original request...');
        // Повторяем оригинальный запрос
        return fetch(url, { ...defaultOptions, ...options });
      } else {
        console.log('Authorized fetch: Token refresh failed, redirecting to login');
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
    } catch (refreshError) {
      console.log('Authorized fetch: Token refresh error:', refreshError);
      window.location.href = '/login';
      throw refreshError;
    }
  }

  return response;
}

// Хук для использования авторизованных запросов
export function useAuthorizedFetch() {
  return { authorizedFetch };
}