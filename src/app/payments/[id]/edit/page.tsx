'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Save, DollarSign, Calendar } from 'lucide-react';
import Link from 'next/link';
import { Payment, Project, PaymentStatus } from '@/types';

const currencies = [
  { value: 'RUB', label: '₽ Рубль' },
  { value: 'USD', label: '$ Доллар' },
  { value: 'EUR', label: '€ Евро' },
];

const paymentStatuses = [
  { value: 'PENDING', label: 'Ожидает оплаты' },
  { value: 'PAID', label: 'Оплачено' },
  { value: 'OVERDUE', label: 'Просрочено' },
  { value: 'CANCELLED', label: 'Отменено' },
];

export default function EditPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [payment, setPayment] = useState<Payment | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'RUB',
    description: '',
    dueDate: '',
    paidDate: '',
    status: 'PENDING' as PaymentStatus,
    projectId: '',
  });

  useEffect(() => {
    fetchPayment();
    fetchProjects();
  }, [params.id]);

  const fetchPayment = async () => {
    try {
      const response = await fetch(`/api/payments/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        const payment = data.payment;
        setPayment(payment);
        setFormData({
          amount: payment.amount.toString(),
          currency: payment.currency,
          description: payment.description || '',
          dueDate: payment.dueDate ? new Date(payment.dueDate).toISOString().split('T')[0] : '',
          paidDate: payment.paidDate ? new Date(payment.paidDate).toISOString().split('T')[0] : '',
          status: payment.status,
          projectId: payment.projectId || '',
        });
      } else if (response.status === 404) {
        router.push('/payments');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/payments/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push(`/payments/${params.id}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при обновлении платежа');
      }
    } catch (error) {
      console.error('Error updating payment:', error);
      alert('Ошибка при обновлении платежа');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: currency,
    }).format(amount);
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

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Платеж не найден</h3>
            <p className="text-muted-foreground mb-4">
              Платеж с указанным ID не существует или был удален
            </p>
            <Link href="/payments">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Вернуться к платежам
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/payments/${params.id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к платежу
          </Button>
        </Link>
      </div>

      {/* Payment Info Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="p-2 bg-primary/10 rounded-lg">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle>Редактирование платежа</CardTitle>
              <CardDescription>
                {formatCurrency(payment.amount, payment.currency)} • 
                <Badge className={`ml-2 ${getStatusColor(payment.status)}`}>
                  {paymentStatuses.find(s => s.value === payment.status)?.label}
                </Badge>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>Создан: {formatDate(payment.createdAt)}</span>
            </div>
            {payment.paidDate && (
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                <span>Оплачен: {formatDate(payment.paidDate)}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Информация о платеже</CardTitle>
          <CardDescription>
            Измените данные платежа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Сумма *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Валюта *</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                  required
                >
                  {currencies.map((currency) => (
                    <option key={currency.value} value={currency.value}>
                      {currency.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Описание</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Описание платежа"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dueDate">Срок оплаты</Label>
                <Input
                  id="dueDate"
                  name="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={handleChange}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="paidDate">Дата оплаты</Label>
                <Input
                  id="paidDate"
                  name="paidDate"
                  type="date"
                  value={formData.paidDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Статус</Label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
              >
                {paymentStatuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
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
                <option value="">Без проекта</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Сохранить изменения
              </Button>
              <Link href={`/payments/${params.id}`}>
                <Button type="button" variant="outline">
                  Отмена
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg">💡 Советы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>• При изменении статуса на "Оплачено" автоматически устанавливается дата оплаты</p>
          <p>• Дату оплаты можно установить вручную</p>
          <p>• Оплаченные платежи нельзя удалить без изменения статуса</p>
          <p>• Привязка к проекту помогает отслеживать финансы по проектам</p>
        </CardContent>
      </Card>
    </div>
  );
}
