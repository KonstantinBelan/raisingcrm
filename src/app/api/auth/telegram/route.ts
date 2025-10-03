import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { parseUserFromInitData, validateTelegramWebAppData } from '@/lib/telegram';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Получаем initData из заголовка
    const initData = request.headers.get('x-telegram-init-data');
    
    if (!initData) {
      return NextResponse.json(
        { success: false, error: 'No Telegram init data provided' },
        { status: 401 }
      );
    }

    // Валидируем данные Telegram
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      console.error('TELEGRAM_BOT_TOKEN not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Проверяем подпись данных
    const isValid = await validateTelegramWebAppData(initData, botToken);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid Telegram data' },
        { status: 401 }
      );
    }

    // Парсим данные пользователя
    const userData = parseUserFromInitData(initData);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Failed to parse user data' },
        { status: 400 }
      );
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
          isPremium: false,
        },
      });
    }

    // Сохраняем initData в cookie для последующих запросов
    const cookieStore = await cookies();
    cookieStore.set('telegram-init-data', initData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
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
    console.error('Authentication error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET метод для проверки текущей сессии
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const initData = cookieStore.get('telegram-init-data')?.value;

    if (!initData) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Парсим данные пользователя из сохраненного initData
    const userData = parseUserFromInitData(initData);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Получаем пользователя из БД
    const user = await prisma.user.findUnique({
      where: { telegramId: userData.telegramId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

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
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
