# 🤖 Подключение Raising CRM к Telegram Bot

> Пошаговая инструкция по созданию и настройке Telegram Bot для вашего CRM приложения

---

## 📋 Содержание

1. [Создание Telegram Bot](#1-создание-telegram-bot)
2. [Настройка Web App](#2-настройка-web-app)
3. [Настройка переменных окружения](#3-настройка-переменных-окружения)
4. [Деплой приложения](#4-деплой-приложения)
5. [Настройка команд бота](#5-настройка-команд-бота)
6. [Тестирование](#6-тестирование)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. Создание Telegram Bot

### Шаг 1.1: Найдите BotFather

1. Откройте Telegram
2. Найдите бота **@BotFather** (официальный бот от Telegram)
3. Нажмите **Start**

### Шаг 1.2: Создайте нового бота

Отправьте команду:
```
/newbot
```

BotFather спросит:

**1. Имя бота (отображаемое):**
```
Raising CRM
```
Или любое другое имя, которое будет видно пользователям.

**2. Username бота (уникальный, должен заканчиваться на "bot"):**
```
raising_crm_bot
```
Или любое другое, например: `your_company_crm_bot`

### Шаг 1.3: Сохраните токен

После создания бота, BotFather отправит вам сообщение с **токеном**:
```
Use this token to access the HTTP API:
1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

⚠️ **ВАЖНО**: 
- Сохраните этот токен в безопасном месте
- Никому не показывайте токен
- Не загружайте его в Git

---

## 2. Настройка Web App

### Шаг 2.1: Установите описание и картинку бота

**Установить описание:**
```
/setdescription
```
Выберите вашего бота и введите описание:
```
Мощная CRM-система для фрилансеров. Управляйте проектами, задачами, клиентами и финансами прямо в Telegram.
```

**Установить картинку профиля:**
```
/setuserpic
```
Выберите бота и загрузите изображение (рекомендуется 512x512 px).

### Шаг 2.2: Создайте Web App

**Важный момент**: Telegram Web Apps должны работать по HTTPS!

Отправьте команду:
```
/newapp
```

BotFather попросит:

**1. Выбрать бота:**
Выберите созданного бота

**2. Название приложения:**
```
Raising CRM
```

**3. Описание (короткое):**
```
CRM для фрилансеров
```

**4. URL приложения:**
```
https://your-domain.com
```
Замените на URL вашего deployed приложения.

⚠️ **Требования к URL**:
- Обязательно HTTPS (не работает с HTTP)
- Должен быть доступен из интернета
- Можно использовать:
  - Vercel (vercel.com) - рекомендуется
  - Netlify (netlify.com)
  - Railway (railway.app)
  - Свой VPS/сервер

**5. Загрузите иконку приложения:**
Отправьте изображение 640x360 px (или другое с соотношением 16:9)

### Шаг 2.3: Получите short name приложения

После создания Web App, BotFather даст вам **short name** (например, `raising_crm`).

Ваш Web App будет доступен по ссылке:
```
https://t.me/your_bot_name/app_short_name
```

---

## 3. Настройка переменных окружения

### Шаг 3.1: Добавьте токен в .env

Откройте файл `.env` в корне проекта и добавьте:

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
TELEGRAM_WEBHOOK_SECRET="ваш-случайный-секрет-минимум-32-символа"

# Для production
NEXTAUTH_URL="https://your-domain.com"
NODE_ENV="production"

# Убрать или установить в false для production
USE_MOCK_AUTH="false"
```

### Шаг 3.2: Сгенерируйте безопасные секреты

**Для TELEGRAM_WEBHOOK_SECRET и NEXTAUTH_SECRET:**

```bash
# На Mac/Linux
openssl rand -hex 32

# Или в Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## 4. Деплой приложения

### Вариант A: Vercel (рекомендуется)

1. **Установите Vercel CLI:**
```bash
npm install -g vercel
```

2. **Залогиньтесь:**
```bash
vercel login
```

3. **Деплой:**
```bash
vercel --prod
```

4. **Добавьте переменные окружения в Vercel:**
   - Откройте https://vercel.com/dashboard
   - Выберите ваш проект
   - Settings → Environment Variables
   - Добавьте все переменные из `.env`

5. **Настройте PostgreSQL:**
   - Используйте Vercel Postgres или
   - Подключите внешнюю БД (Supabase, Railway, Neon)

### Вариант B: Docker на своем сервере

1. **Соберите Docker образ:**
```bash
docker-compose -f docker-compose.prod.yml build
```

2. **Запустите:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

3. **Настройте Nginx с SSL (Let's Encrypt):**
```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 5. Настройка команд бота

### Шаг 5.1: Установите команды

Отправьте BotFather команду:
```
/setcommands
```

Выберите вашего бота и отправьте список команд:
```
start - Открыть CRM приложение
help - Справка по использованию
stats - Показать статистику
projects - Список проектов
tasks - Активные задачи
```

### Шаг 5.2: Установите меню кнопку

Отправьте:
```
/setmenubutton
```

Выберите бота и настройте:
- **Text**: "Открыть CRM"
- **URL**: `https://t.me/your_bot_name/app_short_name`

### Шаг 5.3: (Опционально) Inline режим

Если хотите, чтобы бот работал в любом чате:
```
/setinline
```

---

## 6. Тестирование

### Шаг 6.1: Откройте бота

1. Перейдите к вашему боту: `https://t.me/your_bot_name`
2. Нажмите **Start**
3. Нажмите на кнопку меню или команду `/start`
4. Должно открыться ваше Web App

### Шаг 6.2: Проверьте авторизацию

При открытии приложения должно произойти:
1. Автоматическое получение данных из Telegram
2. Авторизация на бэкенде
3. Создание или обновление пользователя в БД
4. Редирект на главную страницу (dashboard)

### Шаг 6.3: Проверьте функциональность

Протестируйте основные функции:
- ✅ Создание проекта
- ✅ Добавление задачи
- ✅ Создание клиента
- ✅ Добавление платежа
- ✅ Календарь с задачами

---

## 7. Troubleshooting

### Проблема: "Это приложение должно быть открыто внутри Telegram"

**Причина**: Приложение открыто не через Telegram.

**Решение**:
- Открывайте только через бота в Telegram
- Проверьте, что `window.Telegram.WebApp` доступен
- В development режиме установите `USE_MOCK_AUTH=true` для тестирования

### Проблема: "Invalid Telegram data"

**Причина**: Неверная валидация initData.

**Решение**:
1. Проверьте `TELEGRAM_BOT_TOKEN` в `.env`
2. Убедитесь, что токен правильный
3. Проверьте, что используется HTTPS
4. Очистите cookies и попробуйте снова

### Проблема: Приложение не загружается в Telegram

**Причина**: Проблемы с HTTPS или доступностью.

**Решение**:
1. Убедитесь, что URL использует HTTPS
2. Проверьте, что сервер доступен из интернета:
   ```bash
   curl https://your-domain.com
   ```
3. Проверьте SSL сертификат
4. Откройте URL в обычном браузере - должен работать

### Проблема: Database connection error

**Причина**: БД не доступна или неверный `DATABASE_URL`.

**Решение**:
1. Проверьте `DATABASE_URL` в переменных окружения
2. Убедитесь, что PostgreSQL запущен
3. Примените миграции:
   ```bash
   npx prisma migrate deploy
   ```

### Проблема: "Server configuration error"

**Причина**: Не установлен `TELEGRAM_BOT_TOKEN`.

**Решение**:
1. Проверьте `.env` файл
2. В production убедитесь, что переменные добавлены в платформе деплоя
3. Перезапустите приложение

---

## 📱 Как пользователи будут использовать приложение

### Для новых пользователей:

1. **Найти бота**: Поиск по имени `@your_bot_name`
2. **Запустить**: Нажать кнопку "Start"
3. **Открыть CRM**: Нажать кнопку "Открыть CRM" в меню
4. **Авторизация**: Происходит автоматически через Telegram
5. **Начать работу**: Приложение готово к использованию

### Быстрый доступ:

**Через меню бота:**
- Кнопка меню → "Открыть CRM"

**Через команды:**
- `/start` - открыть приложение
- `/projects` - открыть проекты
- `/tasks` - открыть задачи

**Прямая ссылка:**
```
https://t.me/your_bot_name/app_short_name
```

---

## 🔐 Безопасность

### Важные моменты:

1. ✅ **Никогда не делитесь токеном бота**
2. ✅ **Используйте только HTTPS в production**
3. ✅ **Генерируйте случайные секреты** (минимум 32 символа)
4. ✅ **Не загружайте `.env` в Git** (добавьте в `.gitignore`)
5. ✅ **Регулярно обновляйте зависимости**
6. ✅ **Включите rate limiting** (см. toFixed.md)

### Проверка безопасности:

```bash
# Проверьте .gitignore
cat .gitignore | grep .env

# Убедитесь, что .env не в Git
git status --ignored

# Проверьте переменные окружения
npm run type-check
```

---

## 📚 Полезные ссылки

- **Telegram Bot API**: https://core.telegram.org/bots/api
- **Telegram Web Apps**: https://core.telegram.org/bots/webapps
- **BotFather**: https://t.me/botfather
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs

---

## 🆘 Нужна помощь?

- **Telegram API Docs**: https://core.telegram.org/bots
- **GitHub Issues**: Создайте issue в репозитории
- **Telegram Support**: @BotSupport (для вопросов о ботах)

---

## ✅ Checklist перед запуском

- [ ] Бот создан через @BotFather
- [ ] Web App настроен с правильным URL (HTTPS)
- [ ] Все переменные окружения установлены
- [ ] База данных настроена и миграции применены
- [ ] Приложение задеплоено и доступно по HTTPS
- [ ] SSL сертификат валиден
- [ ] Команды бота настроены
- [ ] Кнопка меню настроена
- [ ] Тестовое открытие через Telegram работает
- [ ] Авторизация проходит успешно
- [ ] Основной функционал работает

**Готово! Ваш Telegram Mini App CRM запущен!** 🚀
