# 🔧 Исправление Telegram Bot - Команды не работают

## Проблема
Команды бота (`/start`, `/help`, etc.) не работают.

## Причина
**Webhook не установлен!** Telegram не знает куда отправлять обновления от бота.

---

## ✅ Решение

### Шаг 1: Проверьте текущий статус

```bash
curl https://your-domain.com/api/telegram/setup
```

Или через браузер откройте: `https://your-domain.com/api/telegram/setup`

Вы увидите текущий статус webhook и бота.

---

### Шаг 2: Установите webhook

**Вариант A: Через API (рекомендуется)**

```bash
curl -X POST https://your-domain.com/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://your-domain.com"}'
```

**Вариант B: Через Postman/Insomnia**

- URL: `POST https://your-domain.com/api/telegram/setup`
- Body (JSON):
```json
{
  "webhookUrl": "https://your-domain.com"
}
```

**Вариант C: Напрямую через Telegram API**

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/telegram/webhook",
    "secret_token": "<YOUR_WEBHOOK_SECRET>",
    "allowed_updates": ["message", "callback_query"],
    "drop_pending_updates": true
  }'
```

Замените:
- `<YOUR_BOT_TOKEN>` - ваш токен от BotFather
- `<YOUR_WEBHOOK_SECRET>` - ваш TELEGRAM_WEBHOOK_SECRET
- `https://your-domain.com` - ваш домен

---

### Шаг 3: Проверьте установку

```bash
curl https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getWebhookInfo
```

Вы должны увидеть:
```json
{
  "ok": true,
  "result": {
    "url": "https://your-domain.com/api/telegram/webhook",
    "has_custom_certificate": false,
    "pending_update_count": 0,
    ...
  }
}
```

---

### Шаг 4: Протестируйте бота

1. Откройте бота в Telegram
2. Отправьте команду `/start`
3. Бот должен ответить приветственным сообщением

---

## 🔍 Диагностика проблем

### Проблема: "Webhook not set"

**Причина**: Webhook не установлен или был удален.

**Решение**: Выполните Шаг 2 выше.

---

### Проблема: "Invalid HTTPS certificate"

**Причина**: SSL сертификат невалиден или self-signed.

**Решение**: 
- Используйте валидный SSL сертификат (Let's Encrypt)
- Или используйте платформу с автоматическим SSL (Vercel, Netlify)

---

### Проблема: "ETIMEDOUT" или "Connection refused"

**Причина**: Сервер недоступен из интернета.

**Решение**:
- Убедитесь что сервер доступен по HTTPS
- Проверьте firewall настройки
- Убедитесь что порт открыт

---

### Проблема: "401 Unauthorized"

**Причина**: Неправильный secret token.

**Решение**:
- Проверьте `TELEGRAM_WEBHOOK_SECRET` в .env
- Убедитесь что тот же secret используется при установке webhook

---

### Проблема: Бот не отвечает на команды

**Проверьте логи:**

```bash
# Если используете Docker
docker-compose logs -f app

# Или проверьте логи Vercel/Railway
```

**Проверьте webhook endpoint:**

```bash
curl https://your-domain.com/api/telegram/webhook
```

Должен вернуть:
```json
{
  "status": "ok",
  "configured": {
    "botToken": true,
    "webhookSecret": true
  }
}
```

---

## 📝 Важные заметки

### ⚠️ Требования Telegram

1. **HTTPS обязателен** - Telegram webhook работает только с HTTPS
2. **Валидный SSL** - Сертификат должен быть доверенным
3. **Публичный доступ** - Сервер должен быть доступен из интернета
4. **Порт** - Используйте 443, 80, 88 или 8443

### 💡 Для development

Если вы разрабатываете локально, используйте:

**Вариант A: ngrok**
```bash
ngrok http 3000
# Получите HTTPS URL и используйте его для webhook
```

**Вариант B: localtunnel**
```bash
npx localtunnel --port 3000
```

**Вариант C: cloudflared**
```bash
cloudflared tunnel --url http://localhost:3000
```

---

## 🛠️ Полезные команды

### Проверить статус webhook
```bash
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo
```

### Установить webhook
```bash
curl -X POST https://your-domain.com/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://your-domain.com"}'
```

### Удалить webhook
```bash
curl -X DELETE https://your-domain.com/api/telegram/setup
```

Или напрямую:
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook?drop_pending_updates=true"
```

### Проверить бота
```bash
curl https://api.telegram.org/bot<TOKEN>/getMe
```

### Установить команды бота
```bash
curl -X POST "https://api.telegram.org/bot<TOKEN>/setMyCommands" \
  -H "Content-Type: application/json" \
  -d '{
    "commands": [
      {"command": "start", "description": "Начать работу с ботом"},
      {"command": "help", "description": "Помощь по использованию"},
      {"command": "status", "description": "Статус бота"},
      {"command": "stats", "description": "Статистика задач"}
    ]
  }'
```

---

## ✅ Checklist

После установки webhook проверьте:

- [ ] Webhook URL установлен правильно
- [ ] SSL сертификат валиден
- [ ] Secret token настроен
- [ ] Команды бота установлены
- [ ] Бот отвечает на `/start`
- [ ] Бот отвечает на `/help`
- [ ] Логи показывают входящие обновления

---

## 🎯 Быстрое решение

Если вы уже задеплоили приложение на HTTPS:

```bash
# 1. Установите webhook (замените your-domain.com)
curl -X POST https://your-domain.com/api/telegram/setup \
  -H "Content-Type: application/json" \
  -d '{"webhookUrl": "https://your-domain.com"}'

# 2. Проверьте статус
curl https://your-domain.com/api/telegram/setup

# 3. Протестируйте бота
# Откройте бота в Telegram и отправьте /start
```

**Готово!** Бот должен заработать.

---

## 📞 Если ничего не помогло

1. Проверьте логи сервера
2. Убедитесь что TELEGRAM_BOT_TOKEN правильный
3. Проверьте что endpoint `/api/telegram/webhook` доступен
4. Попробуйте удалить и установить webhook заново
5. Проверьте что нет других webhook установленных для этого бота

---

**После исправления бот будет работать нормально!** 🎉
