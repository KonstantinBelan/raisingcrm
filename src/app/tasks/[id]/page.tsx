'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, Clock, User, Briefcase, Play, Pause, Square } from 'lucide-react';
import Link from 'next/link';
import { Task } from '@/types';

const statusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800',
};

const statusLabels = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Выполнено',
};

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-yellow-100 text-yellow-700',
  HIGH: 'bg-orange-100 text-orange-700',
  URGENT: 'bg-red-100 text-red-700',
};

const priorityLabels = {
  LOW: 'Низкий',
  MEDIUM: 'Средний',
  HIGH: 'Высокий',
  URGENT: 'Срочный',
};

export default function TaskDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeTracking, setTimeTracking] = useState(false);
  const [sessionTime, setSessionTime] = useState(0);

  useEffect(() => {
    fetchTask();
  }, [params.id]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeTracking) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeTracking]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
      } else if (response.status === 404) {
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/tasks');
      } else {
        alert('Ошибка при удалении задачи');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('Ошибка при удалении задачи');
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!task) return;

    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
      } else {
        alert('Ошибка при изменении статуса');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Ошибка при изменении статуса');
    }
  };

  const handleTimeTracking = () => {
    if (timeTracking) {
      // Stop tracking and save time
      if (sessionTime > 0) {
        saveTimeSession();
      }
      setTimeTracking(false);
    } else {
      // Start tracking
      setSessionTime(0);
      setTimeTracking(true);
      if (task?.status === 'TODO') {
        handleStatusChange('IN_PROGRESS');
      }
    }
  };

  const saveTimeSession = async () => {
    if (!task || sessionTime === 0) return;

    const hoursToAdd = sessionTime / 3600; // Convert seconds to hours
    const newActualHours = (task.actualHours || 0) + hoursToAdd;

    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ actualHours: newActualHours }),
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        setSessionTime(0);
      }
    } catch (error) {
      console.error('Error saving time:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const isOverdue = (date: Date | string) => {
    return new Date() > new Date(date);
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Задача не найдена</h3>
            <p className="text-muted-foreground mb-4">Задача может быть удалена или у вас нет доступа к ней</p>
            <Link href="/tasks">
              <Button>Вернуться к задачам</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/tasks">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к задачам
          </Button>
        </Link>
      </div>

      {/* Task Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{task.title}</CardTitle>
                <Badge className={statusColors[task.status]}>
                  {statusLabels[task.status]}
                </Badge>
                <Badge className={priorityColors[task.priority]}>
                  {priorityLabels[task.priority]}
                </Badge>
              </div>
              {task.description && (
                <CardDescription className="text-base">{task.description}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/tasks/${task.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={handleDeleteTask}>
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {task.project && (
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Проект:</span>
                <Link href={`/projects/${task.project.id}`}>
                  <span className="font-medium hover:underline">{task.project.title}</span>
                </Link>
              </div>
            )}
            {task.parentTask && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Родительская:</span>
                <Link href={`/tasks/${task.parentTask.id}`}>
                  <span className="font-medium hover:underline">{task.parentTask.title}</span>
                </Link>
              </div>
            )}
            {task.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Дедлайн:</span>
                <span className={`font-medium ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
                  {formatDate(task.dueDate)}
                  {isOverdue(task.dueDate) && ' (просрочено)'}
                </span>
              </div>
            )}
            {task.estimatedHours && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Оценка:</span>
                <span className="font-medium">{task.estimatedHours}ч</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Clock className="w-5 h-5 mr-2" />
            Трекинг времени
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Текущая сессия</p>
              <p className="text-2xl font-mono font-bold">{formatTime(sessionTime)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Всего потрачено</p>
              <p className="text-2xl font-bold">{task.actualHours || 0}ч</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Оценка</p>
              <p className="text-2xl font-bold">{task.estimatedHours || 0}ч</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleTimeTracking}
              variant={timeTracking ? "destructive" : "default"}
            >
              {timeTracking ? (
                <>
                  <Square className="w-4 h-4 mr-2" />
                  Остановить
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Начать работу
                </>
              )}
            </Button>
            {sessionTime > 0 && !timeTracking && (
              <Button onClick={saveTimeSession} variant="outline">
                Сохранить время
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Status Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Изменить статус</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {task.status !== 'TODO' && (
              <Button
                onClick={() => handleStatusChange('TODO')}
                variant="outline"
                size="sm"
              >
                К выполнению
              </Button>
            )}
            {task.status !== 'IN_PROGRESS' && (
              <Button
                onClick={() => handleStatusChange('IN_PROGRESS')}
                variant="outline"
                size="sm"
              >
                В работу
              </Button>
            )}
            {task.status !== 'REVIEW' && (
              <Button
                onClick={() => handleStatusChange('REVIEW')}
                variant="outline"
                size="sm"
              >
                На проверку
              </Button>
            )}
            {task.status !== 'DONE' && (
              <Button
                onClick={() => handleStatusChange('DONE')}
                variant="outline"
                size="sm"
              >
                Завершить
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subtasks */}
      {task.subtasks && task.subtasks.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Подзадачи ({task.subtasks.length})</CardTitle>
              <Link href={`/tasks/new?parentTaskId=${task.id}`}>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить подзадачу
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {task.subtasks.map((subtask: Task) => (
                <Link key={subtask.id} href={`/tasks/${subtask.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium">{subtask.title}</h4>
                            <Badge className={statusColors[subtask.status]}>
                              {statusLabels[subtask.status]}
                            </Badge>
                          </div>
                          {subtask.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {subtask.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
