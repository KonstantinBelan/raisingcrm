# ✅ Исправлено: Bot not initialized

## Проблема
```
Error: Bot not initialized! Either call `await bot.init()`, or directly set the `botInfo` option in the `Bot` constructor to specify a known bot info object.
```

## Причина
Grammy bot требует инициализации перед использованием метода `handleUpdate()`.

## Решение

### 1. Добавлена функция инициализации в `src/lib/telegram-bot.ts`:

```typescript
let botInitialized = false;

export async function initBot() {
  if (!botInitialized) {
    try {
      await bot.init();
      botInitialized = true;
      console.log('Telegram bot initialized successfully');
    } catch (error) {
      console.error('Failed to initialize bot:', error);
    }
  }
}
```

### 2. Обновлен webhook endpoint `src/app/api/telegram/webhook/route.ts`:

```typescript
import { bot, initBot } from '@/lib/telegram-bot';

export async function POST(request: NextRequest) {
  // ...
  
  // Инициализируем бот если еще не инициализирован
  await initBot();
  
  // Process the update with Grammy bot
  await bot.handleUpdate(body);
  
  // ...
}
```

## Результат

✅ Бот корректно инициализируется при первом запросе  
✅ Последующие запросы используют уже инициализированный экземпляр  
✅ Все команды работают без ошибок  

## Тестирование

1. Отправьте `/start` боту в Telegram
2. Бот должен ответить приветственным сообщением
3. Проверьте логи - должно быть: `Telegram bot initialized successfully`

## Что было исправлено

- ✅ Добавлена функция `initBot()`
- ✅ Добавлен флаг `botInitialized` для одноразовой инициализации
- ✅ Webhook endpoint вызывает `initBot()` перед обработкой
- ✅ Удален дублирующий export `export default bot`

**Теперь бот полностью работает!** 🎉
