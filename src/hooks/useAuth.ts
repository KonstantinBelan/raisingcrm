import { useState, useEffect } from 'react';
import { telegramWebApp } from '@/lib/telegram';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  isPremium: boolean;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  sessionToken: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    sessionToken: null,
  });

  const authenticate = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const initData = telegramWebApp.getInitData();
      if (!initData) {
        throw new Error('No Telegram init data available');
      }

      const response = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Authentication failed');
      }

      const { user, sessionToken } = result.data;

      // Store session token in localStorage
      localStorage.setItem('sessionToken', sessionToken);

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        sessionToken,
      });

      return { user, sessionToken };
    } catch (error) {
      console.error('Authentication error:', error);
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionToken: null,
      });
      throw error;
    }
  };

  const validateSession = async (token: string) => {
    try {
      const response = await fetch('/api/auth/telegram', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Session validation failed');
      }

      const { user } = result.data;

      setAuthState({
        user,
        isLoading: false,
        isAuthenticated: true,
        sessionToken: token,
      });

      return user;
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.removeItem('sessionToken');
      setAuthState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
        sessionToken: null,
      });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('sessionToken');
    setAuthState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      sessionToken: null,
    });
  };

  // Initialize authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check for existing session token
        const storedToken = localStorage.getItem('sessionToken');
        
        if (storedToken) {
          // Validate existing session
          await validateSession(storedToken);
        } else {
          // Authenticate with Telegram
          await authenticate();
        }
      } catch (error) {
        // If authentication fails, try to authenticate again
        try {
          await authenticate();
        } catch (authError) {
          console.error('Failed to authenticate:', authError);
          setAuthState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            sessionToken: null,
          });
        }
      }
    };

    // Only initialize if we're in Telegram WebApp environment
    if (telegramWebApp.isInTelegram()) {
      initAuth();
    } else {
      // For development/testing outside Telegram
      setAuthState({
        user: {
          id: 'dev-user',
          telegramId: '123456789',
          firstName: 'Dev',
          lastName: 'User',
          username: 'devuser',
          isPremium: false,
        },
        isLoading: false,
        isAuthenticated: true,
        sessionToken: 'dev-token',
      });
    }
  }, []);

  return {
    ...authState,
    authenticate,
    logout,
    validateSession,
  };
}
