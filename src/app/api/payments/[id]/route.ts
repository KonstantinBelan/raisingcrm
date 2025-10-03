import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
      include: {
        project: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error fetching payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { amount, currency, description, dueDate, status, paidDate, projectId } = body;

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

    // Check if payment exists and belongs to user
    const existingPayment = await prisma.payment.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Validate project if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.userId,
        },
      });

      if (!project) {
        return NextResponse.json(
          { error: 'Проект не найден' },
          { status: 400 }
        );
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      amount: Number(amount),
      currency: currency.trim(),
      description: description?.trim() || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      projectId: projectId || null,
    };

    // Handle status changes
    if (status && status !== existingPayment.status) {
      updateData.status = status;
      
      // Set paidDate when marking as PAID
      if (status === 'PAID' && !existingPayment.paidDate) {
        updateData.paidDate = paidDate ? new Date(paidDate) : new Date();
      }
      
      // Clear paidDate when changing from PAID to other status
      if (status !== 'PAID' && existingPayment.paidDate) {
        updateData.paidDate = null;
      }
    }

    // Handle manual paidDate update
    if (paidDate !== undefined) {
      updateData.paidDate = paidDate ? new Date(paidDate) : null;
    }

    const payment = await prisma.payment.update({
      where: {
        id: id,
      },
      data: updateData,
      include: {
        project: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                company: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if payment exists and belongs to user
    const payment = await prisma.payment.findFirst({
      where: {
        id: id,
        userId: session.userId,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Check if payment is already paid
    if (payment.status === 'PAID') {
      return NextResponse.json(
        { 
          error: 'Нельзя удалить оплаченный платеж. Сначала измените статус.' 
        },
        { status: 400 }
      );
    }

    await prisma.payment.delete({
      where: {
        id: id,
      },
    });

    return NextResponse.json({ message: 'Payment deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
