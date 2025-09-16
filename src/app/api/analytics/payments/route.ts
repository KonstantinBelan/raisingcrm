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
    const period = searchParams.get('period') || '30'; // days
    const projectId = searchParams.get('projectId');

    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    const whereClause: any = {
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
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const paidAmount = payments
      .filter(p => p.status === 'PAID')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, payment) => sum + payment.amount, 0);
    const overdueAmount = payments
      .filter(p => p.status === 'OVERDUE')
      .reduce((sum, payment) => sum + payment.amount, 0);

    // Group by currency
    const byCurrency = payments.reduce((acc, payment) => {
      if (!acc[payment.currency]) {
        acc[payment.currency] = {
          total: 0,
          paid: 0,
          pending: 0,
          overdue: 0,
        };
      }
      
      acc[payment.currency].total += payment.amount;
      
      if (payment.status === 'PAID') {
        acc[payment.currency].paid += payment.amount;
      } else if (payment.status === 'PENDING') {
        acc[payment.currency].pending += payment.amount;
      } else if (payment.status === 'OVERDUE') {
        acc[payment.currency].overdue += payment.amount;
      }
      
      return acc;
    }, {} as Record<string, any>);

    // Group by project
    const byProject = payments.reduce((acc, payment) => {
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
      
      acc[projectKey].total += payment.amount;
      acc[projectKey].count += 1;
      
      if (payment.status === 'PAID') {
        acc[projectKey].paid += payment.amount;
      } else if (payment.status === 'PENDING') {
        acc[projectKey].pending += payment.amount;
      } else if (payment.status === 'OVERDUE') {
        acc[projectKey].overdue += payment.amount;
      }
      
      return acc;
    }, {} as Record<string, any>);

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
      
      const monthTotal = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const monthPaid = monthPayments
        .filter(p => p.status === 'PAID')
        .reduce((sum, p) => sum + p.amount, 0);
      
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
        paidCount: payments.filter(p => p.status === 'PAID').length,
        pendingCount: payments.filter(p => p.status === 'PENDING').length,
        overdueCount: payments.filter(p => p.status === 'OVERDUE').length,
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
