'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
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
  const { setNodeRef, isOver } = useDroppable({ 
    id,
    data: {
      type: 'status',
      status: id,
    }
  });
  
  return (
    <div 
      ref={setNodeRef} 
      data-droppable-status={id}
      className={`transition-all duration-200 ${
        isOver ? 'bg-primary/5 ring-2 ring-primary/20 rounded-lg' : ''
      }`}
    >
      {children}
      {isOver && (
        <div className="mt-2 h-1 bg-primary/30 rounded-full animate-pulse" />
      )}
    </div>
  );
};

export function TaskBoard({ initialTasks = [], onTaskUpdate }: TaskBoardProps) {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [originalTaskStatus, setOriginalTaskStatus] = useState<string | null>(null);
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
    // Validate status before sending
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    if (!validStatuses.includes(newStatus)) {
      console.error('Invalid status:', newStatus);
      return;
    }

    // Оптимистично обновляем UI
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus as Task['status'] } : task
      )
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        // Успешно обновлено, вызываем callback
        if (onTaskUpdate) {
          onTaskUpdate(taskId, newStatus);
        }
      } else {
        const errorData = await response.json();
        console.error('Failed to update task status:', errorData);
        alert(`Ошибка: ${errorData.error || 'Не удалось обновить статус задачи'}`);
        // Возвращаем задачи в исходное состояние
        fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
      alert('Ошибка сети при обновлении статуса задачи');
      // Возвращаем задачи в исходное состояние
      fetchTasks();
    }
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
    setOriginalTaskStatus(task?.status || null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Если перетаскиваем на себя, ничего не делаем
    if (activeId === overId) return;

    // Найдем активную задачу
    const activeTask = tasks.find(t => t.id === activeId);
    if (!activeTask) return;

    // Определим новый статус
    let newStatus = overId;
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    
    if (over.data?.current?.type === 'status') {
      newStatus = over.data.current.status;
    } else if (!validStatuses.includes(newStatus)) {
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        return;
      }
    }

    // Обновляем позицию задачи в реальном времени для визуального эффекта
    setTasks(prevTasks => {
      const updatedTasks = [...prevTasks];
      const activeIndex = updatedTasks.findIndex(t => t.id === activeId);
      
      if (activeIndex !== -1) {
        // Удаляем задачу из текущей позиции
        const [movedTask] = updatedTasks.splice(activeIndex, 1);
        
        // Обновляем статус (может остаться тем же при сортировке внутри колонки)
        movedTask.status = newStatus as Task['status'];
        
        // Находим позицию для вставки
        let insertIndex = updatedTasks.length;
        
        if (validStatuses.includes(overId)) {
          // Если перетащили на колонку, добавляем в конец
          const tasksInStatus = updatedTasks.filter(t => t.status === newStatus);
          insertIndex = updatedTasks.findIndex(t => t.status === newStatus) + tasksInStatus.length;
        } else {
          // Если перетащили на задачу, вставляем перед ней
          const overIndex = updatedTasks.findIndex(t => t.id === overId);
          if (overIndex !== -1) {
            insertIndex = overIndex;
          }
        }
        
        // Вставляем задачу в новую позицию
        updatedTasks.splice(insertIndex, 0, movedTask);
      }
      
      return updatedTasks;
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    setActiveTask(null);
    
    if (!over) {
      // Если не было валидного drop target, возвращаем задачу на место
      fetchTasks();
      setOriginalTaskStatus(null);
      return;
    }

    const taskId = active.id as string;
    let newStatus = over.id as string;
    
    const validStatuses = ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'];
    
    // Определяем финальный статус
    if (over.data?.current?.type === 'status') {
      newStatus = over.data.current.status;
    } else if (!validStatuses.includes(newStatus)) {
      const overTask = tasks.find(t => t.id === over.id);
      if (overTask) {
        newStatus = overTask.status;
      } else {
        // Если не удалось определить статус, возвращаем задачу на место
        fetchTasks();
        setOriginalTaskStatus(null);
        return;
      }
    }
    
    // Отправляем обновление на сервер только если статус действительно изменился
    if (originalTaskStatus && originalTaskStatus !== newStatus) {
      updateTaskStatus(taskId, newStatus);
    }
    // Если статус не изменился (сортировка внутри колонки), ничего не отправляем
    
    setOriginalTaskStatus(null);
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
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {Object.entries(statusConfig).map(([status, config]) => {
          const statusTasks = getTasksByStatus(status);
          const stats = getStatusStats(status);
          const Icon = config.icon;

          return (
            <Card key={status} className={`${config.borderColor} border-2 touch-manipulation`}>
              <CardHeader className="pb-3 px-4 pt-4 sm:px-6 sm:pt-6">
                <CardTitle className="flex items-center justify-between text-base sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Icon className="w-5 h-5 sm:w-4 sm:h-4" />
                    {config.title}
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="text-sm sm:text-xs px-2 py-1 sm:px-1.5 sm:py-0.5">
                      {stats.total}
                    </Badge>
                    {stats.urgent > 0 && (
                      <Badge variant="destructive" className="text-sm sm:text-xs px-2 py-1 sm:px-1.5 sm:py-0.5">
                        <AlertTriangle className="w-4 h-4 sm:w-3 sm:h-3 mr-1" />
                        {stats.urgent}
                      </Badge>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="pt-0 px-4 pb-4 sm:px-6 sm:pb-6">
                <SortableContext
                  items={statusTasks.map(task => task.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <Droppable id={status}>
                    <div 
                      className="min-h-[250px] sm:min-h-[200px] space-y-4 sm:space-y-3"
                      data-status={status}
                    >
                      {statusTasks.map((task) => (
                        <TaskCard 
                          key={task.id} 
                          task={task} 
                          onStatusChange={updateTaskStatus}
                        />
                      ))}
                      
                      {statusTasks.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-40 sm:h-32 text-muted-foreground border-2 border-dashed border-muted-foreground/20 rounded-lg">
                          <Icon className="w-10 h-10 sm:w-8 sm:h-8 mb-2 opacity-50" />
                          <p className="text-base sm:text-sm text-center px-2">Перетащите задачу сюда</p>
                        </div>
                      )}
                    </div>
                  </Droppable>
                </SortableContext>
                
                <div className="mt-4 pt-3 border-t">
                  <Link href="/tasks/new">
                    <Button variant="ghost" size="sm" className="w-full justify-start h-10 sm:h-8 text-base sm:text-sm touch-manipulation">
                      <Plus className="w-5 h-5 sm:w-4 sm:h-4 mr-2" />
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
            <TaskCard task={activeTask} isDragging onStatusChange={updateTaskStatus} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
