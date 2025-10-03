import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    const whereClause: Record<string, unknown> = {
      userId: session.userId,
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const clients = await prisma.client.findMany({
      where: whereClause,
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('[CLIENTS POST] Starting client creation...');
    const session = await auth(request);
    console.log('[CLIENTS POST] Auth session:', session ? { userId: session.userId, telegramId: session.telegramId } : 'null');
    
    if (!session) {
      console.error('[CLIENTS POST] No session - unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, email, phone, company, notes } = body;
    console.log('[CLIENTS POST] Request body:', { name, email, phone, company, notes });

    // Validation
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Имя клиента обязательно для заполнения' },
        { status: 400 }
      );
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Некорректный формат email' },
        { status: 400 }
      );
    }

    // Check if client with same email already exists
    if (email) {
      const existingClient = await prisma.client.findFirst({
        where: {
          userId: session.userId,
          email: email,
        },
      });

      if (existingClient) {
        return NextResponse.json(
          { error: 'Клиент с таким email уже существует' },
          { status: 400 }
        );
      }
    }

    console.log('[CLIENTS POST] Creating client with userId:', session.userId);
    
    // Проверяем, существует ли пользователь в БД
    const userExists = await prisma.user.findUnique({
      where: { id: session.userId },
    });
    console.log('[CLIENTS POST] User exists in DB:', !!userExists);
    
    if (!userExists) {
      console.error('[CLIENTS POST] User not found in database:', session.userId);
      return NextResponse.json({ error: 'User not found' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        notes: notes?.trim() || null,
        userId: session.userId,
      },
      include: {
        projects: {
          select: {
            id: true,
            title: true,
            status: true,
            budget: true,
            createdAt: true,
          },
        },
        _count: {
          select: {
            projects: true,
          },
        },
      },
    });

    console.log('[CLIENTS POST] Client created successfully:', client.id);
    return NextResponse.json({ client }, { status: 201 });
  } catch (error: any) {
    console.error('[CLIENTS POST] Error creating client:', error);
    console.error('[CLIENTS POST] Error details:', {
      message: error?.message,
      code: error?.code,
      meta: error?.meta,
    });
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
