import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// Mock endpoint только для development
export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV !== 'development' || process.env.USE_MOCK_AUTH !== 'true') {
    return NextResponse.json(
      { success: false, error: 'Mock auth is only available in development' },
      { status: 403 }
    );
  }

  try {
    const mockTelegramId = '123456789';

    // Найти или создать тестового пользователя
    let user = await prisma.user.findUnique({
      where: { telegramId: mockTelegramId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          telegramId: mockTelegramId,
          username: 'testuser',
          firstName: 'Тест',
          lastName: 'Пользователь',
          isPremium: false,
        },
      });
    }

    // Установить cookie с mock initData
    const cookieStore = await cookies();
    cookieStore.set('telegram-init-data', 'mock-init-data', {
      httpOnly: true,
      secure: false, // В development всегда false
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 дней
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isPremium: user.isPremium,
      },
    });
  } catch (error) {
    console.error('Mock auth error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
