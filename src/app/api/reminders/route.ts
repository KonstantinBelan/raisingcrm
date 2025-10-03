import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const upcoming = searchParams.get('upcoming') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const whereClause: Prisma.ReminderWhereInput = {
      userId: session.userId,
    };

    if (upcoming) {
      whereClause.scheduledAt = {
        gte: new Date(),
      };
      whereClause.sent = false;
    }

    const reminders = await prisma.reminder.findMany({
      where: whereClause,
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        scheduledAt: 'asc',
      },
      take: limit,
    });

    return NextResponse.json({
      success: true,
      reminders,
    });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, message, scheduledAt, projectId, taskId } = body;

    if (!title || !message || !scheduledAt) {
      return NextResponse.json(
        { success: false, error: 'Title, message, and scheduledAt are required' },
        { status: 400 }
      );
    }

    // Validate project exists if provided
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: projectId,
          userId: session.userId,
        },
      });

      if (!project) {
        return NextResponse.json(
          { success: false, error: 'Project not found' },
          { status: 404 }
        );
      }
    }

    // Validate task exists if provided
    if (taskId) {
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
          userId: session.userId,
        },
      });

      if (!task) {
        return NextResponse.json(
          { success: false, error: 'Task not found' },
          { status: 404 }
        );
      }
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        message,
        scheduledAt: new Date(scheduledAt),
        userId: session.userId,
        projectId: projectId || null,
        taskId: taskId || null,
      },
      include: {
        project: {
          select: {
            id: true,
            title: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      reminder,
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
