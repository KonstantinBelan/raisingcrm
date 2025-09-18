'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { telegramWebApp } from '@/lib/telegram';
import { 
  BarChart3, 
  Users, 
  FolderOpen, 
  CheckSquare, 
  CreditCard,
  Calendar,
  Kanban,
  Briefcase,
  TrendingUp,
  Plus,
  Bell
} from 'lucide-react';
import Link from 'next/link';
import { UpcomingReminders } from '@/components/reminders';
import { ExportManager } from '@/components/export';

export default function Dashboard() {
  const [user, setUser] = useState<{firstName?: string; lastName?: string; username?: string} | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    projects: { count: 0, weeklyChange: 0 },
    tasks: { count: 0, completedToday: 0 },
    clients: { count: 0, newClients: 0 },
    revenue: { amount: 0, monthlyChange: 0 }
  });

  useEffect(() => {
    // Initialize Telegram WebApp
    const userData = telegramWebApp.getUserData();
    setUser(userData);
    
    // Fetch dashboard statistics
    fetchDashboardStats();

    // Setup haptic feedback for interactions
    const handleClick = () => telegramWebApp.hapticFeedback('light');
    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [projectsRes, tasksRes, clientsRes, paymentsRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/clients'),
        fetch('/api/payments')
      ]);

      const [projectsData, tasksData, clientsData, paymentsData] = await Promise.all([
        projectsRes.ok ? projectsRes.json() : { projects: [] },
        tasksRes.ok ? tasksRes.json() : { tasks: [] },
        clientsRes.ok ? clientsRes.json() : { clients: [] },
        paymentsRes.ok ? paymentsRes.json() : { payments: [] }
      ]);

      const projects = projectsData.projects || [];
      const tasks = tasksData.tasks || [];
      const clients = clientsData.clients || [];
      const payments = paymentsData.payments || [];

      // Calculate weekly project change
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const newProjectsThisWeek = projects.filter((p: any) => new Date(p.createdAt) > weekAgo).length;

      // Calculate tasks completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const completedToday = tasks.filter((t: any) => 
        t.status === 'DONE' && 
        t.updatedAt && 
        new Date(t.updatedAt) >= today
      ).length;

      // Calculate new clients this month
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const newClientsThisMonth = clients.filter((c: any) => new Date(c.createdAt) > monthAgo).length;

      // Calculate revenue
      const paidPayments = payments.filter((p: any) => p.status === 'PAID');
      const totalRevenue = paidPayments.reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      
      // Calculate monthly revenue change
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const lastMonth = new Date(thisMonth);
      lastMonth.setMonth(lastMonth.getMonth() - 1);
      
      const thisMonthRevenue = paidPayments
        .filter((p: any) => new Date(p.paidAt || p.createdAt) >= thisMonth)
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);
      
      const lastMonthRevenue = paidPayments
        .filter((p: any) => {
          const date = new Date(p.paidAt || p.createdAt);
          return date >= lastMonth && date < thisMonth;
        })
        .reduce((sum: number, p: any) => sum + Number(p.amount || 0), 0);

      const monthlyChange = lastMonthRevenue > 0 
        ? Math.round(((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

      setStats({
        projects: { count: projects.length, weeklyChange: newProjectsThisWeek },
        tasks: { count: tasks.length, completedToday },
        clients: { count: clients.length, newClients: newClientsThisMonth },
        revenue: { amount: totalRevenue, monthlyChange }
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

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
      <div className="flex justify-between items-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-primary">Raising CRM</h1>
          <p className="text-muted-foreground">
            Добро пожаловать, {user?.firstName || 'Фрилансер'}! 👋
          </p>
        </div>
        <ExportManager />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Проекты</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projects.count}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.projects.weeklyChange} за эту неделю
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Задачи</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.tasks.count}</div>
            <p className="text-xs text-muted-foreground">
              {stats.tasks.completedToday} выполнено сегодня
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Клиенты</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clients.count}</div>
            <p className="text-xs text-muted-foreground">
              {stats.clients.newClients} новых клиентов
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Доход</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.revenue.amount)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.revenue.monthlyChange > 0 ? '+' : ''}{stats.revenue.monthlyChange}% к прошлому месяцу
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
          <Link href="/projects/new">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Создать новый проект
            </Button>
          </Link>
          <Link href="/tasks/new">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Добавить задачу
            </Button>
          </Link>
          <Link href="/clients/new">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Новый клиент
            </Button>
          </Link>
          <Link href="/payments/new">
            <Button className="w-full justify-start" variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Добавить платеж
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Модули</CardTitle>
          <CardDescription>
            Переходите к основным разделам системы
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Link href="/projects">
            <Button className="w-full justify-start" variant="outline">
              <Briefcase className="w-4 h-4 mr-2" />
              Проекты
            </Button>
          </Link>
          <Link href="/tasks">
            <Button className="w-full justify-start" variant="outline">
              <CheckSquare className="w-4 h-4 mr-2" />
              Задачи
            </Button>
          </Link>
          <Link href="/tasks/board">
            <Button className="w-full justify-start" variant="outline">
              <Kanban className="w-4 h-4 mr-2" />
              Kanban доска
            </Button>
          </Link>
          <Link href="/clients">
            <Button className="w-full justify-start" variant="outline">
              <Users className="w-4 h-4 mr-2" />
              Клиенты
            </Button>
          </Link>
          <Link href="/payments">
            <Button className="w-full justify-start" variant="outline">
              <CreditCard className="w-4 h-4 mr-2" />
              Платежи
            </Button>
          </Link>
          <Link href="/calendar">
            <Button className="w-full justify-start" variant="outline">
              <Calendar className="w-4 h-4 mr-2" />
              Календарь
            </Button>
          </Link>
          <Link href="/analytics">
            <Button className="w-full justify-start" variant="outline">
              <BarChart3 className="w-4 h-4 mr-2" />
              Аналитика
            </Button>
          </Link>
          <Link href="/reminders">
            <Button className="w-full justify-start" variant="outline">
              <Bell className="w-4 h-4 mr-2" />
              Напоминания
            </Button>
          </Link>
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

      {/* Upcoming Reminders */}
      <UpcomingReminders />

      {/* Bottom Navigation Placeholder */}
      <div className="h-16"></div>
    </div>
  );
}
