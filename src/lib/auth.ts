import { NextRequest } from 'next/server';
import { parseUserFromInitData, validateTelegramWebAppData } from './telegram';
import { prisma } from './prisma';

export interface AuthSession {
  userId: string;
  telegramId: string;
  username?: string;
  firstName?: string;
}

export async function auth(request: NextRequest): Promise<AuthSession | null> {
  try {
    // В режиме разработки можно использовать mock данные
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true') {
      return {
        userId: 'cmfmq07ub0000nlarbsy9j798',
        telegramId: '123456789',
        username: 'testuser',
        firstName: 'Тест',
      };
    }

    // Получаем initData из заголовков или куков
    const initData = request.headers.get('x-telegram-init-data') || 
                     request.cookies.get('telegram-init-data')?.value;
    
    if (!initData) {
      console.error('No Telegram init data provided');
      return null;
    }

    // Валидируем данные Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      throw new Error('TELEGRAM_BOT_TOKEN not configured');
    }

    const isValid = await validateTelegramWebAppData(initData, botToken);
    if (!isValid) {
      console.error('Invalid Telegram init data');
      return null;
    }

    // Парсим данные пользователя
    const userData = parseUserFromInitData(initData);
    if (!userData) {
      console.error('Failed to parse user data');
      return null;
    }

    // Находим или создаем пользователя в БД
    let user = await prisma.user.findUnique({
      where: { telegramId: userData.telegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: userData.telegramId,
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
    }

    return {
      userId: user.id,
      telegramId: user.telegramId,
      username: user.username || undefined,
      firstName: user.firstName || undefined,
    };
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export async function requireAuth(request: NextRequest): Promise<AuthSession> {
  const session = await auth(request);
  if (!session) {
    throw new Error('Unauthorized');
  }
  return session;
}

export async function getUser(): Promise<{ id: string; telegramId: string; username?: string; firstName?: string } | null> {
  try {
    // В режиме разработки можно использовать mock данные
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_AUTH === 'true') {
      return {
        id: 'cmfmq07ub0000nlarbsy9j798',
        telegramId: '123456789',
        username: 'testuser',
        firstName: 'Тест',
      };
    }

    // В production это должно получать данные из контекста запроса
    // Для клиентской стороны можно использовать другой подход
    return null;
  } catch (error) {
    console.error('Get user error:', error);
    return null;
  }
}
