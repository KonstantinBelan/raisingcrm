'use client';

import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import '@/styles/calendar.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { 
  Calendar as CalendarIcon,
  Clock,
  AlertTriangle,
  CheckCircle,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';

// Настройка локализации
moment.locale('ru');
const localizer = momentLocalizer(moment);

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

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Task;
  color: string;
}

const statusColors = {
  TODO: '#6b7280',
  IN_PROGRESS: '#3b82f6',
  REVIEW: '#f59e0b',
  DONE: '#10b981'
};

const priorityColors = {
  LOW: '#10b981',
  MEDIUM: '#f59e0b', 
  HIGH: '#ef4444',
  URGENT: '#dc2626'
};

export default function CalendarPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [isYearView, setIsYearView] = useState(false);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTaskForModal, setSelectedTaskForModal] = useState<Task | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    const filteredTasks = filterStatus === 'all' 
      ? tasks 
      : tasks.filter(task => task.status === filterStatus);
    
    const calendarEvents = filteredTasks
      .filter(task => task.deadline || task.dueDate)
      .map(task => {
        const deadline = task.deadline || task.dueDate;
        const date = new Date(deadline!);
        
        return {
          id: task.id,
          title: `${task.title}${task.project ? ` (${task.project.title})` : ''}`,
          start: date,
          end: new Date(date.getTime() + 60 * 60 * 1000), // 1 час
          resource: task,
          color: priorityColors[task.priority]
        };
      });
    
    setEvents(calendarEvents);
  }, [tasks, filterStatus]);

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

  const getEventStyle = (event: CalendarEvent) => {
    const task = event.resource;
    const now = new Date();
    const eventDate = new Date(event.start);
    const isOverdue = eventDate < now && task.status !== 'DONE';
    
    let backgroundColor = statusColors[task.status];
    if (isOverdue) {
      backgroundColor = '#dc2626'; // красный для просроченных
    }
    
    return {
      style: {
        backgroundColor,
        borderColor: priorityColors[task.priority],
        borderWidth: '2px',
        borderStyle: 'solid',
        color: 'white',
        fontSize: '12px'
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };

  const formatDate = (date: Date | string) => {
    return moment(date).format('DD.MM.YYYY HH:mm');
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      TODO: { label: 'К выполнению', className: 'bg-gray-100 text-gray-800' },
      IN_PROGRESS: { label: 'В работе', className: 'bg-blue-100 text-blue-800' },
      REVIEW: { label: 'На проверке', className: 'bg-yellow-100 text-yellow-800' },
      DONE: { label: 'Выполнено', className: 'bg-green-100 text-green-800' }
    };
    
    const config = statusMap[status as keyof typeof statusMap];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityMap = {
      LOW: { label: 'Низкий', className: 'bg-green-100 text-green-800' },
      MEDIUM: { label: 'Средний', className: 'bg-yellow-100 text-yellow-800' },
      HIGH: { label: 'Высокий', className: 'bg-orange-100 text-orange-800' },
      URGENT: { label: 'Срочный', className: 'bg-red-100 text-red-800' }
    };
    
    const config = priorityMap[priority as keyof typeof priorityMap];
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getUpcomingTasks = () => {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return tasks
      .filter(task => {
        if (!task.deadline && !task.dueDate) return false;
        const deadline = new Date(task.deadline || task.dueDate!);
        return deadline >= now && deadline <= nextWeek && task.status !== 'DONE';
      })
      .sort((a, b) => {
        const dateA = new Date(a.deadline || a.dueDate!);
        const dateB = new Date(b.deadline || b.dueDate!);
        return dateA.getTime() - dateB.getTime();
      });
  };

  const getOverdueTasks = () => {
    const now = new Date();
    
    return tasks.filter(task => {
      if (!task.deadline && !task.dueDate) return false;
      const deadline = new Date(task.deadline || task.dueDate!);
      return deadline < now && task.status !== 'DONE';
    });
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Календарь</h1>
          <p className="text-muted-foreground">
            Планирование задач и дедлайнов
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tasks/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Добавить задачу
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        {/* Summary Cards */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего задач</CardTitle>
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {tasks.filter(t => t.deadline || t.dueDate).length} с дедлайнами
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Предстоящие</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {getUpcomingTasks().length}
            </div>
            <p className="text-xs text-muted-foreground">
              на следующие 7 дней
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просрочено</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {getOverdueTasks().length}
            </div>
            <p className="text-xs text-muted-foreground">
              требуют внимания
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполнено</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {tasks.filter(t => t.status === 'DONE').length}
            </div>
            <p className="text-xs text-muted-foreground">
              завершенных задач
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Календарь</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={view === 'month' && !isYearView ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setView('month');
                      setIsYearView(false);
                    }}
                  >
                    Месяц
                  </Button>
                  <Button
                    variant={view === 'week' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setView('week');
                      setIsYearView(false);
                    }}
                  >
                    Неделя
                  </Button>
                  <Button
                    variant={view === 'day' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setView('day');
                      setIsYearView(false);
                    }}
                  >
                    День
                  </Button>
                  <Button
                    variant={isYearView ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setIsYearView(true)}
                  >
                    Год
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (isYearView) {
                        newDate.setFullYear(newDate.getFullYear() - 1);
                      } else if (view === 'month') {
                        newDate.setMonth(newDate.getMonth() - 1);
                      } else if (view === 'week') {
                        newDate.setDate(newDate.getDate() - 7);
                      } else if (view === 'day') {
                        newDate.setDate(newDate.getDate() - 1);
                      }
                      setCurrentDate(newDate);
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Сегодня
                  </Button>
                  <span className="text-sm font-medium min-w-[120px] text-center">
                    {isYearView 
                      ? moment(currentDate).format('YYYY')
                      : view === 'month' 
                        ? moment(currentDate).format('MMMM YYYY')
                        : view === 'week'
                          ? `${moment(currentDate).startOf('week').format('DD MMM')} - ${moment(currentDate).endOf('week').format('DD MMM YYYY')}`
                          : moment(currentDate).format('DD MMMM YYYY')
                    }
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newDate = new Date(currentDate);
                      if (isYearView) {
                        newDate.setFullYear(newDate.getFullYear() + 1);
                      } else if (view === 'month') {
                        newDate.setMonth(newDate.getMonth() + 1);
                      } else if (view === 'week') {
                        newDate.setDate(newDate.getDate() + 7);
                      } else if (view === 'day') {
                        newDate.setDate(newDate.getDate() + 1);
                      }
                      setCurrentDate(newDate);
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ height: '600px' }}>
                {!isYearView ? (
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: 600 }}
                    view={view}
                    onView={setView}
                    date={currentDate}
                    onNavigate={setCurrentDate}
                    eventPropGetter={(event) => ({
                      style: {
                        backgroundColor: event.color + '20', // 20 = 0.125 opacity in hex
                        borderColor: event.color + '20',
                        color: event.color,
                      },
                    })}
                    onSelectEvent={(event) => {
                      setSelectedTaskForModal(event.resource);
                      setIsTaskModalOpen(true);
                    }}
                    messages={{
                      next: 'Следующий',
                      previous: 'Предыдущий',
                      today: 'Сегодня',
                      month: 'Месяц',
                      week: 'Неделя',
                      day: 'День',
                      agenda: 'Повестка',
                      date: 'Дата',
                      time: 'Время',
                      event: 'Событие',
                      noEventsInRange: 'Нет событий в этом диапазоне',
                    }}
                  />
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {Array.from({ length: 12 }, (_, i) => {
                      const monthDate = new Date(currentDate.getFullYear(), i, 1);
                      const monthEvents = events.filter(event => {
                        const eventDate = new Date(event.start);
                        return eventDate.getFullYear() === currentDate.getFullYear() && 
                               eventDate.getMonth() === i;
                      });
                      
                      return (
                        <div key={i} className="border rounded-lg p-4">
                          <h3 className="font-semibold mb-2">
                            {moment(monthDate).format('MMMM')}
                          </h3>
                          <div className="space-y-1">
                            {monthEvents.slice(0, 3).map((event, idx) => (
                              <div 
                                key={idx}
                                className="text-xs p-1 rounded cursor-pointer hover:bg-opacity-80 transition-colors"
                                style={{ backgroundColor: event.color + '20', color: event.color }}
                                onClick={() => {
                                  setSelectedTaskForModal(event.resource);
                                  setIsTaskModalOpen(true);
                                }}
                              >
                                {event.title}
                              </div>
                            ))}
                            {monthEvents.length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{monthEvents.length - 3} еще
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Предстоящие дедлайны
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {getUpcomingTasks().length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Нет предстоящих дедлайнов
                  </p>
                ) : (
                  getUpcomingTasks().slice(0, 5).map((task) => (
                    <div key={task.id} className="border rounded-lg p-3 cursor-pointer" onClick={() => {
                      setSelectedTaskForModal(task);
                      setIsTaskModalOpen(true);
                    }}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm">{task.title}</h4>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-muted-foreground">
                          {formatDate(task.deadline || task.dueDate!)}
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.project && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.project.title}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Overdue Tasks */}
          {getOverdueTasks().length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-500 dark:text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  Просроченные задачи
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getOverdueTasks().slice(0, 5).map((task) => (
                    <div 
                      key={task.id} 
                      className="border border-red-500/30 rounded-lg p-3 bg-red-500/10 dark:bg-red-500/20 cursor-pointer hover:bg-red-500/20 transition-colors"
                      onClick={() => {
                        setSelectedTaskForModal(task);
                        setIsTaskModalOpen(true);
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-sm text-foreground">{task.title}</h4>
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-xs text-red-500 dark:text-red-400 font-medium">
                          Просрочено: {formatDate(task.deadline || task.dueDate!)}
                        </div>
                        {getStatusBadge(task.status)}
                      </div>
                      {task.project && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {task.project.title}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Selected Event Details */}
          {selectedEvent && (
            <Card>
              <CardHeader>
                <CardTitle>Детали задачи</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium">{selectedEvent.resource.title}</h4>
                    {selectedEvent.resource.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {selectedEvent.resource.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex gap-2">
                    {getStatusBadge(selectedEvent.resource.status)}
                    {getPriorityBadge(selectedEvent.resource.priority)}
                  </div>
                  
                  <div className="text-sm">
                    <div className="text-muted-foreground">Дедлайн:</div>
                    <div>{formatDate(selectedEvent.start)}</div>
                  </div>
                  
                  {selectedEvent.resource.project && (
                    <div className="text-sm">
                      <div className="text-muted-foreground">Проект:</div>
                      <div>{selectedEvent.resource.project.title}</div>
                    </div>
                  )}
                  
                  <div className="pt-3">
                    <Link href={`/tasks/${selectedEvent.resource.id}`}>
                      <Button size="sm" className="w-full">
                        Открыть задачу
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Task Details Modal */}
        <Dialog open={isTaskModalOpen} onOpenChange={setIsTaskModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedTaskForModal?.title}</DialogTitle>
              <DialogDescription>
                {selectedTaskForModal?.project?.title && (
                  <span className="text-sm text-muted-foreground">
                    Проект: {selectedTaskForModal.project.title}
                  </span>
                )}
              </DialogDescription>
            </DialogHeader>
            
            {selectedTaskForModal && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Badge 
                    className={
                      selectedTaskForModal.status === 'DONE' ? 'bg-green-100 text-green-800' :
                      selectedTaskForModal.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                      selectedTaskForModal.status === 'REVIEW' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {selectedTaskForModal.status === 'DONE' ? 'Выполнено' :
                     selectedTaskForModal.status === 'IN_PROGRESS' ? 'В работе' :
                     selectedTaskForModal.status === 'REVIEW' ? 'На проверке' : 'К выполнению'}
                  </Badge>
                  <Badge 
                    className={
                      selectedTaskForModal.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                      selectedTaskForModal.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      selectedTaskForModal.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }
                  >
                    {selectedTaskForModal.priority === 'URGENT' ? 'Срочно' :
                     selectedTaskForModal.priority === 'HIGH' ? 'Высокий' :
                     selectedTaskForModal.priority === 'MEDIUM' ? 'Средний' : 'Низкий'}
                  </Badge>
                </div>

                {selectedTaskForModal.description && (
                  <div>
                    <h4 className="font-medium mb-2">Описание</h4>
                    <p className="text-sm text-muted-foreground">{selectedTaskForModal.description}</p>
                  </div>
                )}

                {(selectedTaskForModal.deadline || selectedTaskForModal.dueDate) && (
                  <div>
                    <h4 className="font-medium mb-2">Дедлайн</h4>
                    <p className="text-sm text-muted-foreground">
                      {moment(selectedTaskForModal.deadline || selectedTaskForModal.dueDate).format('DD.MM.YYYY HH:mm')}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <Link href={`/tasks/${selectedTaskForModal.id}`} className="flex-1">
                    <Button className="w-full">
                      Открыть задачу
                    </Button>
                  </Link>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTaskModalOpen(false)}
                  >
                    Закрыть
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
