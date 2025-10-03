import { NextRequest, NextResponse } from 'next/server';
import { bot, initBot } from '@/lib/telegram-bot';

export async function POST(request: NextRequest) {
  try {
    // Проверяем secret token если он настроен
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    if (webhookSecret) {
      const secretToken = request.headers.get('x-telegram-bot-api-secret-token');
      if (secretToken !== webhookSecret) {
        console.error('Invalid webhook secret token');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    }

    const body = await request.json();
    
    console.log('Received Telegram update:', {
      updateId: body.update_id,
      hasMessage: !!body.message,
      messageType: body.message?.text ? 'text' : body.message?.photo ? 'photo' : 'other',
    });

    // Инициализируем бот если еще не инициализирован
    await initBot();
    
    // Process the update with Grammy bot
    await bot.handleUpdate(body);
    
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Health check endpoint
export async function GET() {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  return NextResponse.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    configured: {
      botToken: !!botToken,
      webhookSecret: !!webhookSecret,
    }
  });
}
