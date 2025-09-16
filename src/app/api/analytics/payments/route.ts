import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
import { getUser } from '@/lib/auth';

type PaymentWithProject = {
  id: string;
  amount: Decimal;
  currency: string;
  status: string;
  project: {
    id: string;
    title: string;
    client: {
      id: string;
      name: string;
    } | null;
  } | null;
};

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const projectId = searchParams.get('projectId');

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const whereClause: Record<string, unknown> = {
      userId: user.id,
      createdAt: {
        gte: startDate,
      },
    };

    if (projectId) {
      whereClause.projectId = projectId;
    }

    // Get all payments for the period
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
    });

    // Calculate statistics
    const totalAmount = payments.reduce((sum: number, payment: PaymentWithProject) => sum + Number(payment.amount), 0);
    const paidAmount = payments
      .filter((p: PaymentWithProject) => p.status === 'PAID')
      .reduce((sum: number, payment: PaymentWithProject) => sum + Number(payment.amount), 0);
    const pendingAmount = payments
      .filter((p: PaymentWithProject) => p.status === 'PENDING')
      .reduce((sum: number, payment: PaymentWithProject) => sum + Number(payment.amount), 0);
    const overdueAmount = payments
      .filter((p: PaymentWithProject) => p.status === 'OVERDUE')
      .reduce((sum: number, payment: PaymentWithProject) => sum + Number(payment.amount), 0);

    // Group by currency
    const byCurrency = payments.reduce((acc: Record<string, { total: number; paid: number; pending: number; overdue: number; }>, payment: PaymentWithProject) => {
      if (!acc[payment.currency]) {
        acc[payment.currency] = {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
        };
      }
      
      acc[payment.currency].total += Number(payment.amount);
      
      if (payment.status === 'PAID') {
        acc[payment.currency].paid += Number(payment.amount);
      } else if (payment.status === 'PENDING') {
        acc[payment.currency].pending += Number(payment.amount);
      } else if (payment.status === 'OVERDUE') {
        acc[payment.currency].overdue += Number(payment.amount);
      }
      
      return acc;
    }, {} as Record<string, { total: number; paid: number; pending: number; overdue: number; }>);

    // Group by project
    const byProject = payments.reduce((acc: Record<string, { id: string | null; title: string; client: string | null; total: number; paid: number; pending: number; overdue: number; count: number; }>, payment: PaymentWithProject) => {
      const projectKey = payment.project?.id || 'no-project';
      const projectTitle = payment.project?.title || 'Без проекта';
      
      if (!acc[projectKey]) {
        acc[projectKey] = {
          id: payment.project?.id || null,
          title: projectTitle,
          client: payment.project?.client?.name || null,
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
          count: 0,
        };
      }
      
      acc[projectKey].total += Number(payment.amount);
      acc[projectKey].count += 1;
      
      if (payment.status === 'PAID') {
        acc[projectKey].paid += Number(payment.amount);
      } else if (payment.status === 'PENDING') {
        acc[projectKey].pending += Number(payment.amount);
      } else if (payment.status === 'OVERDUE') {
        acc[projectKey].overdue += Number(payment.amount);
      }
      
      return acc;
    }, {} as Record<string, { id: string | null; title: string; client: string | null; total: number; paid: number; pending: number; overdue: number; count: number; }>);

    // Monthly breakdown for the last 12 months
    const monthlyData = [];
    const now = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthPayments = await prisma.payment.findMany({
        where: {
          userId: user.id,
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          ...(projectId && { projectId }),
        },
      });
      
      const monthTotal = monthPayments.reduce((sum: number, p: { amount: Decimal }) => sum + Number(p.amount), 0);
      const monthPaid = monthPayments
        .filter((p: { status: string }) => p.status === 'PAID')
        .reduce((sum: number, p: { amount: Decimal }) => sum + Number(p.amount), 0);
      
      monthlyData.push({
        month: monthStart.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
        total: monthTotal,
        paid: monthPaid,
        pending: monthTotal - monthPaid,
      });
    }

    // Recent payments
    const recentPayments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    // Upcoming payments (due in next 30 days)
    const upcomingDate = new Date();
    upcomingDate.setDate(upcomingDate.getDate() + 30);
    
    const upcomingPayments = await prisma.payment.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
        dueDate: {
          gte: new Date(),
          lte: upcomingDate,
        },
        ...(projectId && { projectId }),
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            client: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    return NextResponse.json({
      summary: {
        total: totalAmount,
        paid: paidAmount,
        pending: pendingAmount,
        overdue: overdueAmount,
        count: payments.length,
        paidCount: payments.filter((p: { status: string }) => p.status === 'PAID').length,
        pendingCount: payments.filter((p: { status: string }) => p.status === 'PENDING').length,
        overdueCount: payments.filter((p: { status: string }) => p.status === 'OVERDUE').length,
      },
      byCurrency,
      byProject: Object.values(byProject),
      monthlyData,
      recentPayments,
      upcomingPayments,
      period: periodDays,
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
