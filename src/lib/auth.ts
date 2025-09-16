import { NextRequest } from 'next/server';

export interface AuthSession {
  userId: string;
  telegramId: string;
  username?: string;
  firstName?: string;
}

export async function auth(request: NextRequest): Promise<AuthSession | null> {
  try {
    // For development, return a mock session
    // In production, this would validate the actual Telegram WebApp data
    return {
      userId: 'test-user-1',
      telegramId: '123456789',
      username: 'testuser',
      firstName: 'Тест',
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function getUser(): Promise<{ id: string; telegramId: string; username?: string; firstName?: string } | null> {
  try {
    // For development, return a mock user
    // In production, this would get the current user from session/token
    return {
      id: 'test-user-1',
      telegramId: '123456789',
      username: 'testuser',
      firstName: 'Тест',
    };
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
