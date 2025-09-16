'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Clock,
  FileText,
  User,
  Building
} from 'lucide-react';
import Link from 'next/link';
import { Payment, PaymentStatus } from '@/types';

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [paymentId, setPaymentId] = useState<string>('');

  useEffect(() => {
    const initializePayment = async () => {
      const { id } = await params;
      setPaymentId(id);
      fetchPayment(id);
    };
    initializePayment();
  }, [params]);

  const fetchPayment = async (id: string) => {
    try {
      const response = await fetch(`/api/payments/${id}`);
      if (response.ok) {
        const data = await response.json();
        setPayment(data.payment);
      } else if (response.status === 404) {
        router.push('/payments');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!payment) return;

    setUpdating(true);
    try {
      const updateData: Record<string, unknown> = {
        ...payment,
        status: newStatus,
      };

      // Set paidDate when marking as PAID
      if (newStatus === 'PAID' && !payment.paidDate) {
        updateData.paidDate = new Date().toISOString();
      }

      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const data = await response.json();
        setPayment(data.payment);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при обновлении статуса');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Ошибка при обновлении статуса');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этот платеж? Это действие нельзя отменить.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/payments');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при удалении платежа');
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      alert('Ошибка при удалении платежа');
    } finally {
      setDeleting(false);
    }
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
        return <CheckCircle className="w-5 h-5" />;
      case 'OVERDUE':
        return <AlertCircle className="w-5 h-5" />;
      case 'PENDING':
        return <Clock className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  const isOverdue = (dueDate: Date | string | null) => {
    if (!dueDate) return false;
    return new Date() > new Date(dueDate);
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
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/payments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к платежам
          </Button>
        </Link>
      </div>

      {/* Payment Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                {getStatusIcon(payment.status)}
              </div>
              <div>
                <CardTitle className="text-2xl">
                  {formatCurrency(payment.amount, payment.currency)}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <Badge className={getStatusColor(payment.status)}>
                    {getStatusLabel(payment.status)}
                  </Badge>
                  {payment.dueDate && isOverdue(payment.dueDate) && payment.status === 'PENDING' && (
                    <Badge variant="destructive">
                      Просрочено
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/payments/${payment.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                disabled={deleting || payment.status === 'PAID'}
                className="text-red-600 hover:text-red-700"
              >
                {deleting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Удалить
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {payment.dueDate && (
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <span className="text-sm text-muted-foreground">Срок оплаты:</span>
                  <p className="text-sm font-medium">{formatDate(payment.dueDate)}</p>
                </div>
              </div>
            )}
            {payment.paidDate && (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <div>
                  <span className="text-sm text-muted-foreground">Оплачено:</span>
                  <p className="text-sm font-medium">{formatDate(payment.paidDate)}</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <span className="text-sm text-muted-foreground">Создан:</span>
                <p className="text-sm font-medium">{formatDate(payment.createdAt)}</p>
              </div>
            </div>
          </div>
          
          {payment.description && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Описание</span>
              </div>
              <p className="text-sm text-muted-foreground">{payment.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Project Information */}
      {payment.project && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Информация о проекте</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <Link href={`/projects/${payment.project.id}`}>
                  <h3 className="font-semibold hover:text-primary cursor-pointer">
                    {payment.project.title}
                  </h3>
                </Link>
                {payment.project.client && (
                  <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>{payment.project.client.name}</span>
                    {payment.project.client.company && (
                      <>
                        <Building className="w-4 h-4 ml-2" />
                        <span>{payment.project.client.company}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Status Actions */}
      {payment.status !== 'PAID' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Действия</CardTitle>
            <CardDescription>
              Измените статус платежа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              {(payment.status as PaymentStatus) !== PaymentStatus.PAID && (
                <Button 
                  onClick={() => handleStatusChange('PAID')}
                  disabled={updating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {updating ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  Отметить как оплаченный
                </Button>
              )}
              {payment.status === 'OVERDUE' && (
                <Button 
                  onClick={() => handleStatusChange('PENDING')}
                  disabled={updating}
                  variant="outline"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  Вернуть в ожидание
                </Button>
              )}
              {payment.status !== 'CANCELLED' && (
                <Button 
                  onClick={() => handleStatusChange('CANCELLED')}
                  disabled={updating}
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                >
                  <AlertCircle className="w-4 h-4 mr-2" />
                  Отменить платеж
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
