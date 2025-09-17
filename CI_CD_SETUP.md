# CI/CD Setup Guide

## Обзор

Этот проект настроен с полным CI/CD пайплайном используя GitHub Actions для автоматизации тестирования, сборки и развертывания.

## Структура Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

Запускается при каждом push и pull request в ветки `main` и `develop`.

**Включает:**
- Линтинг кода (ESLint)
- Проверка типов TypeScript
- Запуск тестов
- Сборка приложения
- Аудит безопасности
- Сборка Docker образов

**Матрица тестирования:**
- Node.js версии: 18.x, 20.x
- Операционная система: Ubuntu Latest

### 2. Deployment Pipeline (`.github/workflows/deploy.yml`)

Запускается при push в ветку `main` или вручную через workflow_dispatch.

**Production Deploy:**
- Миграции базы данных
- Генерация Prisma клиента
- Сборка приложения
- Создание и публикация Docker образа
- Развертывание на production сервер

**Staging Deploy:**
- Автоматическое развертывание из ветки `develop`
- Отдельная база данных и конфигурация

### 3. Code Quality Pipeline (`.github/workflows/code-quality.yml`)

Дополнительные проверки качества кода:
- Проверка форматирования Prettier
- Строгая проверка TypeScript
- Анализ размера бандла
- Проверка зависимостей
- Проверка лицензий

## Необходимые Secrets

Настройте следующие secrets в GitHub repository:

### Database & Auth
```
DATABASE_URL=postgresql://user:password@host:port/database
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com
TELEGRAM_BOT_TOKEN=your-telegram-bot-token
```

### Docker Registry
```
DOCKER_REGISTRY=your-registry.com
DOCKER_USERNAME=your-username
DOCKER_PASSWORD=your-password
```

### Staging Environment
```
STAGING_DATABASE_URL=postgresql://user:password@staging-host:port/database
STAGING_NEXTAUTH_SECRET=staging-nextauth-secret
STAGING_NEXTAUTH_URL=https://staging.your-domain.com
```

## Environments

Настройте GitHub Environments для контроля развертывания:

### Production Environment
- Требует approval для развертывания
- Ограничен веткой `main`
- Все production secrets

### Staging Environment  
- Автоматическое развертывание из `develop`
- Staging secrets

## Локальные Команды

### Проверка качества кода
```bash
npm run lint          # ESLint проверка
npm run lint:fix      # Исправление ESLint ошибок
npm run type-check    # TypeScript проверка
npm run format        # Форматирование Prettier
npm run format:check  # Проверка форматирования
```

### Тестирование
```bash
npm test              # Запуск тестов
npm run ci            # Полная CI проверка локально
```

### Docker
```bash
npm run docker:dev    # Запуск development окружения
npm run docker:prod   # Запуск production окружения
```

### База данных
```bash
npm run db:migrate:deploy  # Применение миграций (production)
npm run db:generate        # Генерация Prisma клиента
npm run db:seed           # Заполнение тестовыми данными
```

## Workflow Статусы

### ✅ Успешный Pipeline
- Все проверки прошли
- Код готов к merge
- Автоматическое развертывание (если настроено)

### ❌ Неудачный Pipeline
- Проверьте логи в GitHub Actions
- Исправьте ошибки локально
- Создайте новый commit

### ⚠️ Частичный успех
- Некоторые проверки могут быть помечены как `continue-on-error`
- Проверьте артефакты для деталей

## Мониторинг и Логи

### Артефакты
- ESLint отчеты сохраняются как артефакты
- Логи сборки доступны в GitHub Actions
- Docker образы тегируются с commit SHA

### Уведомления
- Настройте Slack/Discord webhook для уведомлений
- Email уведомления через GitHub настройки

## Безопасность

### Аудит зависимостей
- Автоматическая проверка уязвимостей
- Блокировка при критических уязвимостях
- Регулярные обновления зависимостей

### Secrets Management
- Все чувствительные данные в GitHub Secrets
- Никогда не коммитьте секреты в код
- Используйте environment-specific secrets

## Troubleshooting

### Частые проблемы

**1. Database Connection Error**
```bash
# Проверьте DATABASE_URL secret
# Убедитесь что база данных доступна
```

**2. Docker Build Failed**
```bash
# Проверьте Dockerfile синтаксис
# Убедитесь что все зависимости установлены
```

**3. TypeScript Errors**
```bash
# Запустите локально: npm run type-check
# Исправьте ошибки типов
```

**4. Lint Errors**
```bash
# Запустите: npm run lint:fix
# Проверьте ESLint конфигурацию
```

## Расширение Pipeline

### Добавление новых проверок
1. Создайте новый job в соответствующем workflow
2. Добавьте необходимые steps
3. Настройте условия выполнения

### Интеграция с внешними сервисами
1. Добавьте secrets для API ключей
2. Создайте steps для интеграции
3. Настройте error handling

### Кастомные действия
1. Создайте `.github/actions/` директорию
2. Определите composite actions
3. Используйте в workflows

## Лучшие практики

1. **Всегда тестируйте локально** перед push
2. **Используйте feature branches** для разработки
3. **Создавайте meaningful commit messages**
4. **Регулярно обновляйте зависимости**
5. **Мониторьте производительность** pipeline
6. **Документируйте изменения** в CI/CD
