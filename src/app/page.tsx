'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { telegramWebApp } from '@/lib/telegram';
import { Briefcase, CheckSquare, Users, CreditCard, Bell, TrendingUp } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState<{firstName?: string; lastName?: string; username?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize Telegram WebApp
    const userData = telegramWebApp.getUserData();
    setUser(userData);
    setIsLoading(false);

    // Setup haptic feedback for interactions
    const handleClick = () => telegramWebApp.hapticFeedback('light');
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-primary">Raising CRM</h1>
        <p className="text-muted-foreground">
          Добро пожаловать, {user?.firstName || 'Фрилансер'}! 👋
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Проекты</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">
              +1 за эту неделю
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Задачи</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              5 выполнено сегодня
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Клиенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              2 новых клиента
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доход</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₽45,000</div>
            <p className="text-xs text-muted-foreground">
              +12% к прошлому месяцу
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Быстрые действия</CardTitle>
          <CardDescription>
            Создайте новый проект или задачу одним нажатием
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full justify-start" variant="outline">
            <Briefcase className="mr-2 h-4 w-4" />
            Создать проект
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <CheckSquare className="mr-2 h-4 w-4" />
            Добавить задачу
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Добавить клиента
          </Button>
          <Button className="w-full justify-start" variant="outline">
            <CreditCard className="mr-2 h-4 w-4" />
            Записать платеж
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Последняя активность</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm">Задача &quot;Дизайн логотипа&quot; выполнена</p>
              <p className="text-xs text-muted-foreground">2 часа назад</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm">Получен платеж от ООО &quot;Технологии&quot;</p>
              <p className="text-xs text-muted-foreground">5 часов назад</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm">Создан новый проект &quot;Мобильное приложение&quot;</p>
              <p className="text-xs text-muted-foreground">1 день назад</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Deadlines */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Bell className="mr-2 h-4 w-4" />
            Ближайшие дедлайны
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div>
              <p className="text-sm font-medium">Сдача макетов</p>
              <p className="text-xs text-muted-foreground">Проект: Интернет-магазин</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-red-600 dark:text-red-400">Завтра</p>
              <p className="text-xs text-muted-foreground">15:00</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg">
            <div>
              <p className="text-sm font-medium">Презентация проекта</p>
              <p className="text-xs text-muted-foreground">Проект: CRM система</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">3 дня</p>
              <p className="text-xs text-muted-foreground">10:00</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Navigation Placeholder */}
      <div className="h-16"></div>
    </div>
  );
}
