'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Если загрузка завершена и пользователь не авторизован
    if (!isLoading && !isAuthenticated) {
      // В production перенаправляем на страницу ошибки
      if (process.env.NODE_ENV === 'production') {
        router.push('/auth-error');
      }
    }
  }, [isLoading, isAuthenticated, router]);

  // Показываем загрузку
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
            </div>
            <CardTitle className="text-2xl">Raising CRM</CardTitle>
            <CardDescription>Авторизация через Telegram...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Если не авторизован
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background to-muted p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-12 h-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl">Ошибка авторизации</CardTitle>
            <CardDescription>
              Не удалось авторизоваться через Telegram
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm text-destructive">
                  Это приложение должно быть открыто внутри Telegram.
                  Пожалуйста, откройте его через Telegram бот.
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground space-y-2">
              <p className="font-medium">Как открыть приложение:</p>
              <ol className="list-decimal list-inside space-y-1 ml-2">
                <li>Откройте Telegram</li>
                <li>Найдите бот @YourBotName</li>
                <li>Нажмите на кнопку "Открыть приложение"</li>
              </ol>
            </div>

            {process.env.NODE_ENV === 'development' && (
              <div className="rounded-lg border bg-muted p-3">
                <p className="text-xs text-muted-foreground">
                  <strong>Development режим:</strong> В production это сообщение не будет показываться.
                  Убедитесь что USE_MOCK_AUTH=true в .env для локальной разработки.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Авторизован - показываем контент
  return <>{children}</>;
}
