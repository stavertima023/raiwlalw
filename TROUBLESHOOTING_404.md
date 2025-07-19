# Диагностика ошибки 404 "This page could not be found"

## 🚨 Проблема
Приложение не открывается и показывает ошибку 404 "This page could not be found".

## 🔍 Пошаговая диагностика

### 1. **Проверьте диагностическую страницу**
Откройте в браузере: `http://localhost:3000/debug` (или ваш домен + `/debug`)

Эта страница покажет:
- ✅ Состояние сессии
- ✅ Переменные окружения
- ✅ Доступность API
- ✅ Статус авторизации

### 2. **Проверьте API конфигурации**
Откройте: `http://localhost:3000/api/debug`

Должны быть установлены:
- ✅ `SESSION_SECRET`
- ✅ `SUPABASE_URL`
- ✅ `SUPABASE_ANON_KEY`
- ✅ `SUPABASE_SERVICE_ROLE_KEY`

### 3. **Проверьте логи сервера**
Запустите приложение и посмотрите на ошибки в консоли:

```bash
npm run dev
# или
yarn dev
```

### 4. **Проверьте переменные окружения**
Создайте файл `.env.local` в корне проекта:

```env
# Обязательные переменные
SESSION_SECRET=your-super-secret-key-here
NEXT_PUBLIC_SUPABASE_URL=https://kong-production-efec.up.railway.app
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxenl2bnN5anJmanljemJsYWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDE3OTIsImV4cCI6MjA2NzgxNzc5Mn0.2f1JGzeG2125XWE9McYbSXpI-_gDX_yVEO2BnzldITI
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxenl2bnN5anJmanljemJsYWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI0MTc5MiwiZXhwIjoyMDY3ODE3NzkyfQ.Tx2TojfWfkussv0sGRIQ8cvIPxUkTDm_FhUeFMkrSpI

# Опциональные переменные
NODE_ENV=development
VERCEL_ENV=development
```

### 5. **Проверьте структуру файлов**
Убедитесь, что все файлы на месте:

```
src/
├── app/
│   ├── page.tsx ✅
│   ├── layout.tsx ✅
│   ├── login/
│   │   └── page.tsx ✅
│   ├── debug/
│   │   └── page.tsx ✅
│   └── api/
│       ├── debug/
│       │   └── route.ts ✅
│       └── orders/
│           └── route.ts ✅
├── components/
│   ├── auth/
│   │   └── LoginForm.tsx ✅
│   └── dashboard/
│       └── DashboardRoot.tsx ✅
└── lib/
    ├── session.ts ✅
    ├── supabaseClient.ts ✅
    └── types.ts ✅
```

## 🛠️ Возможные решения

### **Решение 1: Проблемы с сессией**
Если на `/debug` показывается ошибка сессии:

1. Очистите куки браузера
2. Перезапустите сервер разработки
3. Проверьте `SESSION_SECRET` в переменных окружения

### **Решение 2: Проблемы с Supabase**
Если API `/api/debug` не отвечает:

1. Проверьте подключение к интернету
2. Убедитесь, что Supabase проект активен
3. Проверьте правильность ключей

### **Решение 3: Проблемы с роутингом**
Если страницы не загружаются:

1. Перезапустите сервер разработки
2. Очистите кэш Next.js: `rm -rf .next`
3. Переустановите зависимости: `npm install`

### **Решение 4: Проблемы с middleware**
Если middleware блокирует доступ:

1. Временно отключите middleware (закомментируйте в `src/middleware.ts`)
2. Проверьте логи на ошибки
3. Восстановите middleware после исправления

## 🔧 Команды для диагностики

### **Очистка и перезапуск:**
```bash
# Очистить кэш Next.js
rm -rf .next

# Очистить node_modules (если нужно)
rm -rf node_modules
npm install

# Перезапустить сервер
npm run dev
```

### **Проверка портов:**
```bash
# Проверить, что порт 3000 свободен
lsof -i :3000

# Убить процесс на порту (если нужно)
kill -9 $(lsof -t -i:3000)
```

### **Проверка переменных окружения:**
```bash
# Проверить переменные в терминале
echo $SESSION_SECRET
echo $NEXT_PUBLIC_SUPABASE_URL
```

## 📱 Тестирование на разных устройствах

### **Локальная разработка:**
1. Откройте `http://localhost:3000`
2. Проверьте `http://localhost:3000/debug`
3. Проверьте `http://localhost:3000/login`

### **Продакшн:**
1. Откройте ваш домен
2. Проверьте `ваш-домен/debug`
3. Проверьте `ваш-домен/login`

## 🚨 Критические проверки

### **Перед запуском убедитесь:**
- ✅ Node.js версии 18+ установлен
- ✅ Все зависимости установлены (`npm install`)
- ✅ Переменные окружения настроены
- ✅ Supabase проект активен
- ✅ Порт 3000 свободен

### **После запуска проверьте:**
- ✅ Сервер запустился без ошибок
- ✅ Страница `/debug` доступна
- ✅ API `/api/debug` отвечает
- ✅ Страница `/login` загружается
- ✅ Главная страница работает

## 📞 Если ничего не помогает

### **Соберите информацию:**
1. Скриншот страницы `/debug`
2. Логи из консоли браузера
3. Логи из терминала сервера
4. Версия Node.js: `node --version`
5. Версия npm: `npm --version`

### **Попробуйте альтернативные решения:**
1. Используйте другой браузер
2. Попробуйте режим инкогнито
3. Проверьте на другом устройстве
4. Перезагрузите роутер

## ✅ Ожидаемый результат

После исправления:
- ✅ Главная страница загружается
- ✅ Страница входа работает
- ✅ API отвечает корректно
- ✅ Сессия создается правильно
- ✅ Приложение работает стабильно

**Если проблема остается, используйте страницу `/debug` для получения подробной диагностической информации!** 