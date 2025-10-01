'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Home, 
  Briefcase, 
  CheckSquare, 
  Users, 
  CreditCard,
  Calendar,
  BarChart3,
  Kanban,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
  {
    href: '/',
    icon: Home,
    label: 'Главная',
    isMain: true
  },
  {
    href: '/projects',
    icon: Briefcase,
    label: 'Проекты'
  },
  {
    href: '/tasks',
    icon: CheckSquare,
    label: 'Задачи'
  },
  {
    href: '/tasks/board',
    icon: Kanban,
    label: 'Доска'
  },
  {
    href: '/clients',
    icon: Users,
    label: 'Клиенты'
  }
];

const secondaryItems = [
  {
    href: '/payments',
    icon: CreditCard,
    label: 'Платежи'
  },
  {
    href: '/calendar',
    icon: Calendar,
    label: 'Календарь'
  },
  {
    href: '/analytics',
    icon: BarChart3,
    label: 'Аналитика'
  },
  {
    href: '/reminders',
    icon: Bell,
    label: 'Уведомления'
  }
];

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border">
        <div className="grid grid-cols-5 h-16">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || 
              (item.href !== '/' && pathname.startsWith(item.href));
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors touch-manipulation",
                  isActive 
                    ? "text-primary" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "w-5 h-5",
                  isActive && "text-primary"
                )} />
                <span className="truncate max-w-full px-1">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Secondary Navigation Drawer Trigger */}
      <div className="fixed bottom-20 right-4 z-40 lg:hidden">
        <details className="group">
          <summary className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg cursor-pointer touch-manipulation list-none">
            <BarChart3 className="w-6 h-6" />
          </summary>
          
          <div className="absolute bottom-16 right-0 bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg p-2 min-w-[140px]">
            <div className="space-y-1">
              {secondaryItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/' && pathname.startsWith(item.href));
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors touch-manipulation",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </details>
      </div>
    </>
  );
}
