'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Calendar, Clock, User, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Task, TaskStatus, TaskPriority } from '@/types';

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

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'ALL'>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'ALL'>('ALL');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || task.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
  };

  const getTasksByStatus = () => {
    const grouped = {
      TODO: filteredTasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: filteredTasks.filter(t => t.status === 'IN_PROGRESS'),
      REVIEW: filteredTasks.filter(t => t.status === 'REVIEW'),
      DONE: filteredTasks.filter(t => t.status === 'DONE'),
    };
    return grouped;
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

  const tasksByStatus = getTasksByStatus();

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Задачи</h1>
          <p className="text-muted-foreground">Управление задачами и отслеживание прогресса</p>
        </div>
        <Link href="/tasks/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Новая задача
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">К выполнению</p>
                <p className="text-2xl font-bold">{tasksByStatus.TODO.length}</p>
              </div>
              <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">В работе</p>
                <p className="text-2xl font-bold">{tasksByStatus.IN_PROGRESS.length}</p>
              </div>
              <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">На проверке</p>
                <p className="text-2xl font-bold">{tasksByStatus.REVIEW.length}</p>
              </div>
              <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Выполнено</p>
                <p className="text-2xl font-bold">{tasksByStatus.DONE.length}</p>
              </div>
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Поиск задач..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as TaskStatus | 'ALL')}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="ALL">Все статусы</option>
          <option value="TODO">К выполнению</option>
          <option value="IN_PROGRESS">В работе</option>
          <option value="REVIEW">На проверке</option>
          <option value="DONE">Выполнено</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value as TaskPriority | 'ALL')}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="ALL">Все приоритеты</option>
          <option value="LOW">Низкий</option>
          <option value="MEDIUM">Средний</option>
          <option value="HIGH">Высокий</option>
          <option value="URGENT">Срочный</option>
        </select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <h3 className="text-lg font-semibold mb-2">Задачи не найдены</h3>
              <p className="mb-4">
                {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                  ? 'Попробуйте изменить фильтры поиска'
                  : 'Создайте свою первую задачу'}
              </p>
              <Link href="/tasks/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать задачу
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <Badge className={statusColors[task.status]}>
                          {statusLabels[task.status]}
                        </Badge>
                        <Badge className={priorityColors[task.priority]}>
                          {priorityLabels[task.priority]}
                        </Badge>
                      </div>
                      {task.description && (
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                    {task.project && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="w-4 h-4" />
                        <span>{task.project.title}</span>
                      </div>
                    )}
                    {task.dueDate && (
                      <div className={`flex items-center gap-1 ${isOverdue(task.dueDate) ? 'text-red-600' : ''}`}>
                        <Calendar className="w-4 h-4" />
                        <span>
                          {isOverdue(task.dueDate) ? 'Просрочено: ' : 'Дедлайн: '}
                          {formatDate(task.dueDate)}
                        </span>
                      </div>
                    )}
                    {task.estimatedHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Оценка: {task.estimatedHours}ч</span>
                      </div>
                    )}
                    {task.actualHours && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>Потрачено: {task.actualHours}ч</span>
                      </div>
                    )}
                  </div>

                  {task.tasks && task.tasks.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        Подзадач: {task.tasks.length}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
