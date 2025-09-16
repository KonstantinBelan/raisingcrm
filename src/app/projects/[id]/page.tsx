'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Edit, Trash2, Plus, Calendar, DollarSign, User, CheckSquare } from 'lucide-react';
import Link from 'next/link';
import { Project, Task, Payment } from '@/types';

const statusColors = {
  PLANNING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels = {
  PLANNING: 'Планирование',
  ACTIVE: 'Активный',
  ON_HOLD: 'Приостановлен',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

const taskStatusColors = {
  TODO: 'bg-gray-100 text-gray-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  REVIEW: 'bg-orange-100 text-orange-800',
  DONE: 'bg-green-100 text-green-800',
};

const taskStatusLabels = {
  TODO: 'К выполнению',
  IN_PROGRESS: 'В работе',
  REVIEW: 'На проверке',
  DONE: 'Выполнено',
};

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProject();
  }, [params.id]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/projects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProject(data.project);
      } else if (response.status === 404) {
        router.push('/projects');
      }
    } catch (error) {
      console.error('Error fetching project:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот проект? Это действие нельзя отменить.')) {
      return;
    }

    try {
      const response = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/projects');
      } else {
        alert('Ошибка при удалении проекта');
      }
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Ошибка при удалении проекта');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getTaskStats = (tasks: Task[]) => {
    const stats = {
      total: tasks.length,
      todo: 0,
      inProgress: 0,
      review: 0,
      done: 0,
    };

    tasks.forEach(task => {
      switch (task.status) {
        case 'TODO':
          stats.todo++;
          break;
        case 'IN_PROGRESS':
          stats.inProgress++;
          break;
        case 'REVIEW':
          stats.review++;
          break;
        case 'DONE':
          stats.done++;
          break;
      }
    });

    return stats;
  };

  const getPaymentStats = (payments: Payment[]) => {
    const stats = {
      total: payments.reduce((sum, p) => sum + Number(p.amount), 0),
      paid: payments.filter(p => p.status === 'PAID').reduce((sum, p) => sum + Number(p.amount), 0),
      pending: payments.filter(p => p.status === 'PENDING').reduce((sum, p) => sum + Number(p.amount), 0),
    };

    return stats;
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

  if (!project) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <h3 className="text-lg font-semibold mb-2">Проект не найден</h3>
            <p className="text-muted-foreground mb-4">Проект может быть удален или у вас нет доступа к нему</p>
            <Link href="/projects">
              <Button>Вернуться к проектам</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const taskStats = getTaskStats(project.tasks || []);
  const paymentStats = getPaymentStats(project.payments || []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к проектам
          </Button>
        </Link>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <CardTitle className="text-2xl">{project.title}</CardTitle>
                <Badge className={statusColors[project.status]}>
                  {statusLabels[project.status]}
                </Badge>
              </div>
              {project.description && (
                <CardDescription className="text-base">{project.description}</CardDescription>
              )}
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </Link>
              <Button variant="destructive" size="sm" onClick={handleDeleteProject}>
                <Trash2 className="w-4 h-4 mr-2" />
                Удалить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {project.budget && (
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Бюджет:</span>
                <span className="font-medium">{formatCurrency(Number(project.budget))}</span>
              </div>
            )}
            {project.client && (
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Клиент:</span>
                <span className="font-medium">{project.client.name}</span>
              </div>
            )}
            {project.startDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Начало:</span>
                <span className="font-medium">{formatDate(project.startDate)}</span>
              </div>
            )}
            {project.endDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Окончание:</span>
                <span className="font-medium">{formatDate(project.endDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <CheckSquare className="w-5 h-5 mr-2" />
              Задачи
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Всего:</span>
                <span className="font-medium">{taskStats.total}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Выполнено:</span>
                <span className="font-medium text-green-600">{taskStats.done}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">В работе:</span>
                <span className="font-medium text-blue-600">{taskStats.inProgress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">К выполнению:</span>
                <span className="font-medium text-gray-600">{taskStats.todo}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Финансы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Общая сумма:</span>
                <span className="font-medium">{formatCurrency(paymentStats.total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Получено:</span>
                <span className="font-medium text-green-600">{formatCurrency(paymentStats.paid)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Ожидается:</span>
                <span className="font-medium text-orange-600">{formatCurrency(paymentStats.pending)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Прогресс</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Выполнено задач</span>
                <span>{taskStats.total > 0 ? Math.round((taskStats.done / taskStats.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${taskStats.total > 0 ? (taskStats.done / taskStats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>Получено оплат</span>
                <span>{paymentStats.total > 0 ? Math.round((paymentStats.paid / paymentStats.total) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${paymentStats.total > 0 ? (paymentStats.paid / paymentStats.total) * 100 : 0}%` 
                  }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="tasks">Задачи ({taskStats.total})</TabsTrigger>
          <TabsTrigger value="payments">Платежи ({project.payments?.length || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Задачи проекта</h3>
            <Link href={`/tasks/new?projectId=${project.id}`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Новая задача
              </Button>
            </Link>
          </div>

          {project.tasks && project.tasks.length > 0 ? (
            <div className="space-y-3">
              {project.tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium">{task.title}</h4>
                          <Badge className={taskStatusColors[task.status]}>
                            {taskStatusLabels[task.status]}
                          </Badge>
                        </div>
                        {task.description && (
                          <p className="text-sm text-muted-foreground">{task.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {task.dueDate && (
                            <span>Дедлайн: {formatDate(task.dueDate)}</span>
                          )}
                          {task.estimatedHours && (
                            <span>Оценка: {task.estimatedHours}ч</span>
                          )}
                        </div>
                      </div>
                      <Link href={`/tasks/${task.id}`}>
                        <Button variant="ghost" size="sm">
                          Открыть
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h4 className="text-lg font-semibold mb-2">Задач пока нет</h4>
                <p className="text-muted-foreground mb-4">Создайте первую задачу для этого проекта</p>
                <Link href={`/tasks/new?projectId=${project.id}`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Создать задачу
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Платежи по проекту</h3>
            <Link href={`/payments/new?projectId=${project.id}`}>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Новый платеж
              </Button>
            </Link>
          </div>

          {project.payments && project.payments.length > 0 ? (
            <div className="space-y-3">
              {project.payments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
                          <Badge className={payment.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}>
                            {payment.status === 'PAID' ? 'Оплачено' : 'Ожидается'}
                          </Badge>
                        </div>
                        {payment.description && (
                          <p className="text-sm text-muted-foreground">{payment.description}</p>
                        )}
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          {payment.dueDate && (
                            <span>Срок: {formatDate(payment.dueDate)}</span>
                          )}
                          {payment.paidDate && (
                            <span>Оплачено: {formatDate(payment.paidDate)}</span>
                          )}
                        </div>
                      </div>
                      <Link href={`/payments/${payment.id}`}>
                        <Button variant="ghost" size="sm">
                          Открыть
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <h4 className="text-lg font-semibold mb-2">Платежей пока нет</h4>
                <p className="text-muted-foreground mb-4">Добавьте информацию о платежах по проекту</p>
                <Link href={`/payments/new?projectId=${project.id}`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Добавить платеж
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
