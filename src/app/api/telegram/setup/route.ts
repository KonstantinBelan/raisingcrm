import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    
    if (!botToken) {
      return NextResponse.json(
        { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Получаем URL приложения
    const { webhookUrl } = await request.json();
    
    if (!webhookUrl) {
      return NextResponse.json(
        { success: false, error: 'webhookUrl is required' },
        { status: 400 }
      );
    }

    const fullWebhookUrl = `${webhookUrl}/api/telegram/webhook`;

    // Устанавливаем webhook
    const setWebhookResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/setWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: fullWebhookUrl,
          secret_token: webhookSecret,
          allowed_updates: ['message', 'callback_query'],
          drop_pending_updates: true, // Очистить старые обновления
        }),
      }
    );

    const webhookData = await setWebhookResponse.json();

    if (!webhookData.ok) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to set webhook',
          details: webhookData.description,
        },
        { status: 500 }
      );
    }

    // Получаем информацию о webhook
    const getWebhookInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    const webhookInfo = await getWebhookInfoResponse.json();

    // Устанавливаем команды бота
    const setCommandsResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/setMyCommands`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          commands: [
            { command: 'start', description: 'Начать работу с ботом' },
            { command: 'help', description: 'Помощь по использованию' },
            { command: 'status', description: 'Статус бота' },
            { command: 'stats', description: 'Статистика задач' },
          ],
        }),
      }
    );

    const commandsData = await setCommandsResponse.json();

    return NextResponse.json({
      success: true,
      webhook: {
        url: fullWebhookUrl,
        isSet: webhookData.ok,
        info: webhookInfo.result,
      },
      commands: {
        isSet: commandsData.ok,
      },
    });
  } catch (error) {
    console.error('Telegram setup error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET метод для проверки текущего статуса webhook
export async function GET() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json(
        { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Получаем информацию о webhook
    const webhookInfoResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getWebhookInfo`
    );
    const webhookInfo = await webhookInfoResponse.json();

    // Получаем информацию о боте
    const getMeResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getMe`
    );
    const botInfo = await getMeResponse.json();

    // Получаем команды бота
    const getCommandsResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getMyCommands`
    );
    const commandsInfo = await getCommandsResponse.json();

    return NextResponse.json({
      success: true,
      bot: botInfo.result,
      webhook: webhookInfo.result,
      commands: commandsInfo.result,
    });
  } catch (error) {
    console.error('Telegram status error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// DELETE метод для удаления webhook
export async function DELETE() {
  try {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!botToken) {
      return NextResponse.json(
        { success: false, error: 'TELEGRAM_BOT_TOKEN not configured' },
        { status: 500 }
      );
    }

    // Удаляем webhook
    const deleteWebhookResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/deleteWebhook`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          drop_pending_updates: true,
        }),
      }
    );

    const data = await deleteWebhookResponse.json();

    return NextResponse.json({
      success: data.ok,
      message: 'Webhook deleted',
    });
  } catch (error) {
    console.error('Telegram delete webhook error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
