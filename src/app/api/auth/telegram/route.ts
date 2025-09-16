import { NextRequest, NextResponse } from 'next/server';
import { validateTelegramWebAppData, parseUserFromInitData } from '@/lib/telegram';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { initData } = await request.json();

    if (!initData) {
      return NextResponse.json(
        { success: false, error: 'Init data is required' },
        { status: 400 }
      );
    }

    // Validate Telegram WebApp data
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { success: false, error: 'Bot token not configured' },
        { status: 500 }
      );
    }

    const isValid = validateTelegramWebAppData(initData, botToken);
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid Telegram data' },
        { status: 401 }
      );
    }

    // Parse user data
    const userData = parseUserFromInitData(initData);
    if (!userData) {
      return NextResponse.json(
        { success: false, error: 'Could not parse user data' },
        { status: 400 }
      );
    }

    // Find or create user in database
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
    } else {
      // Update user data if changed
      user = await prisma.user.update({
        where: { telegramId: userData.telegramId },
        data: {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
    }

    // Create session token (simple implementation)
    const sessionToken = Buffer.from(
      JSON.stringify({
        userId: user.id,
        telegramId: user.telegramId,
        timestamp: Date.now(),
      })
    ).toString('base64');

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user.id,
          telegramId: user.telegramId,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          isPremium: user.isPremium,
        },
        sessionToken,
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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'No valid session token' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7);
    
    try {
      const sessionData = JSON.parse(Buffer.from(sessionToken, 'base64').toString());
      
      // Check if session is not too old (24 hours)
      const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
      if (Date.now() - sessionData.timestamp > maxAge) {
        return NextResponse.json(
          { success: false, error: 'Session expired' },
          { status: 401 }
        );
      }

      const user = await prisma.user.findUnique({
        where: { id: sessionData.userId },
      });

      if (!user) {
        return NextResponse.json(
          { success: false, error: 'User not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        data: {
          user: {
            id: user.id,
            telegramId: user.telegramId,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            isPremium: user.isPremium,
          },
        },
      });
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid session token' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Session validation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
