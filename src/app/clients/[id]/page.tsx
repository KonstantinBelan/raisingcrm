'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Edit, 
  Trash2, 
  Mail, 
  Phone, 
  Building, 
  Calendar,
  DollarSign,
  Plus,
  User,
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { Client, Project } from '@/types';

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchClient();
  }, [params.id]);

  const fetchClient = async () => {
    try {
      const response = await fetch(`/api/clients/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data.client);
      } else if (response.status === 404) {
        router.push('/clients');
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Вы уверены, что хотите удалить этого клиента? Это действие нельзя отменить.')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch(`/api/clients/${params.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        router.push('/clients');
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при удалении клиента');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      alert('Ошибка при удалении клиента');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('ru-RU');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: 'bg-yellow-100 text-yellow-800',
      ACTIVE: 'bg-green-100 text-green-800',
      ON_HOLD: 'bg-orange-100 text-orange-800',
      PAUSED: 'bg-orange-100 text-orange-800',
      COMPLETED: 'bg-blue-100 text-blue-800',
      CANCELLED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PLANNING: 'Планирование',
      ACTIVE: 'Активный',
      ON_HOLD: 'Приостановлен',
      PAUSED: 'Приостановлен',
      COMPLETED: 'Завершен',
      CANCELLED: 'Отменен',
    };
    return labels[status] || status;
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

  if (!client) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Клиент не найден</h3>
            <p className="text-muted-foreground mb-4">
              Клиент с указанным ID не существует или был удален
            </p>
            <Link href="/clients">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Вернуться к клиентам
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totalProjects = client.projects?.length || 0;
  const activeProjects = client.projects?.filter(p => p.status === 'ACTIVE').length || 0;
  const completedProjects = client.projects?.filter(p => p.status === 'COMPLETED').length || 0;
  const totalBudget = client.projects?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0;

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/clients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Назад к клиентам
          </Button>
        </Link>
      </div>

      {/* Client Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <User className="w-8 h-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{client.name}</CardTitle>
                {client.company && (
                  <CardDescription className="text-lg">
                    {client.company}
                  </CardDescription>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/clients/${client.id}/edit`}>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-2" />
                  Редактировать
                </Button>
              </Link>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDelete}
                disabled={deleting || totalProjects > 0}
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
            {client.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.email}</span>
              </div>
            )}
            {client.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.phone}</span>
              </div>
            )}
            {client.company && (
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">{client.company}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Добавлен: {formatDate(client.createdAt)}</span>
            </div>
          </div>
          {client.notes && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Заметки</span>
              </div>
              <p className="text-sm text-muted-foreground">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Всего проектов</p>
                <p className="text-2xl font-bold">{totalProjects}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Активных</p>
                <p className="text-2xl font-bold text-green-600">{activeProjects}</p>
              </div>
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-green-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Завершенных</p>
                <p className="text-2xl font-bold text-blue-600">{completedProjects}</p>
              </div>
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Общий бюджет</p>
                <p className="text-2xl font-bold">{formatCurrency(totalBudget)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Projects */}
      <Tabs defaultValue="projects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="projects">Проекты ({totalProjects})</TabsTrigger>
        </TabsList>

        <TabsContent value="projects">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Проекты клиента</CardTitle>
                <Link href={`/projects/new?clientId=${client.id}`}>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Новый проект
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {!client.projects || client.projects.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Нет проектов</h3>
                  <p className="text-muted-foreground mb-4">
                    У этого клиента пока нет проектов
                  </p>
                  <Link href={`/projects/new?clientId=${client.id}`}>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Создать первый проект
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {client.projects.map((project: Project) => (
                    <Link key={project.id} href={`/projects/${project.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{project.title}</h4>
                                <Badge className={getStatusColor(project.status)}>
                                  {getStatusLabel(project.status)}
                                </Badge>
                              </div>
                              {project.description && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {project.description}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span>Создан: {formatDate(project.createdAt)}</span>
                                {project.budget && (
                                  <span>Бюджет: {formatCurrency(Number(project.budget))}</span>
                                )}
                                {project.tasks && (
                                  <span>Задач: {project.tasks.length}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
