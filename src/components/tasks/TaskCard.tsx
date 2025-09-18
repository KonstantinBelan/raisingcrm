'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar,
  AlertTriangle,
  Clock,
  ExternalLink,
  GripVertical
} from 'lucide-react';
import Link from 'next/link';
import { format, isAfter, isBefore, addDays } from 'date-fns';
import { ru } from 'date-fns/locale';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  deadline?: string;
  dueDate?: string;
  project?: {
    id: string;
    title: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

const priorityConfig = {
  LOW: { 
    label: 'Низкий', 
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
    border: 'border-l-gray-400'
  },
  MEDIUM: { 
    label: 'Средний', 
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    border: 'border-l-blue-400'
  },
  HIGH: { 
    label: 'Высокий', 
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    border: 'border-l-orange-400'
  },
  URGENT: { 
    label: 'Срочный', 
    color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
    border: 'border-l-red-400'
  }
};

export function TaskCard({ task }: { task: Task }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const deadline = task.deadline || task.dueDate;
  const isOverdue = deadline && isBefore(new Date(deadline), new Date()) && task.status !== 'DONE';
  const isDueSoon = deadline && isAfter(new Date(deadline), new Date()) && 
                   isBefore(new Date(deadline), addDays(new Date(), 3));

  const priorityStyle = priorityConfig[task.priority];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`cursor-pointer transition-all duration-200 ${
        isDragging ? 'opacity-50 scale-105 rotate-2' : 'hover:shadow-md'
      }`}
    >
      <Card className={`
        cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow
        border-l-4 ${priorityStyle.border}
        ${isOverdue ? 'ring-2 ring-red-200 dark:ring-red-800' : ''}
        ${isDueSoon ? 'ring-2 ring-yellow-200 dark:ring-yellow-800' : ''}
      `}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm leading-tight mb-1 truncate">
                {task.title}
              </h4>
              {task.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {task.description}
                </p>
              )}
            </div>
            <div 
              {...attributes} 
              {...listeners}
              className="ml-2 p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            {/* Priority Badge */}
            <div className="flex items-center justify-between">
              <Badge 
                variant="secondary" 
                className={`text-xs ${priorityStyle.color}`}
              >
                {priorityStyle.label}
              </Badge>
              
              {isOverdue && (
                <Badge variant="destructive" className="text-xs">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  Просрочено
                </Badge>
              )}
              
              {isDueSoon && !isOverdue && (
                <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-600">
                  <Clock className="w-3 h-3 mr-1" />
                  Скоро
                </Badge>
              )}
            </div>

            {/* Project */}
            {task.project && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-xs text-muted-foreground truncate">
                  {task.project.title}
                </span>
              </div>
            )}

            {/* Deadline */}
            {deadline && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="w-3 h-3" />
                <span className={isOverdue ? 'text-red-600 dark:text-red-400' : ''}>
                  {format(new Date(deadline), 'dd MMM yyyy', { locale: ru })}
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-xs text-muted-foreground">
                {format(new Date(task.updatedAt), 'dd.MM', { locale: ru })}
              </span>
              
              <Link href={`/tasks/${task.id}`}>
                <Button variant="ghost" size="sm" className="h-6 px-2">
                  <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
