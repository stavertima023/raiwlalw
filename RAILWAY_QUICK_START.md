# 🚂 Быстрый старт на Railway

## ⚡ Экспресс-миграция с Vercel

### 1. Подготовка (5 минут)

✅ **Файлы уже готовы:**
- `railway.json` - конфигурация Railway
- `Dockerfile` - для Docker деплоя
- `next.config.ts` - обновлен для Railway
- `.github/workflows/railway-deploy.yml` - CI/CD

### 2. Создание аккаунта Railway (2 минуты)

1. Перейдите на [railway.app](https://railway.app)
2. Войдите через GitHub
3. Подтвердите email

### 3. Создание проекта (3 минуты)

1. Нажмите **"New Project"**
2. Выберите **"Deploy from GitHub repo"**
3. Подключите ваш репозиторий `WebApp_TG`
4. Выберите ветку `main`

### 4. Настройка переменных окружения (5 минут)

В Railway Dashboard → Variables добавьте:

```bash
# Supabase (скопируйте с Vercel)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Session
SESSION_SECRET=your-session-secret

# Environment
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
PORT=3000

# AI (если используется)
GOOGLE_AI_API_KEY=your-google-ai-key
```

### 5. Первый деплой (автоматически)

Railway автоматически:
- ✅ Скачает код
- ✅ Установит зависимости
- ✅ Соберет приложение
- ✅ Запустит на порту 3000

### 6. Настройка домена (5 минут)

1. В Railway Dashboard → Settings → Domains
2. Добавьте ваш домен
3. Настройте DNS записи:

```
Type: CNAME
Name: @
Value: your-app.railway.app
```

### 7. Проверка (2 минуты)

- ✅ Откройте приложение
- ✅ Проверьте авторизацию
- ✅ Проверьте добавление заказов
- ✅ Проверьте мобильную версию

---

## 🔧 Настройка CI/CD

### GitHub Secrets

В вашем GitHub репозитории добавьте:

1. **RAILWAY_TOKEN** - из Railway Dashboard → Account → Tokens
2. **RAILWAY_SERVICE** - ID сервиса (обычно "web")

### Автоматический деплой

После настройки секретов, каждый push в `main` будет автоматически деплоить на Railway.

---

## 🚨 Частые проблемы

### Проблема: Ошибка сборки
```bash
# Проверьте логи в Railway Dashboard
# Убедитесь что все переменные окружения установлены
```

### Проблема: Не подключается к Supabase
```bash
# Проверьте переменные Supabase в Railway
# Убедитесь что URL и ключи правильные
```

### Проблема: Порт не открывается
```bash
# Убедитесь что PORT=3000 установлен
# Проверьте health check в railway.json
```

---

## 📊 Мониторинг

### Railway Dashboard
- **Метрики:** CPU, Memory, Network
- **Логи:** Real-time logs
- **Деплойменты:** История деплоев

### Health Check
```bash
curl https://your-app.railway.app/
```

---

## 🎯 Преимущества Railway

- ✅ **Более высокая производительность**
- ✅ **Лучшая поддержка API лимитов**
- ✅ **Простая масштабируемость**
- ✅ **Интеграция с Supabase**
- ✅ **Более гибкая инфраструктура**

---

## ✅ Готово!

Ваше приложение теперь работает на Railway! 🚂✨

**Следующие шаги:**
1. Настройте мониторинг
2. Оптимизируйте производительность
3. Настройте резервное копирование 