# 🔐 Аутентификация в Raising CRM - Краткая Памятка

## ✅ Что работает

### Backend
- ✅ Валидация Telegram initData через HMAC SHA256
- ✅ Автоматическое создание пользователей в БД
- ✅ Защита всех API routes через `requireAuth()`

### Frontend
- ✅ Автоматическая авторизация при запуске
- ✅ Защита всех страниц через `<AuthGuard>`
- ✅ Глобальный доступ к user через `useAuth()`

---

## 🚀 Quick Start

### Development (без Telegram)
```bash
# 1. Установите переменную
echo "USE_MOCK_AUTH=true" >> .env

# 2. Запустите
npm run dev

# 3. Откройте http://localhost:3000
# Авторизация пройдет автоматически!
```

### Production (через Telegram)
```bash
# 1. Создайте бота через @BotFather
# 2. Настройте Web App
# 3. Установите TELEGRAM_BOT_TOKEN
# 4. Деплойте на HTTPS
# 5. Откройте через Telegram
```

---

## 💻 Использование в коде

### Получить данные пользователя
```typescript
import { useAuth } from '@/contexts/AuthContext';

const { user, isAuthenticated } = useAuth();

// user?.firstName, user?.telegramId, etc.
```

### API запросы
```typescript
import { api } from '@/lib/api-client';

// Автоматически добавляет X-Telegram-Init-Data
const projects = await api.get('/api/projects');
const newProject = await api.post('/api/projects', data);
```

### Защитить API route
```typescript
import { requireAuth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await requireAuth(request); // Выбросит ошибку если не авторизован
  // ... ваш код
}
```

---

## 📁 Ключевые файлы

| Файл | Описание |
|------|----------|
| `src/contexts/AuthContext.tsx` | Глобальное состояние авторизации |
| `src/components/auth/AuthGuard.tsx` | Защита страниц |
| `src/lib/auth.ts` | Backend валидация |
| `src/lib/api-client.ts` | API клиент с auth |
| `src/app/api/auth/telegram/route.ts` | Endpoint авторизации |

---

## 🐛 Troubleshooting

### "No Telegram init data"
**Решение**: Установите `USE_MOCK_AUTH=true` в .env для development

### "Invalid Telegram data"
**Решение**: Проверьте `TELEGRAM_BOT_TOKEN` в .env

### "Unauthorized" при API запросах
**Решение**: Используйте `api.get()` вместо `fetch()`

---

## 📚 Документация

- **Полный гайд**: `TELEGRAM_SETUP.md`
- **Детали авторизации**: `FRONTEND_AUTH_SUMMARY.md`
- **Сводка**: `AUTH_COMPLETE.md`
- **Общие улучшения**: `FINAL_SUMMARY.md`

---

## ✅ Готово к использованию!

Авторизация настроена и работает. Можно разрабатывать дальше! 🎉
