'use client';

import { useState } from 'react';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  BarChart3,
  Calendar,
  Filter,
  Plus,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';

export default function TaskBoardPage() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleTaskUpdate = (taskId: string, newStatus: string) => {
    // Можно добавить дополнительную логику при обновлении задач
    console.log(`Task ${taskId} updated to ${newStatus}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/tasks">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Назад к задачам
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Kanban доска</h1>
            <p className="text-muted-foreground">
              Управляйте задачами с помощью drag-and-drop
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/analytics">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Аналитика
            </Button>
          </Link>
          
          <Link href="/calendar">
            <Button variant="outline" size="sm">
              <Calendar className="w-4 h-4 mr-2" />
              Календарь
            </Button>
          </Link>

          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Обновить
          </Button>

          <Link href="/tasks/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Новая задача
            </Button>
          </Link>
        </div>
      </div>

      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
              <Filter className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Как использовать Kanban доску
              </h3>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Перетаскивайте карточки задач между колонками для изменения их статуса. 
                Используйте значок захвата (⋮⋮) для перемещения карточек.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task Board */}
      <TaskBoard 
        key={refreshKey}
        onTaskUpdate={handleTaskUpdate}
      />

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Легенда</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Приоритеты</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gray-400 rounded"></div>
                  <span className="text-sm">Низкий</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-400 rounded"></div>
                  <span className="text-sm">Средний</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-400 rounded"></div>
                  <span className="text-sm">Высокий</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-400 rounded"></div>
                  <span className="text-sm">Срочный</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Статусы</h4>
              <div className="space-y-1">
                <Badge variant="secondary" className="text-xs">К выполнению</Badge>
                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800">В работе</Badge>
                <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">На проверке</Badge>
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Выполнено</Badge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Индикаторы</h4>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">Просрочено</Badge>
                  <span className="text-xs text-muted-foreground">Красная рамка</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-yellow-400">Скоро</Badge>
                  <span className="text-xs text-muted-foreground">Желтая рамка</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Действия</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <p>• Перетаскивание для смены статуса</p>
                <p>• Клик на карточку для деталей</p>
                <p>• Кнопка "+" для новой задачи</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
