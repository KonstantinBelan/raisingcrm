import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Get time sessions for this task
    const timeSessions = await prisma.timeSession.findMany({
      where: {
        taskId: id,
        userId: session.userId,
      },
      orderBy: {
        startTime: 'desc',
      },
    });

    return NextResponse.json({
      success: true,
      timeSessions,
    });
  } catch (error) {
    console.error('Error fetching time sessions:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { startTime, endTime, duration, comment } = body;

    // Validate required fields
    if (!startTime || !endTime || !duration) {
      return NextResponse.json(
        { success: false, error: 'startTime, endTime, and duration are required' },
        { status: 400 }
      );
    }

    // Check if task exists and belongs to user
    const task = await prisma.task.findFirst({
      where: {
        id,
        userId: session.userId,
      },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: 'Task not found' },
        { status: 404 }
      );
    }

    // Create time session
    const timeSession = await prisma.timeSession.create({
      data: {
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration: parseFloat(duration),
        comment: comment?.trim() || null,
        userId: session.userId,
        taskId: id,
      },
    });

    // Update task's actual hours
    const totalDurationHours = duration / 3600; // Convert seconds to hours
    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        actualHours: {
          increment: totalDurationHours,
        },
      },
      include: {
        project: true,
        parentTask: true,
        subtasks: true,
      },
    });

    return NextResponse.json({
      success: true,
      timeSession,
      task: updatedTask,
    });
  } catch (error) {
    console.error('Error creating time session:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
