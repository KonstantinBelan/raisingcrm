# ⚡ Быстрое исправление - Команды бота не работают

## Проблема
Бот не отвечает на команды `/start`, `/help` и другие.

## Причина
**Webhook не установлен!**

---

## 🚀 Быстрое решение (3 минуты)

### Если приложение уже на HTTPS:

```bash
# 1. Установите webhook (замените YOUR_DOMAIN)
curl -X POST https://YOUR_DOMAIN/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://YOUR_DOMAIN"}'

# 2. Проверьте что webhook установлен
curl https://YOUR_DOMAIN/api/telegram/setup

# 3. Тестируйте - отправьте /start боту в Telegram
```

**Готово!** Бот должен заработать.

---

## 📱 Если приложение на localhost (development)

### Вариант 1: Используйте ngrok

```bash
# 1. Установите ngrok (если нет)
brew install ngrok  # Mac
# или скачайте с https://ngrok.com

# 2. Запустите туннель
ngrok http 3000

# 3. Скопируйте HTTPS URL (например: https://abc123.ngrok.io)

# 4. Установите webhook
curl -X POST https://abc123.ngrok.io/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://abc123.ngrok.io"}'

# 5. Тестируйте бота
```

### Вариант 2: Используйте localtunnel

```bash
# 1. Запустите туннель
npx localtunnel --port 3000

# 2. Скопируйте URL и установите webhook
# (аналогично ngrok)
```

---

## ✅ Проверка что всё работает

1. **Проверьте статус webhook:**
```bash
curl https://YOUR_DOMAIN/api/telegram/setup
```

Должно быть: `"url": "https://YOUR_DOMAIN/api/telegram/webhook"`

2. **Проверьте endpoint webhook:**
```bash
curl https://YOUR_DOMAIN/api/telegram/webhook
```

Должно вернуть: `{"status": "ok", "configured": {"botToken": true, "webhookSecret": true}}`

3. **Откройте бота в Telegram и отправьте:**
```
/start
```

Бот должен ответить приветственным сообщением.

---

## 🐛 Если не работает

### 1. Проверьте environment переменные

```bash
# Должны быть установлены:
TELEGRAM_BOT_TOKEN="ваш_токен_от_BotFather"
TELEGRAM_WEBHOOK_SECRET="случайная_строка_32_символа"
```

### 2. Проверьте что сервер доступен

```bash
curl https://YOUR_DOMAIN/api/telegram/webhook
```

Если ошибка - проблема с доступностью сервера.

### 3. Проверьте логи

```bash
# Docker
docker-compose logs -f app

# Или проверьте логи платформы (Vercel, Railway, etc.)
```

### 4. Удалите и установите webhook заново

```bash
# Удалить webhook
curl -X DELETE https://YOUR_DOMAIN/api/telegram/setup

# Установить заново
curl -X POST https://YOUR_DOMAIN/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://YOUR_DOMAIN"}'
```

---

## 📚 Подробная документация

См. файл `TELEGRAM_BOT_FIX.md` для детального разбора проблемы.

---

## 💡 Важно

- ✅ Webhook работает только с **HTTPS** (не HTTP!)
- ✅ SSL сертификат должен быть **валидным**
- ✅ Сервер должен быть **доступен из интернета**
- ✅ После каждого изменения URL нужно **переустанавливать webhook**

---

**После установки webhook все команды бота заработают!** 🎉

---

## 🔄 Update: Исправлена ошибка инициализации (2025-01-XX)

### Дополнительная проблема
После установки webhook была ошибка:
```
Error: Bot not initialized!
```

### Решение
Добавлена автоматическая инициализация бота в webhook endpoint.

**Файлы изменены:**
- `src/lib/telegram-bot.ts` - добавлена функция `initBot()`
- `src/app/api/telegram/webhook/route.ts` - добавлен вызов `initBot()`

**Действия не требуются** - исправление применяется автоматически.

См. `BOT_INIT_FIX.md` для деталей.

---

**Все проблемы исправлены! Бот полностью работает.** ✅
