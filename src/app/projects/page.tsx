'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Filter, Calendar, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Project, ProjectStatus } from '@/types';

const statusColors = {
  PLANNING: 'bg-yellow-100 text-yellow-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-orange-100 text-orange-800',
  COMPLETED: 'bg-blue-100 text-blue-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PLANNING: 'Планирование',
  ACTIVE: 'Активный',
  ON_HOLD: 'Приостановлен',
  PAUSED: 'Приостановлен',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'ALL'>('ALL');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      if (response.ok) {
        const data = await response.json();
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter((project) => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || project.status === statusFilter;
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Проекты</h1>
          <p className="text-muted-foreground">Управление вашими проектами</p>
        </div>
        <Link href="/projects/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Новый проект
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Поиск проектов..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | 'ALL')}
          className="px-3 py-2 border border-input bg-background rounded-md text-sm"
        >
          <option value="ALL">Все статусы</option>
          <option value="PLANNING">Планирование</option>
          <option value="ACTIVE">Активный</option>
          <option value="ON_HOLD">Приостановлен</option>
          <option value="COMPLETED">Завершен</option>
          <option value="CANCELLED">Отменен</option>
        </select>
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-muted-foreground text-center">
              <h3 className="text-lg font-semibold mb-2">Проекты не найдены</h3>
              <p className="mb-4">
                {searchTerm || statusFilter !== 'ALL'
                  ? 'Попробуйте изменить фильтры поиска'
                  : 'Создайте свой первый проект'}
              </p>
              <Link href="/projects/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Создать проект
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`}>
              <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-2">{project.title}</CardTitle>
                    <Badge variant={project.status === 'COMPLETED' ? 'default' : 'secondary'}>
                      {statusLabels[project.status] || project.status}
                    </Badge>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-3">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {project.budget && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4 mr-2" />
                      {formatCurrency(Number(project.budget))}
                    </div>
                  )}
                  {project.endDate && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Calendar className="w-4 h-4 mr-2" />
                      Дедлайн: {formatDate(project.endDate)}
                    </div>
                  )}
                  {project.endDate && (
                    <p className="text-sm text-muted-foreground">
                      Завершен: {new Date(project.endDate).toLocaleDateString()}
                    </p>
                  )}
                  {project.client && (
                    <div className="text-sm text-muted-foreground">
                      Клиент: {project.client.name}
                    </div>
                  )}
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Задач: {project.tasks?.length || 0}</span>
                    <span>Создан: {formatDate(project.createdAt)}</span>
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
