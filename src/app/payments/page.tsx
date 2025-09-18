'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Calendar, DollarSign, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { Payment, PaymentStatus } from '@/types';

const statusOptions = [
  { value: 'ALL', label: 'Все статусы' },
  { value: 'PENDING', label: 'Ожидает оплаты' },
  { value: 'PAID', label: 'Оплачено' },
  { value: 'OVERDUE', label: 'Просрочено' },
  { value: 'CANCELLED', label: 'Отменено' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await fetch('/api/payments');
      if (response.ok) {
        const data = await response.json();
        setPayments(data.payments || []);
      } else {
        console.error('Failed to fetch payments');
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.project?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || payment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const getStatusColor = (status: PaymentStatus) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      PAID: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800',
      CANCELLED: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: PaymentStatus) => {
    const labels = {
      PENDING: 'Ожидает оплаты',
      PAID: 'Оплачено',
      OVERDUE: 'Просрочено',
      CANCELLED: 'Отменено',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: PaymentStatus) => {
    switch (status) {
      case 'PAID':
        return <CheckCircle className="w-4 h-4" />;
      case 'OVERDUE':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const isOverdue = (dueDate: Date | string | null) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
  };

  // Calculate statistics
  const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const paidAmount = payments
    .filter(p => p.status === 'PAID')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const pendingAmount = payments
    .filter(p => p.status === 'PENDING')
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const overdueAmount = payments
    .filter(p => p.status === 'OVERDUE' || (p.status === 'PENDING' && p.dueDate && isOverdue(p.dueDate)))
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

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
          <h1 className="text-3xl font-bold">Платежи</h1>
          <p className="text-muted-foreground">
            Управление платежами и финансовой отчетностью
          </p>
        </div>
        <Link href="/payments/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Добавить платеж
          </Button>
        </Link>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Поиск по описанию или проекту..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as PaymentStatus | 'ALL')}
                className="px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Общая сумма</p>
                <p className="text-2xl font-bold">{formatCurrency(totalAmount)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Получено</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidAmount)}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ожидается</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingAmount)}</p>
              </div>
              <Calendar className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Просрочено</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(overdueAmount)}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {payments.length === 0 ? 'Нет платежей' : 'Платежи не найдены'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {payments.length === 0 
                ? 'Добавьте первый платеж для начала работы'
                : 'Попробуйте изменить параметры поиска или фильтры'
              }
            </p>
            {payments.length === 0 && (
              <Link href="/payments/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Добавить платеж
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPayments.map((payment) => (
            <Link key={payment.id} href={`/payments/${payment.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(payment.status)}
                          <h3 className="font-semibold text-lg">
                            {formatCurrency(payment.amount)}
                          </h3>
                        </div>
                        <Badge className={getStatusColor(payment.status)}>
                          {getStatusLabel(payment.status)}
                        </Badge>
                        {payment.dueDate && isOverdue(payment.dueDate) && payment.status === 'PENDING' && (
                          <Badge variant="destructive">
                            Просрочено
                          </Badge>
                        )}
                      </div>
                      
                      {payment.description && (
                        <p className="text-muted-foreground">{payment.description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        {payment.project && (
                          <span>Проект: {payment.project.title}</span>
                        )}
                        {payment.dueDate && (
                          <span>Срок: {formatDate(payment.dueDate)}</span>
                        )}
                        {payment.paidDate && (
                          <span>Оплачено: {formatDate(payment.paidDate)}</span>
                        )}
                        <span>Создан: {formatDate(payment.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
