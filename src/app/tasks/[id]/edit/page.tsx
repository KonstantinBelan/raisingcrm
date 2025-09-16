'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { Task, Project, TaskStatus, Priority } from '@/types';

const statusOptions = [
  { value: 'TODO', label: 'К выполнению' },
  { value: 'IN_PROGRESS', label: 'В работе' },
  { value: 'REVIEW', label: 'На проверке' },
  { value: 'DONE', label: 'Выполнено' },
];

const priorityOptions = [
  { value: 'LOW', label: 'Низкий' },
  { value: 'MEDIUM', label: 'Средний' },
  { value: 'HIGH', label: 'Высокий' },
  { value: 'URGENT', label: 'Срочный' },
];

export default function EditTaskPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'TODO' as TaskStatus,
    priority: 'MEDIUM' as Priority,
    dueDate: '',
    estimatedHours: '',
    actualHours: '',
    projectId: '',
    parentTaskId: '',
  });

  useEffect(() => {
    Promise.all([fetchTask(), fetchProjects(), fetchTasks()]);
  }, [params.id]);

  const fetchTask = async () => {
    try {
      const response = await fetch(`/api/tasks/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const task: Task = data.task;
        
        setFormData({
          title: task.title,
          description: task.description || '',
          status: task.status,
          priority: task.priority,
          dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
          estimatedHours: task.estimatedHours ? task.estimatedHours.toString() : '',
          actualHours: task.actualHours ? task.actualHours.toString() : '',
          projectId: task.projectId || '',
          parentTaskId: task.parentTaskId || '',
        });
      } else if (response.status === 404) {
        router.push('/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects || []);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/tasks/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/tasks/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при обновлении задачи');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      alert('Ошибка при обновлении задачи');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const availableTasks = tasks.filter(task => 
    task.id !== params.id && 
    task.id !== formData.parentTaskId && 
    (!formData.projectId || task.projectId === formData.projectId)
  );

  if (initialLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tasks/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к задаче
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Редактировать задачу</CardTitle>
          <CardDescription>
            Измените информацию о задаче
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="title">Название задачи *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Введите название задачи"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Опишите детали задачи"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Статус</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Приоритет</Label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                >
                  {priorityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedHours">Оценка времени (часы)</Label>
                <Input
                  id="estimatedHours"
                  name="estimatedHours"
                  type="number"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="actualHours">Потрачено времени (часы)</Label>
                <Input
                  id="actualHours"
                  name="actualHours"
                  type="number"
                  value={formData.actualHours}
                  onChange={handleChange}
                  placeholder="0"
                  min="0"
                  step="0.1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDate">Дедлайн</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                value={formData.dueDate}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Проект</Label>
              <select
                id="projectId"
                name="projectId"
                value={formData.projectId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Выберите проект</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="parentTaskId">Родительская задача</Label>
              <select
                id="parentTaskId"
                name="parentTaskId"
                value={formData.parentTaskId}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                <option value="">Нет (основная задача)</option>
                {availableTasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить изменения
              </Button>
              <Link href={`/tasks/${params.id}`}>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
