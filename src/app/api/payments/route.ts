import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getUser } from '@/lib/auth';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const projectId = searchParams.get('projectId');

    const whereClause: Record<string, unknown> = {
      userId: user.id,
    };

    if (search) {
      whereClause.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { 
          project: { 
            title: { contains: search, mode: 'insensitive' } 
          } 
        },
      ];
    }

    if (status && status !== 'ALL') {
      whereClause.status = status;
    }

    if (projectId) {
      whereClause.projectId = projectId;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first, then others
        { dueDate: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Update overdue payments
    const now = new Date();
    const updatedPayments = payments.map((payment: { dueDate: Date | null; status: string; id: string }) => {
      if (payment.status === 'PENDING' && payment.dueDate && new Date(payment.dueDate) < now) {
        return { ...payment, status: 'OVERDUE' };
      }
      return payment;
    });

    const overduePayments = updatedPayments.filter((p: { status: string; id: string; dueDate: Date | null }) => p.status === 'OVERDUE');

    if (overduePayments.length > 0) {
      await prisma.payment.updateMany({
        where: {
          id: { in: overduePayments.map((p: { id: string }) => p.id) },
        },
        data: {
          status: 'OVERDUE',
        },
      });

      // Refresh payments after status update
      const updatedPayments = await prisma.payment.findMany({
        where: whereClause,
        include: {
          project: {
            select: {
              id: true,
              title: true,
              client: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: [
          { status: 'asc' },
          { dueDate: 'asc' },
          { createdAt: 'desc' },
        ],
      });

      return NextResponse.json({ payments: updatedPayments });
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency, description, dueDate, projectId } = body;

    // Validation
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Сумма платежа должна быть больше 0' },
        { status: 400 }
      );
    }

    if (!currency) {
      return NextResponse.json(
        { error: 'Валюта обязательна для заполнения' },
        { status: 400 }
      );
    }

    // Validate project if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: user.id,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Проект не найден' },
          { status: 400 }
        );
      }
    }

    const payment = await prisma.payment.create({
      data: {
        amount: Number(amount),
        currency: currency.trim(),
        description: description?.trim() || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: 'PENDING',
        userId: user.id,
        projectId: projectId || null,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ payment }, { status: 201 });
  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
