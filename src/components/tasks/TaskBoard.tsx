'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  useDroppable,
  DragOverlay,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  Play,
  Plus,
  Eye
} from 'lucide-react';
import Link from 'next/link';
import { TaskCard } from './TaskCard';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string;
  dueDate?: string;
  project?: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskBoardProps {
  initialTasks?: Task[];
  onTaskUpdate?: (taskId: string, newStatus: string) => void;
}

const statusConfig = {
  TODO: {
    title: 'К выполнению',
    icon: Clock,
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    borderColor: 'border-gray-200 dark:border-gray-700'
  },
  IN_PROGRESS: {
    title: 'В работе',
    icon: Play,
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    borderColor: 'border-blue-200 dark:border-blue-700'
  },
  REVIEW: {
    title: 'На проверке',
    icon: Eye,
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    borderColor: 'border-yellow-200 dark:border-yellow-700'
  },
  DONE: {
    title: 'Выполнено',
    icon: CheckCircle,
    color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    borderColor: 'border-green-200 dark:border-green-700'
  }
};

// Droppable component
const Droppable = ({ children, id }: { children: React.ReactNode; id: string }) => {
  const { setNodeRef } = useDroppable({ id });
  
  return (
    <div ref={setNodeRef}>
      {children}
    </div>
  );
};

export function TaskBoard({ initialTasks = [], onTaskUpdate }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    if (initialTasks.length === 0) {
      fetchTasks();
    }
  }, [initialTasks.length]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
          )
        );
        
        if (onTaskUpdate) {
          onTaskUpdate(taskId, newStatus);
        }
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }

    const taskId = active.id as string;
    const newStatus = over.id as string;
    
    const task = tasks.find(t => t.id === taskId);
    
    if (task && task.status !== newStatus) {
      updateTaskStatus(taskId, newStatus);
    }
    
    setActiveTask(null);
  };

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const getStatusStats = (status: string) => {
    const statusTasks = getTasksByStatus(status);
    const urgentCount = statusTasks.filter(task => task.priority === 'URGENT').length;
    const overdueCount = statusTasks.filter(task => {
      if (!task.deadline && !task.dueDate) return false;
      const deadline = new Date(task.deadline || task.dueDate!);
      return deadline < new Date() && status !== 'DONE';
    }).length;

    return { total: statusTasks.length, urgent: urgentCount, overdue: overdueCount };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusTasks = getTasksByStatus(status);
          const stats = getStatusStats(status);
          const Icon = config.icon;

          return (
            <Card key={status} className={`${config.borderColor} border-2`}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    {config.title}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {stats.total}
                    </Badge>
                    {stats.urgent > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {stats.urgent}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0">
                <SortableContext
                  items={statusTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Droppable id={status}>
                    <div 
                      className="min-h-[200px] space-y-3"
                      data-status={status}
                    >
                      {statusTasks.map((task) => (
                        <TaskCard key={task.id} task={task} />
                      ))}
                      
                      {statusTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <Icon className="w-8 h-8 mb-2 opacity-50" />
                          <p className="text-sm">Нет задач</p>
                        </div>
                      )}
                    </div>
                  </Droppable>
                </SortableContext>
                
                <div className="mt-4 pt-3 border-t">
                  <Link href="/tasks/new">
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      <Plus className="w-4 h-4 mr-2" />
                      Добавить задачу
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="rotate-3 opacity-90">
            <TaskCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
