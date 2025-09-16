import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/telegram-bot';

export async function POST(request: NextRequest) {
  try {
    const { webhookUrl } = await request.json();
    
    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Set webhook for the bot
    await bot.api.setWebhook(webhookUrl);
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook set successfully',
      webhookUrl 
    });
  } catch (error) {
    console.error('Error setting webhook:', error);
    return NextResponse.json(
      { error: 'Failed to set webhook' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get webhook info
    const webhookInfo = await bot.api.getWebhookInfo();
    
    return NextResponse.json({
      webhook: webhookInfo,
      botInfo: await bot.api.getMe()
    });
  } catch (error) {
    console.error('Error getting webhook info:', error);
    return NextResponse.json(
      { error: 'Failed to get webhook info' },
      { status: 500 }
    );
  }
}
