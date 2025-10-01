'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { 
  Clock, 
  Play, 
  Eye, 
  CheckCircle, 
  MoreHorizontal,
  ArrowRight
} from 'lucide-react';
import { Task } from './TaskCard';

interface MobileTaskActionsProps {
  task: Task;
  onStatusChange: (newStatus: Task['status']) => void;
}

const statusConfig = {
  TODO: {
    label: 'К выполнению',
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 dark:bg-gray-800'
  },
  IN_PROGRESS: {
    label: 'В работе',
    icon: Play,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 dark:bg-blue-800'
  },
  REVIEW: {
    label: 'На проверке',
    icon: Eye,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 dark:bg-yellow-800'
  },
  DONE: {
    label: 'Выполнено',
    icon: CheckCircle,
    color: 'text-green-600',
    bgColor: 'bg-green-100 dark:bg-green-800'
  }
};

export function MobileTaskActions({ task, onStatusChange }: MobileTaskActionsProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleStatusChange = (newStatus: Task['status']) => {
    onStatusChange(newStatus);
    setIsOpen(false);
  };

  const currentStatus = statusConfig[task.status];
  const CurrentIcon = currentStatus.icon;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 w-10 p-0 touch-manipulation lg:hidden"
        >
          <MoreHorizontal className="w-5 h-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[400px]">
        <SheetHeader className="text-left">
          <SheetTitle className="text-lg">Изменить статус задачи</SheetTitle>
          <SheetDescription className="text-base">
            {task.title}
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6 space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <CurrentIcon className={`w-5 h-5 ${currentStatus.color}`} />
            <span className="font-medium">Текущий статус: {currentStatus.label}</span>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground font-medium">Выберите новый статус:</p>
            {Object.entries(statusConfig).map(([status, config]) => {
              const Icon = config.icon;
              const isCurrentStatus = task.status === status;
              
              if (isCurrentStatus) return null;
              
              return (
                <Button
                  key={status}
                  variant="outline"
                  className="w-full justify-start h-14 text-base touch-manipulation"
                  onClick={() => handleStatusChange(status as Task['status'])}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${config.bgColor}`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <span>{config.label}</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-muted-foreground" />
                  </div>
                </Button>
              );
            })}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
