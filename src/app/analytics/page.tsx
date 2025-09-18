'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  AlertTriangle,
  Calendar,
  FileText,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Project, Payment } from '@/types';
import { ExportManager } from '@/components/export';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';

interface AnalyticsData {
  summary: {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    count: number;
    paidCount: number;
    pendingCount: number;
    overdueCount: number;
  };
  byCurrency: Record<string, {
    total: number;
    paid: number;
    pending: number;
    overdue: number;
  }>;
  byProject: Array<{
    id: string | null;
    title: string;
    client: string | null;
    total: number;
    paid: number;
    pending: number;
    overdue: number;
    count: number;
  }>;
  monthlyData: Array<{
    month: string;
    total: number;
    paid: number;
    pending: number;
  }>;
  recentPayments: Payment[];
  upcomingPayments: Payment[];
  period: number;
}

const periods = [
  { value: '7', label: '7 дней' },
  { value: '30', label: '30 дней' },
  { value: '90', label: '90 дней' },
  { value: '365', label: '1 год' },
];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('30');
  const [selectedProject, setSelectedProject] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod, selectedProject]);

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

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        period: selectedPeriod,
        ...(selectedProject && { projectId: selectedProject }),
      });
      
      const response = await fetch(`/api/analytics/payments?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency = 'RUB') => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getPaymentRate = () => {
    if (!analytics || analytics.summary.count === 0) return 0;
    return Math.round((analytics.summary.paidCount / analytics.summary.count) * 100);
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
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              На главную
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Финансовая аналитика</h1>
            <p className="text-muted-foreground">
              Обзор доходов и платежей за выбранный период
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <ExportManager />
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            <option value="">Все проекты</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.title}
              </option>
            ))}
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-input bg-background rounded-md text-sm"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {analytics && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Общая сумма</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(analytics.summary.total)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.summary.count} платежей
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Получено</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(analytics.summary.paid)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.summary.paidCount} оплачено ({getPaymentRate()}%)
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ожидается</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(analytics.summary.pending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.summary.pendingCount} в ожидании
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
                  {formatCurrency(analytics.summary.overdue)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {analytics.summary.overdueCount} просрочено
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Payment Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="w-5 h-5" />
                  Распределение платежей
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Получено', value: analytics.summary.paid, color: '#22c55e' },
                        { name: 'Ожидается', value: analytics.summary.pending, color: '#eab308' },
                        { name: 'Просрочено', value: analytics.summary.overdue, color: '#ef4444' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value, payload }: any) => {
                        const total = analytics.summary.paid + analytics.summary.pending + analytics.summary.overdue;
                        const percent = total > 0 ? (value / total) * 100 : 0;
                        return `${name} ${percent.toFixed(0)}%`;
                      }}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {[
                        { name: 'Получено', value: analytics.summary.paid, color: '#22c55e' },
                        { name: 'Ожидается', value: analytics.summary.pending, color: '#eab308' },
                        { name: 'Просрочено', value: analytics.summary.overdue, color: '#ef4444' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                  <div className="text-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-1"></div>
                    <div className="font-medium">Получено</div>
                    <div className="text-muted-foreground">{formatCurrency(analytics.summary.paid)}</div>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mx-auto mb-1"></div>
                    <div className="font-medium">Ожидается</div>
                    <div className="text-muted-foreground">{formatCurrency(analytics.summary.pending)}</div>
                  </div>
                  <div className="text-center">
                    <div className="w-3 h-3 bg-red-500 rounded-full mx-auto mb-1"></div>
                    <div className="font-medium">Просрочено</div>
                    <div className="text-muted-foreground">{formatCurrency(analytics.summary.overdue)}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Динамика по месяцам
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlyData.slice(-6)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value: number) => formatCurrency(value).replace('₽', '₽')} />
                    <Tooltip 
                      formatter={(value: number, name: string) => [
                        formatCurrency(Number(value)), 
                        name === 'paid' ? 'Получено' : name === 'pending' ? 'Ожидается' : name === 'overdue' ? 'Просрочено' : 'Общая сумма'
                      ]}
                    />
                    <Area type="monotone" dataKey="total" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="paid" stackId="2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="pending" stackId="3" stroke="#eab308" fill="#eab308" fillOpacity={0.6} />
                    <Area type="monotone" dataKey="overdue" stackId="4" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* By Project */}
          {analytics.byProject.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  По проектам
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.byProject
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10)
                    .map((project) => (
                    <Link 
                      key={project.id || 'no-project'} 
                      href={project.id ? `/projects/${project.id}` : '#'}
                      className={project.id ? 'cursor-pointer' : 'cursor-default'}
                    >
                      <div className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium">{project.title}</h4>
                            {project.client && (
                              <p className="text-sm text-muted-foreground">{project.client}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-semibold">{formatCurrency(project.total)}</div>
                            <div className="text-sm text-muted-foreground">{project.count} платежей</div>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-green-600">
                            Получено: {formatCurrency(project.paid)}
                          </div>
                          <div className="text-yellow-600">
                            Ожидается: {formatCurrency(project.pending)}
                          </div>
                          <div className="text-red-600">
                            Просрочено: {formatCurrency(project.overdue)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Payments */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Последние платежи
                  </CardTitle>
                  <Link href="/payments">
                    <Button variant="outline" size="sm">
                      Все платежи
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.recentPayments.slice(0, 5).map((payment) => (
                    <Link key={payment.id} href={`/payments/${payment.id}`}>
                      <div className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                        <div>
                          <div className="font-medium">{formatCurrency(payment.amount, payment.currency)}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.project?.title || 'Без проекта'}
                          </div>
                        </div>
                      <div className="text-right">
                        <Badge 
                          className={
                            payment.status === 'PAID' ? 'bg-green-100 text-green-800' :
                            payment.status === 'OVERDUE' ? 'bg-red-100 text-red-800' :
                            'bg-yellow-100 text-yellow-800'
                          }
                        >
                          {payment.status === 'PAID' ? 'Оплачено' :
                           payment.status === 'OVERDUE' ? 'Просрочено' : 'Ожидается'}
                        </Badge>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(payment.createdAt)}
                        </div>
                      </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Payments */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Предстоящие платежи
                </CardTitle>
                <CardDescription>
                  Платежи со сроком в ближайшие 30 дней
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.upcomingPayments.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">
                      Нет предстоящих платежей
                    </p>
                  ) : (
                    analytics.upcomingPayments.slice(0, 5).map((payment) => (
                      <div key={payment.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <div className="font-medium">{formatCurrency(payment.amount, payment.currency)}</div>
                          <div className="text-sm text-muted-foreground">
                            {payment.project?.title || 'Без проекта'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            {payment.dueDate && formatDate(payment.dueDate)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Срок оплаты
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
