// API client with automatic Telegram auth headers

import { telegramWebApp } from './telegram';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiClient(url: string, options: RequestOptions = {}) {
  const { skipAuth, ...fetchOptions } = options;

  // Получаем initData из Telegram
  const initData = telegramWebApp.getInitData();

  // Подготавливаем headers
  const headers = new Headers(fetchOptions.headers);
  
  if (!skipAuth && initData) {
    headers.set('X-Telegram-Init-Data', initData);
  }

  // В development режиме можем работать с cookies
  const credentials = process.env.NODE_ENV === 'development' ? 'include' : 'same-origin';

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: fetchOptions.credentials || credentials,
    });

    // Проверяем статус ответа
    if (!response.ok) {
      // Если 401 - проблема с авторизацией
      if (response.status === 401) {
        console.error('Unauthorized request to:', url);
        // Можно добавить редирект или показать сообщение
        throw new Error('Unauthorized');
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
}

// Вспомогательные методы
export const api = {
  get: (url: string, options?: RequestOptions) =>
    apiClient(url, { ...options, method: 'GET' }),

  post: (url: string, data?: unknown, options?: RequestOptions) =>
    apiClient(url, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  put: (url: string, data?: unknown, options?: RequestOptions) =>
    apiClient(url, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: (url: string, options?: RequestOptions) =>
    apiClient(url, { ...options, method: 'DELETE' }),

  patch: (url: string, data?: unknown, options?: RequestOptions) =>
    apiClient(url, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
    }),
};
