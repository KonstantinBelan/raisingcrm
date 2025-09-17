# Docker Setup для Raising CRM

## Быстрый старт

### Разработка (Development)

```bash
# Клонировать репозиторий
git clone <repository-url>
cd raising-crm

# Создать .env.local файл
cp .env.example .env.local
# Отредактировать .env.local с вашими значениями

# Запустить в режиме разработки
docker-compose up --build

# Приложение будет доступно на http://localhost:3000
```

### Продакшн (Production)

```bash
# Создать .env файл для продакшна
cp .env.example .env
# Отредактировать .env с продакшн значениями

# Запустить в продакшн режиме
docker-compose -f docker-compose.prod.yml up --build -d

# Приложение будет доступно на http://localhost:3000
```

## Файлы конфигурации

### Development
- `docker-compose.yml` - основной файл для разработки
- `Dockerfile.dev` - Docker образ для разработки
- Использует hot reload и volume mounting

### Production
- `docker-compose.prod.yml` - файл для продакшна
- `Dockerfile` - оптимизированный Docker образ для продакшна
- Использует Next.js standalone output

## Переменные окружения

Создайте `.env.local` (для разработки) или `.env` (для продакшна):

```env
# Обязательные
DATABASE_URL=postgresql://raising_user:raising_password@localhost:5432/raising_crm
TELEGRAM_BOT_TOKEN=your_bot_token_here

# Опциональные
OPENROUTER_API_KEY=your_openrouter_key_here
TELEGRAM_WEBHOOK_SECRET=your_webhook_secret
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## Команды Docker

### Разработка

```bash
# Запуск всех сервисов
docker-compose up

# Запуск в фоновом режиме
docker-compose up -d

# Пересборка образов
docker-compose up --build

# Остановка сервисов
docker-compose down

# Просмотр логов
docker-compose logs app
docker-compose logs postgres
```

### Продакшн

```bash
# Запуск продакшн версии
docker-compose -f docker-compose.prod.yml up -d

# Остановка продакшн версии
docker-compose -f docker-compose.prod.yml down

# Просмотр логов продакшн
docker-compose -f docker-compose.prod.yml logs app
```

## База данных

### Инициализация

База данных автоматически создается при первом запуске. Таблицы создаются через SQL скрипт:

```bash
# Если нужно пересоздать таблицы
docker exec -i raising-crm-postgres psql -U raising_user -d raising_crm < create_tables.sql
```

### Подключение к БД

```bash
# Подключение к PostgreSQL в контейнере
docker exec -it raising-crm-postgres psql -U raising_user -d raising_crm

# Просмотр таблиц
\dt

# Выход
\q
```

## Отладка

### Проблемы с запуском

1. **Порты заняты**: Убедитесь, что порты 3000, 5432, 6379 свободны
2. **Ошибки сборки**: Очистите Docker кэш `docker system prune -a`
3. **Проблемы с БД**: Удалите volumes `docker-compose down -v`

### Логи

```bash
# Все логи
docker-compose logs

# Логи конкретного сервиса
docker-compose logs app
docker-compose logs postgres
docker-compose logs redis

# Следить за логами в реальном времени
docker-compose logs -f app
```

### Перезапуск сервисов

```bash
# Перезапуск только приложения
docker-compose restart app

# Полная пересборка
docker-compose down
docker-compose up --build
```

## Различия между Dev и Prod

| Параметр | Development | Production |
|----------|-------------|------------|
| Dockerfile | `Dockerfile.dev` | `Dockerfile` |
| Node.js режим | development | production |
| Hot reload | ✅ | ❌ |
| Volume mounting | ✅ | ❌ |
| Оптимизация | ❌ | ✅ |
| Размер образа | Больше | Меньше |

## Мониторинг

### Проверка статуса

```bash
# Статус контейнеров
docker-compose ps

# Использование ресурсов
docker stats

# Информация о образах
docker images
```

### Здоровье приложения

- **Приложение**: http://localhost:3000
- **API Health**: http://localhost:3000/api/telegram/webhook
- **База данных**: порт 5432
- **Redis**: порт 6379

## Обновление

### Development

```bash
# Остановить сервисы
docker-compose down

# Обновить код
git pull

# Пересобрать и запустить
docker-compose up --build
```

### Production

```bash
# Остановить продакшн
docker-compose -f docker-compose.prod.yml down

# Обновить код
git pull

# Пересобрать и запустить
docker-compose -f docker-compose.prod.yml up --build -d
```

## Бэкапы

### База данных

```bash
# Создать бэкап
docker exec raising-crm-postgres pg_dump -U raising_user raising_crm > backup.sql

# Восстановить из бэкапа
docker exec -i raising-crm-postgres psql -U raising_user -d raising_crm < backup.sql
```

## Troubleshooting

### Частые ошибки

1. **Cannot find module '/app/server.js'**
   - Используйте правильный docker-compose файл для вашего режима
   - Для разработки: `docker-compose.yml`
   - Для продакшна: `docker-compose.prod.yml`

2. **Port already in use**
   ```bash
   # Найти процесс использующий порт
   lsof -i :3000
   # Остановить процесс
   kill -9 <PID>
   ```

3. **Database connection failed**
   - Проверьте что PostgreSQL контейнер запущен
   - Проверьте DATABASE_URL в переменных окружения

4. **Permission denied**
   ```bash
   # Исправить права доступа
   sudo chown -R $USER:$USER .
   ```
