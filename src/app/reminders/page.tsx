'use client';

import { ReminderManager } from '@/components/reminders/ReminderManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Bell,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import Link from 'next/link';

export default function RemindersPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              На главную
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Напоминания</h1>
            <p className="text-muted-foreground">
              Управляйте напоминаниями и уведомлениями
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/calendar">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Календарь
            </Button>
          </Link>
          
          <Link href="/tasks">
            <Button variant="outline" size="sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              Задачи
            </Button>
          </Link>
        </div>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                О системе напоминаний
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Создавайте напоминания для важных событий, дедлайнов и встреч. 
                Система автоматически отслеживает статус и показывает актуальные уведомления.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Отправлено
                </Badge>
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
                  <Clock className="w-3 h-3 mr-1" />
                  Скоро
                </Badge>
                <Badge variant="secondary" className="text-xs bg-red-100 text-red-800">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Просрочено
                </Badge>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">
                  <Bell className="w-3 h-3 mr-1" />
                  Запланировано
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reminder Manager */}
      <ReminderManager />
    </div>
  );
}
