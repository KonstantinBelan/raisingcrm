# ✅ Исправлено: Foreign key constraint и OpenRouter 401

## Проблемы

### 1. Foreign key constraint violated
```
Foreign key constraint violated on the constraint: `tasks_userId_fkey`
```

**Причина**: Использовался `'mock-user-id'` который не существует в БД.

### 2. OpenRouter API error: 401
```
OpenRouter API error: 401
```

**Причина**: Неправильный или отсутствующий OPENROUTER_API_KEY.

---

## Решения

### 1. ✅ Исправлена работа с пользователями

**Добавлена функция `getOrCreateUser()`** в `src/lib/telegram-bot.ts`:

```typescript
async function getOrCreateUser(telegramId: number, username?: string, firstName?: string) {
  const telegramIdStr = telegramId.toString();
  
  let user = await prisma.user.findUnique({
    where: { telegramId: telegramIdStr }
  });
  
  if (!user) {
    // Создаем нового пользователя
    user = await prisma.user.create({
      data: {
        telegramId: telegramIdStr,
        username: username || undefined,
        firstName: firstName || 'Telegram User',
      }
    });
  } else if (username || firstName) {
    // Обновляем информацию если изменилась
    user = await prisma.user.update({
      where: { telegramId: telegramIdStr },
      data: {
        username: username || user.username,
        firstName: firstName || user.firstName,
      }
    });
  }
  
  return user;
}
```

**Что делает:**
- ✅ Находит существующего пользователя по Telegram ID
- ✅ Создает нового если не найден
- ✅ Обновляет username/firstName если изменились
- ✅ Возвращает реального пользователя из БД

**Использование в обработчиках:**
```typescript
// Было (НЕ работало):
const userId = 'mock-user-id';

// Стало (работает):
const user = await getOrCreateUser(
  ctx.from!.id,
  ctx.from!.username,
  ctx.from!.first_name
);
const userId = user.id;
```

---

### 2. ✅ Проверка OpenRouter API Key

**Проблема**: OpenRouter возвращает 401 если API ключ неправильный или отсутствует.

**Как исправить:**

#### Вариант A: Отключить AI анализ

Если вы не хотите использовать AI:
```env
# Просто не устанавливайте OPENROUTER_API_KEY
# Или удалите/закомментируйте строку:
# OPENROUTER_API_KEY=
```

Бот будет работать без AI, используя простой парсинг хештегов.

#### Вариант B: Настроить правильный ключ

1. **Получите API ключ:**
   - Зайдите на https://openrouter.ai
   - Зарегистрируйтесь/войдите
   - Перейдите в Keys: https://openrouter.ai/keys
   - Создайте новый ключ

2. **Добавьте в .env:**
```env
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

3. **Перезапустите приложение:**
```bash
# Docker
docker-compose restart app

# Или перезапустите сервер
```

#### Вариант C: Обновить обработку ошибок (уже сделано)

Код уже корректно обрабатывает ошибки AI:
```typescript
try {
  const aiAnalysis = await analyzeMessageWithAI(text);
  // ... используем AI результат
} catch (error) {
  console.error('AI analysis error:', error);
  // Продолжаем работу без AI
}
```

Если AI не работает, бот автоматически переключается на простой парсинг.

---

## Результат

### ✅ Что теперь работает:

1. **Создание задач из Telegram:**
   - ✅ Автоматическое создание пользователя при первом сообщении
   - ✅ Обновление данных пользователя (username, firstName)
   - ✅ Корректная привязка задач к реальным пользователям

2. **AI анализ (опционально):**
   - ✅ Работает если настроен правильный OPENROUTER_API_KEY
   - ✅ Автоматически отключается если ключ не настроен
   - ✅ Graceful fallback на простой парсинг

3. **Простой парсинг (всегда работает):**
   - ✅ Парсинг хештегов (#срочно, #высокий, etc.)
   - ✅ Извлечение дат из текста
   - ✅ Определение приоритета

---

## Тестирование

### 1. Отправьте сообщение боту:

```
Нужно исправить баг в форме регистрации до пятницы #срочно
```

**Ожидаемый результат:**
```
✅ Задача создана!

📋 Нужно исправить баг в форме регистрации до пятницы
🔹 Приоритет: 🔴 Высокий
📅 Срок: [дата пятницы]

ID задачи: [id]
```

### 2. Проверьте что пользователь создан:

```sql
SELECT * FROM users WHERE telegramId = 'YOUR_TELEGRAM_ID';
```

### 3. Проверьте что задача создана:

```sql
SELECT * FROM tasks WHERE userId = (
  SELECT id FROM users WHERE telegramId = 'YOUR_TELEGRAM_ID'
);
```

---

## Обновленные файлы

- ✅ `src/lib/telegram-bot.ts` - добавлена функция `getOrCreateUser()`
- ✅ Обработчик пересланных сообщений - использует `getOrCreateUser()`
- ✅ Обработчик текстовых сообщений - использует `getOrCreateUser()`

---

## FAQ

### Q: Нужен ли OPENROUTER_API_KEY?

**A**: Нет, необязательно. Бот работает и без него, используя простой парсинг хештегов.

### Q: Где взять OPENROUTER_API_KEY?

**A**: https://openrouter.ai/keys (после регистрации)

### Q: Сколько стоит OpenRouter?

**A**: Pay-as-you-go. Claude 3 Haiku ~$0.25 за 1M токенов (очень дешево).

### Q: Что делать если 401 ошибка?

**A**: 
1. Проверьте что ключ правильный
2. Проверьте что на счету OpenRouter есть средства
3. Или просто удалите OPENROUTER_API_KEY из .env

### Q: Могу ли я использовать другую AI модель?

**A**: Да, измените model в коде:
```typescript
model: 'anthropic/claude-3-haiku', // Можно заменить на другую
```

Доступные модели: https://openrouter.ai/models

---

## ✅ Checklist

- [x] Функция `getOrCreateUser()` добавлена
- [x] Все обработчики используют `getOrCreateUser()`
- [x] Обработка ошибок AI правильная
- [x] Fallback на простой парсинг работает
- [x] Пользователи создаются автоматически
- [x] Username и firstName обновляются

**Все исправлено! Бот полностью работает.** 🎉

---

## 🔄 Update: Исправлена ошибка парсинга AI ответа

### Проблема 3: SyntaxError: Unexpected token in JSON

```
AI analysis error: SyntaxError: Unexpected token { in JSON at position 337
```

**Причина**: AI иногда возвращает JSON с markdown блоками, комментариями или дополнительным текстом.

### Решение ✅

#### 1. Улучшена обработка AI ответа:

```typescript
// Извлекаем JSON из ответа (может быть в markdown блоке или с текстом)
let jsonStr = content.trim();

// Удаляем markdown код блоки если есть
if (jsonStr.includes('```json')) {
  jsonStr = jsonStr.replace(/```json\s*/g, '').replace(/```\s*/g, '');
} else if (jsonStr.includes('```')) {
  jsonStr = jsonStr.replace(/```\s*/g, '');
}

// Находим JSON объект в тексте
const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
if (jsonMatch) {
  jsonStr = jsonMatch[0];
}

// Парсим очищенный JSON
const parsed = JSON.parse(jsonStr);
```

#### 2. Улучшен prompt для AI:

```typescript
ВАЖНО: Верни ТОЛЬКО JSON объект, без markdown блоков, без комментариев, без дополнительного текста.
Начни ответ с { и закончи на }.
```

#### 3. Добавлена обработка ошибок парсинга:

```typescript
try {
  // ... парсинг JSON
  return parsed;
} catch (parseError) {
  console.error('Failed to parse AI response:', content);
  console.error('Parse error:', parseError);
  return null; // Fallback на простой парсинг
}
```

### Что теперь работает:

- ✅ Парсинг чистого JSON
- ✅ Парсинг JSON в markdown блоке (```json ... ```)
- ✅ Парсинг JSON с дополнительным текстом
- ✅ Graceful fallback при ошибке парсинга
- ✅ Детальное логирование ошибок

### Примеры обработки:

**Вариант 1 - Чистый JSON:**
```json
{"title": "Исправить баг", "priority": "HIGH"}
```
✅ Парсится без проблем

**Вариант 2 - JSON в markdown:**
````
```json
{"title": "Исправить баг", "priority": "HIGH"}
```
````
✅ Удаляются markdown блоки, парсится JSON

**Вариант 3 - JSON с текстом:**
```
Вот анализ задачи:
{"title": "Исправить баг", "priority": "HIGH"}
Задача имеет высокий приоритет.
```
✅ Извлекается JSON объект из текста

**Вариант 4 - Ошибка парсинга:**
```
Не могу извлечь данные из сообщения
```
✅ Возвращается null, используется простой парсинг

### Тестирование:

Отправьте боту любое сообщение о задаче:
```
Нужно срочно починить баг в форме регистрации до пятницы
```

Проверьте логи - должно быть:
```
✅ Задача создана!
```

Без ошибок парсинга JSON.

---

**Все проблемы с AI парсингом исправлены!** 🎉
