'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, Clock, User, Briefcase, Play, Pause, Square, X } from 'lucide-react';
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

export default function TaskDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [taskId, setTaskId] = useState<string>('');
  const [timeTracking, setTimeTracking] = useState({
    isTracking: false,
    startTime: null as Date | null,
    elapsedTime: 0,
  });
  const [timeHistory, setTimeHistory] = useState<any[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [currentComment, setCurrentComment] = useState('');

  useEffect(() => {
    const initializeTask = async () => {
      const { id } = await params;
      setTaskId(id);
      fetchTask(id);
    };
    initializeTask();
  }, [params]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timeTracking.isTracking) {
      interval = setInterval(() => {
        setTimeTracking(prev => ({ ...prev, elapsedTime: prev.elapsedTime + 1 }));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timeTracking.isTracking]);

  const fetchTask = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        
        // Load time sessions
        fetchTimeHistory(id);
      } else if (response.status === 404) {
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTimeHistory = async (id: string) => {
    try {
      const response = await fetch(`/api/tasks/${id}/time-sessions`);
      if (response.ok) {
        const data = await response.json();
        setTimeHistory(data.timeSessions || []);
      }
    } catch (error) {
      console.error('Error fetching time history:', error);
    }
  };

  const handleDeleteTask = async () => {
    if (!confirm('Вы уверены, что хотите удалить эту задачу? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
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
      const response = await fetch(`/api/tasks/${taskId}`, {
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
    if (timeTracking.isTracking) {
      // Stop tracking and show comment modal
      if (timeTracking.elapsedTime > 0) {
        setShowCommentModal(true);
      }
      setTimeTracking(prev => ({ ...prev, isTracking: false }));
    } else {
      // Start tracking
      setTimeTracking(prev => ({ ...prev, isTracking: true, startTime: new Date(), elapsedTime: 0 }));
      if (task?.status === 'TODO') {
        handleStatusChange('IN_PROGRESS');
      }
    }
  };

  const saveTimeSession = async (comment: string = '') => {
    if (!task || timeTracking.elapsedTime === 0) return;

    const sessionData = {
      startTime: timeTracking.startTime,
      endTime: new Date(),
      duration: timeTracking.elapsedTime,
      comment: comment.trim(),
    };

    try {
      // Save to backend
      const response = await fetch(`/api/tasks/${taskId}/time-sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        setTimeHistory(prev => [...prev, sessionData]);
        setTimeTracking(prev => ({ ...prev, elapsedTime: 0 }));
      } else {
        console.error('Failed to save time session');
        // Fallback to local storage
        setTimeHistory(prev => [...prev, sessionData]);
        setTimeTracking(prev => ({ ...prev, elapsedTime: 0 }));
      }
    } catch (error) {
      console.error('Error saving time:', error);
      // Fallback to local storage
      setTimeHistory(prev => [...prev, sessionData]);
      setTimeTracking(prev => ({ ...prev, elapsedTime: 0 }));
    }
  };

  const handleCommentSubmit = () => {
    saveTimeSession(currentComment);
    setShowCommentModal(false);
    setCurrentComment('');
  };

  const getTimeHistoryByPeriod = (period: '24h' | '7d' | 'all') => {
    const now = new Date();
    const cutoff = new Date();
    
    switch (period) {
      case '24h':
        cutoff.setHours(cutoff.getHours() - 24);
        break;
      case '7d':
        cutoff.setDate(cutoff.getDate() - 7);
        break;
      case 'all':
      default:
        return timeHistory;
    }
    
    return timeHistory.filter(session => new Date(session.startTime) >= cutoff);
  };

  const getTotalTimeForPeriod = (period: '24h' | '7d' | 'all') => {
    return getTimeHistoryByPeriod(period).reduce((total, session) => total + session.duration, 0);
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

  const formatDuration = (hours: number) => {
    if (!hours || hours === 0) return '0 мин';
    
    const totalSeconds = Math.round(hours * 3600);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(`${h}ч`);
    if (m > 0) parts.push(`${m}мин`);
    if (s > 0 && h === 0) parts.push(`${s}с`); // Показываем секунды только если нет часов
    
    return parts.length > 0 ? parts.join(' ') : '0 мин';
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
              <p className="text-2xl font-mono font-bold">{formatTime(timeTracking.elapsedTime)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Всего потрачено</p>
              <p className="text-2xl font-bold">{formatDuration(task.actualHours || 0)}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Оценка</p>
              <p className="text-2xl font-bold">{formatDuration(task.estimatedHours || 0)}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={handleTimeTracking}
              variant={timeTracking.isTracking ? "destructive" : "default"}
            >
              {timeTracking.isTracking ? (
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
            {timeTracking.elapsedTime > 0 && !timeTracking.isTracking && (
              <Button onClick={() => saveTimeSession()} variant="outline">
                Сохранить время
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Time History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">История трекинга времени</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="24h" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="24h">За 24 часа</TabsTrigger>
              <TabsTrigger value="7d">За 7 дней</TabsTrigger>
              <TabsTrigger value="all">За все время</TabsTrigger>
            </TabsList>
            
            {['24h', '7d', 'all'].map((period) => (
              <TabsContent key={period} value={period} className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Итоговое время: {formatDuration(getTotalTimeForPeriod(period as '24h' | '7d' | 'all') / 3600)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Сессий: {getTimeHistoryByPeriod(period as '24h' | '7d' | 'all').length}
                  </span>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {getTimeHistoryByPeriod(period as '24h' | '7d' | 'all').length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      Нет записей за этот период
                    </p>
                  ) : (
                    getTimeHistoryByPeriod(period as '24h' | '7d' | 'all')
                      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
                      .map((session, index) => (
                        <div key={index} className="border rounded-lg p-3 space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Старт:</span>
                                <span>{new Date(session.startTime).toLocaleString('ru-RU')}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <span className="font-medium">Стоп:</span>
                                <span>{new Date(session.endTime).toLocaleString('ru-RU')}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                Время: {formatDuration(session.duration / 3600)}
                              </div>
                            </div>
                          </div>
                          {session.comment && (
                            <div className="text-sm text-muted-foreground">
                              <span className="font-medium">Комментарий:</span> {session.comment}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
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

      {/* Comment Modal */}
      {showCommentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Добавить комментарий</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowCommentModal(false);
                  setCurrentComment('');
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-2">
                  Время сессии: {formatTime(timeTracking.elapsedTime)}
                </p>
                <Textarea
                  placeholder="Опишите, что было сделано (необязательно)..."
                  value={currentComment}
                  onChange={(e) => setCurrentComment(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentModal(false);
                    setCurrentComment('');
                  }}
                >
                  Отмена
                </Button>
                <Button onClick={handleCommentSubmit}>
                  Сохранить
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
