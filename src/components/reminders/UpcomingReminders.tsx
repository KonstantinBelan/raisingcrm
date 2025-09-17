'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  ExternalLink,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { format, isAfter, isBefore, addMinutes } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Reminder {
  id: string;
  title: string;
  message: string;
  scheduledAt: string;
  sent: boolean;
  project?: {
    id: string;
    title: string;
  };
  task?: {
    id: string;
    title: string;
  };
}

export function UpcomingReminders() {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUpcomingReminders();
  }, []);

  const fetchUpcomingReminders = async () => {
    try {
      const response = await fetch('/api/reminders?upcoming=true&limit=5');
      if (response.ok) {
        const data = await response.json();
        setReminders(data.reminders || []);
      }
    } catch (error) {
      console.error('Error fetching upcoming reminders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getReminderStatus = (reminder: Reminder) => {
    const now = new Date();
    const scheduledTime = new Date(reminder.scheduledAt);
    
    if (isBefore(scheduledTime, now)) {
      return { type: 'overdue', label: 'Просрочено', color: 'bg-red-100 text-red-800', icon: AlertTriangle };
    }
    
    if (isBefore(scheduledTime, addMinutes(now, 60))) {
      return { type: 'soon', label: 'Скоро', color: 'bg-yellow-100 text-yellow-800', icon: Clock };
    }
    
    return { type: 'scheduled', label: 'Запланировано', color: 'bg-blue-100 text-blue-800', icon: Bell };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Предстоящие напоминания
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-20">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Предстоящие напоминания
          </CardTitle>
          <div className="flex items-center gap-2">
            <Link href="/reminders">
              <Button variant="ghost" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Все
              </Button>
            </Link>
            <Link href="/reminders">
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Создать
              </Button>
            </Link>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {reminders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Нет предстоящих напоминаний</p>
            <Link href="/reminders">
              <Button variant="outline" size="sm" className="mt-2">
                Создать напоминание
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((reminder) => {
              const status = getReminderStatus(reminder);
              const StatusIcon = status.icon;
              
              return (
                <div
                  key={reminder.id}
                  className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${status.color}`}>
                    <StatusIcon className="w-4 h-4" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{reminder.title}</h4>
                      <Badge className={`text-xs ${status.color}`}>
                        {status.label}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {reminder.message}
                    </p>
                    
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {format(new Date(reminder.scheduledAt), 'dd MMM, HH:mm', { locale: ru })}
                        </span>
                      </div>
                      
                      {reminder.project && (
                        <div className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-primary rounded-full"></div>
                          <span className="truncate">{reminder.project.title}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {reminders.length >= 5 && (
              <div className="text-center pt-2">
                <Link href="/reminders">
                  <Button variant="outline" size="sm">
                    Показать все напоминания
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
