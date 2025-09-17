# PWA Setup Guide

## Обзор

Raising CRM настроен как Progressive Web App (PWA) для обеспечения нативного опыта использования на мобильных устройствах и десктопе.

## Возможности PWA

### ✅ Реализованные функции

1. **Установка приложения**
   - Автоматическое предложение установки
   - Поддержка всех современных браузеров
   - Кастомный UI для установки

2. **Офлайн работа**
   - Кэширование ресурсов
   - Индикатор статуса подключения
   - Стратегия NetworkFirst для API запросов

3. **Нативный интерфейс**
   - Полноэкранный режим (standalone)
   - Кастомная тема и иконки
   - Splash screen при запуске

4. **Быстрые действия**
   - Shortcuts для основных функций
   - Контекстное меню приложения

## Структура файлов

### Манифест (`/public/manifest.json`)
```json
{
  "name": "Raising CRM",
  "short_name": "Raising CRM",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3b82f6",
  "background_color": "#ffffff"
}
```

### Service Worker
Автоматически генерируется `next-pwa` с настройками:
- Кэширование статических ресурсов
- NetworkFirst стратегия для API
- Автоматическое обновление

### Компоненты PWA

#### InstallPrompt (`/src/components/pwa/InstallPrompt.tsx`)
- Умное предложение установки
- Обработка событий beforeinstallprompt
- Локальное сохранение предпочтений пользователя

#### OfflineIndicator (`/src/components/pwa/OfflineIndicator.tsx`)
- Индикатор статуса подключения
- Уведомления о переходе в офлайн/онлайн
- Hook для проверки статуса сети

## Иконки и ресурсы

### Требуемые иконки (в `/public/icons/`)
```
icon-72x72.png     - Android Chrome
icon-96x96.png     - Android Chrome
icon-128x128.png   - Android Chrome
icon-144x144.png   - Android Chrome
icon-152x152.png   - iOS Safari
icon-192x192.png   - Android Chrome (основная)
icon-384x384.png   - Android Chrome
icon-512x512.png   - Android Chrome (высокое разрешение)
```

### Shortcuts иконки
```
shortcut-project.png   - Новый проект
shortcut-task.png      - Новая задача
shortcut-kanban.png    - Kanban доска
shortcut-analytics.png - Аналитика
```

## Конфигурация Next.js

### next.config.mjs
```javascript
import withPWA from 'next-pwa';

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'offlineCache',
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
})(nextConfig);
```

### Layout мета-теги
```typescript
export const metadata: Metadata = {
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Raising CRM",
  },
  themeColor: "#3b82f6",
};
```

## Тестирование PWA

### Chrome DevTools
1. Откройте DevTools (F12)
2. Перейдите в Application → Manifest
3. Проверьте корректность манифеста
4. Тестируйте установку через Application → Service Workers

### Lighthouse Audit
```bash
# Запустите Lighthouse для проверки PWA
npx lighthouse http://localhost:3000 --view
```

### Критерии PWA
- ✅ Служит через HTTPS
- ✅ Имеет веб-манифест
- ✅ Регистрирует service worker
- ✅ Адаптивный дизайн
- ✅ Быстрая загрузка

## Развертывание

### Production настройки
```bash
# Сборка с PWA
npm run build

# Проверка сгенерированных файлов
ls public/sw.js
ls public/workbox-*.js
```

### HTTPS требования
PWA требует HTTPS в production:
- Настройте SSL сертификат
- Используйте CDN с HTTPS
- Локально работает через localhost

## Мониторинг и аналитика

### Service Worker события
```javascript
// Отслеживание установки
navigator.serviceWorker.addEventListener('controllerchange', () => {
  console.log('Service Worker updated');
});

// Отслеживание офлайн/онлайн
window.addEventListener('online', () => {
  console.log('Back online');
});
```

### Метрики PWA
- Время до первого отображения (FCP)
- Время до интерактивности (TTI)
- Процент офлайн использования
- Коэффициент установки

## Troubleshooting

### Частые проблемы

**1. Service Worker не регистрируется**
```bash
# Проверьте консоль браузера
# Убедитесь что HTTPS включен в production
```

**2. Манифест не загружается**
```bash
# Проверьте путь к manifest.json
# Убедитесь что файл доступен по /manifest.json
```

**3. Иконки не отображаются**
```bash
# Проверьте пути к иконкам в манифесте
# Убедитесь что файлы существуют в /public/icons/
```

**4. Кэширование не работает**
```bash
# Очистите кэш браузера
# Проверьте Network tab в DevTools
# Убедитесь что service worker активен
```

## Лучшие практики

### Производительность
1. **Оптимизируйте иконки** - используйте WebP формат
2. **Минимизируйте кэш** - кэшируйте только необходимое
3. **Lazy loading** - загружайте контент по требованию

### UX
1. **Информируйте пользователя** о статусе установки
2. **Показывайте офлайн состояние** четко
3. **Предоставляйте фоллбэки** для офлайн функций

### Безопасность
1. **Используйте HTTPS** везде
2. **Валидируйте кэшированные данные**
3. **Обновляйте service worker** регулярно

## Будущие улучшения

### Планируемые функции
- [ ] Push уведомления
- [ ] Background sync
- [ ] Периодическая синхронизация
- [ ] Web Share API
- [ ] File System Access API

### Интеграция с Telegram
- [ ] Telegram WebApp API для PWA
- [ ] Синхронизация с Telegram ботом
- [ ] Уведомления через Telegram

## Ресурсы

- [PWA Builder](https://www.pwabuilder.com/)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Next.js PWA Plugin](https://github.com/shadowwalker/next-pwa)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
