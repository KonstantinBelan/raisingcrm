'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { telegramWebApp } from '@/lib/telegram';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initData: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initData, setInitData] = useState<string | null>(null);

  useEffect(() => {
    const authenticate = async () => {
      try {
        // Получаем initData из Telegram WebApp
        const telegramInitData = telegramWebApp.getInitData();
        
        if (!telegramInitData) {
          // В development режиме можем работать без Telegram
          if (process.env.NODE_ENV === 'development') {
            console.warn('No Telegram initData, using mock auth in development');
            // Пытаемся авторизоваться с mock данными
            await authenticateWithMock();
          } else {
            console.error('No Telegram initData available');
            setIsLoading(false);
          }
          return;
        }

        setInitData(telegramInitData);

        // Проверяем авторизацию на сервере
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': telegramInitData,
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          console.error('Authentication failed:', response.statusText);
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const authenticateWithMock = async () => {
      try {
        const response = await fetch('/api/auth/telegram/mock', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setInitData('mock-init-data');
        }
      } catch (error) {
        console.error('Mock authentication error:', error);
      }
    };

    authenticate();
  }, []);

  const logout = () => {
    setUser(null);
    setInitData(null);
    // Очищаем cookies
    document.cookie = 'telegram-init-data=; Max-Age=0; path=/';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        initData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
