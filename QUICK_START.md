# 🚀 Quick Start Guide - Raising CRM

## Быстрый старт после улучшений

### Шаг 1: Применить изменения в БД

```bash
# Перейти в директорию проекта
cd "/Users/kosbelan/Desktop/Проекты 2025/Фриланс CMS/raising-crm"

# Создать миграцию с индексами
npx prisma migrate dev --name add_database_indexes

# Сгенерировать Prisma Client
npx prisma generate
```

### Шаг 2: Проверить .env файл

Убедитесь, что ваш `.env` файл содержит все необходимые переменные:

```bash
# Скопируйте пример, если еще не сделали
cp env.example .env

# Отредактируйте .env файл
nano .env  # или используйте ваш любимый редактор
```

**Минимальные требования для development**:
```env
DATABASE_URL="postgresql://raising_user:raising_password@localhost:5432/raising_crm"
TELEGRAM_BOT_TOKEN="your_bot_token"
TELEGRAM_WEBHOOK_SECRET="your_webhook_secret"
NEXTAUTH_SECRET="your-secret-at-least-32-characters-long"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"
USE_MOCK_AUTH="true"
```

### Шаг 3: Запустить проект

```bash
# Установить зависимости (если еще не установлены)
npm install

# Запустить в режиме разработки
npm run dev
```

### Шаг 4: Проверить работу

Откройте http://localhost:3000 в браузере.

**С USE_MOCK_AUTH=true**:
- Приложение будет работать без реального Telegram
- Используется тестовый пользователь
- Подходит для локальной разработки

**Для production (USE_MOCK_AUTH=false)**:
- Требуется настоящий Telegram Bot
- Нужен HTTPS для Telegram WebApp
- Валидация через Telegram initData

---

## 🔧 Дополнительные команды

### Проверка кода

```bash
# TypeScript проверка
npm run type-check

# ESLint проверка
npm run lint

# Автоисправление lint ошибок
npm run lint:fix

# Полная проверка (как в CI)
npm run ci
```

### Работа с БД

```bash
# Открыть Prisma Studio (GUI для БД)
npm run db:studio

# Сбросить БД и применить миграции
npx prisma migrate reset

# Заполнить БД тестовыми данными
npm run db:seed
```

### Docker

```bash
# Запустить в Docker (development)
npm run docker:dev

# Запустить в Docker (production)
npm run docker:prod

# Запустить только PostgreSQL
docker-compose up -d postgres
```

---

## 📝 Использование новых возможностей

### 1. Создание API route с валидацией

```typescript
// Пример: src/app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleApiError } from '@/lib/errors';
import { createProjectSchema } from '@/lib/validations/project';

export async function POST(request: NextRequest) {
  try {
    // Проверка аутентификации
    const session = await requireAuth(request);

    // Валидация данных
    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    // Ваша логика...

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 2. Использование типов

```typescript
import type { Project, Task, Client } from '@/types/api';

// Type-safe работа с данными
const projects: Project[] = data.projects;
const activeTasks = tasks.filter((t: Task) => t.status === 'IN_PROGRESS');
```

### 3. Работа с environment переменными

```typescript
import { env } from '@/lib/env';

// Безопасный доступ к переменным
const botToken = env.TELEGRAM_BOT_TOKEN;
const dbUrl = env.DATABASE_URL;
```

---

## ⚠️ Важные замечания

### Development режим

В development с `USE_MOCK_AUTH=true`:
- ✅ Можно работать без Telegram
- ✅ Быстрый старт разработки
- ⚠️ Используется фиксированный тестовый пользователь

### Production режим

Перед деплоем в production:
1. ✅ Убрать или установить `USE_MOCK_AUTH=false`
2. ✅ Настроить реальный `TELEGRAM_BOT_TOKEN`
3. ✅ Настроить production DATABASE_URL
4. ✅ Сгенерировать безопасный `NEXTAUTH_SECRET` (32+ символов)
5. ✅ Установить правильный `NEXTAUTH_URL`
6. ✅ Применить миграции БД: `npm run db:migrate:deploy`

---

## 🐛 Устранение проблем

### Проблема: TypeScript ошибки

```bash
# Убедитесь что Prisma Client сгенерирован
npx prisma generate

# Перезапустите TypeScript server в IDE
# VSCode: Cmd+Shift+P -> "TypeScript: Restart TS Server"
```

### Проблема: База данных не подключается

```bash
# Проверьте что PostgreSQL запущен
docker-compose up -d postgres

# Проверьте DATABASE_URL в .env
echo $DATABASE_URL

# Попробуйте создать БД заново
npx prisma migrate reset
```

### Проблема: Lint ошибки

```bash
# Попробуйте автофикс
npm run lint:fix

# Если не помогло - проверьте конкретные ошибки
npm run lint
```

---

## 📚 Дополнительная информация

- **Полный список улучшений**: см. `IMPROVEMENTS_SUMMARY.md`
- **Детальный план**: см. `toFixed.md`
- **Документация**: см. `README.md`

---

## 🎯 Что дальше?

### Короткий срок (1-2 дня):
1. Обновить 2-3 API routes для использования валидации
2. Протестировать аутентификацию
3. Проверить работу с индексами БД

### Средний срок (1 неделя):
1. Добавить rate limiting (см. toFixed.md #7)
2. Настроить CI/CD
3. Написать несколько unit тестов

### Долгий срок (2+ недели):
1. Добавить мониторинг (Sentry)
2. Расширить покрытие тестами
3. Оптимизировать оставшиеся компоненты

**Удачи с разработкой! 🚀**
