'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Bell,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Trash2,
  Edit,
  RefreshCw
} from 'lucide-react';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  sent: boolean;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

interface Project {
  id: string;
  title: string;
}

interface Task {
  id: string;
  title: string;
}

interface ReminderManagerProps {
  showUpcomingOnly?: boolean;
}

export function ReminderManager({ showUpcomingOnly = false }: ReminderManagerProps) {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    scheduledAt: '',
    projectId: '',
    taskId: '',
  });

  useEffect(() => {
    fetchReminders();
    fetchProjects();
    fetchTasks();
  }, [showUpcomingOnly]);

  const fetchReminders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (showUpcomingOnly) {
        params.append('upcoming', 'true');
      }
      
      const response = await fetch(`/api/reminders?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    } finally {
      setLoading(false);
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
    
    if (!formData.title || !formData.message || !formData.scheduledAt) {
      return;
    }

    try {
      const url = editingReminder ? `/api/reminders/${editingReminder.id}` : '/api/reminders';
      const method = editingReminder ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          projectId: formData.projectId || null,
          taskId: formData.taskId || null,
        }),
      });

      if (response.ok) {
        await fetchReminders();
        resetForm();
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error('Error saving reminder:', error);
    }
  };

  const handleEdit = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      message: reminder.message,
      scheduledAt: format(new Date(reminder.scheduledAt), "yyyy-MM-dd'T'HH:mm"),
      projectId: reminder.project?.id || '',
      taskId: reminder.task?.id || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Вы уверены, что хотите удалить это напоминание?')) {
      return;
    }

    try {
      const response = await fetch(`/api/reminders/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchReminders();
      }
    } catch (error) {
      console.error('Error deleting reminder:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      scheduledAt: '',
      projectId: '',
      taskId: '',
    });
    setEditingReminder(null);
  };

  const getDefaultDateTime = () => {
    const now = addMinutes(new Date(), 30);
    return format(now, "yyyy-MM-dd'T'HH:mm");
  };

  const getReminderStatus = (reminder: Reminder) => {
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledAt);
    
    if (reminder.sent) {
      return { type: 'sent', label: 'Отправлено', color: 'bg-green-100 text-green-800' };
    }
    
    if (isBefore(scheduledTime, now)) {
      return { type: 'overdue', label: 'Просрочено', color: 'bg-red-100 text-red-800' };
    }
    
    if (isBefore(scheduledTime, addMinutes(now, 60))) {
      return { type: 'soon', label: 'Скоро', color: 'bg-yellow-100 text-yellow-800' };
    }
    
    return { type: 'scheduled', label: 'Запланировано', color: 'bg-blue-100 text-blue-800' };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-xl font-semibold">
            {showUpcomingOnly ? 'Предстоящие напоминания' : 'Все напоминания'}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchReminders}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Новое напоминание
              </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>
                  {editingReminder ? 'Редактировать напоминание' : 'Создать напоминание'}
                </DialogTitle>
                <DialogDescription>
                  Настройте напоминание для важных событий и дедлайнов
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Заголовок</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Название напоминания"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="message">Сообщение</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Текст напоминания"
                    rows={3}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="scheduledAt">Дата и время</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt || getDefaultDateTime()}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="project">Проект (опционально)</Label>
                    <Select
                      value={formData.projectId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, projectId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите проект" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без проекта</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>
                            {project.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="task">Задача (опционально)</Label>
                    <Select
                      value={formData.taskId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, taskId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите задачу" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Без задачи</SelectItem>
                        {tasks.map((task) => (
                          <SelectItem key={task.id} value={task.id}>
                            {task.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Отмена
                  </Button>
                  <Button type="submit">
                    {editingReminder ? 'Сохранить' : 'Создать'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Reminders List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : reminders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <Bell className="w-8 h-8 mb-2 opacity-50" />
            <p>Напоминания не найдены</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => {
            const status = getReminderStatus(reminder);
            
            return (
              <Card key={reminder.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium truncate">{reminder.title}</h3>
                        <Badge className={`text-xs ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {reminder.message}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {format(new Date(reminder.scheduledAt), 'dd MMM yyyy, HH:mm', { locale: ru })}
                          </span>
                        </div>
                        
                        {reminder.project && (
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-primary rounded-full"></div>
                            <span>{reminder.project.title}</span>
                          </div>
                        )}
                        
                        {reminder.task && (
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            <span>{reminder.task.title}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(reminder)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(reminder.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
