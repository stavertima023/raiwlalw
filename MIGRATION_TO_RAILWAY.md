# 🚂 Миграция с Vercel на Railway

## 📋 Обзор

Данная инструкция поможет вам перенести ваше Next.js приложение с Vercel на Railway. Railway предлагает более гибкую инфраструктуру и лучшую производительность для сложных приложений.

## 🎯 Преимущества Railway

- ✅ **Более гибкая инфраструктура**
- ✅ **Лучшая производительность**
- ✅ **Простая масштабируемость**
- ✅ **Интеграция с Supabase**
- ✅ **Более высокие лимиты для API**
- ✅ **Лучшая поддержка WebSocket**

---

## 📦 Подготовка к миграции

### 1. Обновление конфигурации Next.js

Сначала обновим `next.config.ts` для Railway:

```typescript
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/',
        permanent: true,
      },
    ]
  },
  // Обновляем для Railway
  experimental: {
    serverExternalPackages: ['@supabase/supabase-js'], // Исправлено
  },
  // Конфигурация для Railway
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
    }
    return config;
  },
  // Увеличиваем лимиты для Railway
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/json',
          },
          {
            key: 'X-Railway-Project',
            value: 'orderflow-factory',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

### 2. Обновление railway.json

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  },
  "environments": {
    "production": {
      "variables": {
        "NODE_ENV": "production",
        "NEXT_TELEMETRY_DISABLED": "1",
        "PORT": "3000"
      }
    }
  }
}
```

### 3. Создание Dockerfile (опционально)

Создайте `Dockerfile` для лучшего контроля над деплоем:

```dockerfile
# Используем официальный Node.js образ
FROM node:18-alpine AS base

# Устанавливаем зависимости только при необходимости
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Копируем файлы зависимостей
COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Сборка приложения
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Собираем приложение
RUN npm run build

# Продакшн образ
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Автоматически используем output standalone если доступно
RUN mkdir .next
RUN chown nextjs:nodejs .next

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

---

## 🚀 Пошаговая миграция

### Шаг 1: Подготовка аккаунта Railway

1. **Создайте аккаунт на Railway**
   - Перейдите на [railway.app](https://railway.app)
   - Зарегистрируйтесь через GitHub
   - Подтвердите email

2. **Создайте новый проект**
   - Нажмите "New Project"
   - Выберите "Deploy from GitHub repo"
   - Подключите ваш GitHub репозиторий

### Шаг 2: Настройка переменных окружения

В Railway Dashboard добавьте следующие переменные:

```bash
# Supabase
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

### Шаг 3: Настройка домена

1. **В Railway Dashboard:**
   - Перейдите в "Settings" → "Domains"
   - Добавьте ваш домен
   - Настройте DNS записи

2. **DNS настройки:**
   ```
   Type: CNAME
   Name: @
   Value: your-app.railway.app
   ```

### Шаг 4: Первый деплой

1. **Подключите репозиторий:**
   ```bash
   # В Railway Dashboard
   Settings → Git Repository → Connect Repository
   ```

2. **Настройте автоматический деплой:**
   - Включите "Auto Deploy"
   - Выберите ветку (обычно `main`)

3. **Запустите первый деплой:**
   ```bash
   # Railway автоматически запустит деплой
   # Или вручную через Dashboard
   ```

### Шаг 5: Проверка деплоя

1. **Проверьте логи:**
   ```bash
   # В Railway Dashboard
   Deployments → Latest → View Logs
   ```

2. **Проверьте health check:**
   - Откройте ваше приложение
   - Проверьте все основные функции

3. **Проверьте переменные окружения:**
   ```bash
   # В Railway Dashboard
   Variables → Проверьте все переменные
   ```

---

## 🔧 Настройка CI/CD

### GitHub Actions для Railway

Создайте `.github/workflows/railway-deploy.yml`:

```yaml
name: Deploy to Railway

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Deploy to Railway
      uses: railway/deploy@v1
      with:
        service: ${{ secrets.RAILWAY_SERVICE }}
        token: ${{ secrets.RAILWAY_TOKEN }}
```

### Настройка секретов

В GitHub репозитории добавьте секреты:

1. **RAILWAY_TOKEN** - токен из Railway Dashboard
2. **RAILWAY_SERVICE** - ID сервиса (обычно "web")

---

## 🔄 Миграция данных

### 1. Экспорт данных с Vercel

```bash
# Экспорт переменных окружения
vercel env pull .env.local

# Экспорт настроек домена
vercel domains ls
```

### 2. Импорт в Railway

```bash
# Импорт переменных окружения
# Скопируйте из .env.local в Railway Dashboard

# Настройка домена
# Добавьте в Railway Dashboard → Settings → Domains
```

---

## 🧪 Тестирование

### 1. Локальное тестирование

```bash
# Установите Railway CLI
npm install -g @railway/cli

# Логин в Railway
railway login

# Локальный деплой
railway up

# Просмотр логов
railway logs
```

### 2. Проверка функций

- ✅ **Авторизация**
- ✅ **Добавление заказов**
- ✅ **Просмотр заказов**
- ✅ **Работа с фото**
- ✅ **API endpoints**
- ✅ **Мобильная версия**

---

## 🚨 Решение проблем

### Проблема 1: Ошибка сборки

```bash
# Проверьте логи
railway logs

# Локальная сборка
npm run build

# Проверьте зависимости
npm ci
```

### Проблема 2: Переменные окружения

```bash
# Проверьте переменные в Railway
railway variables

# Установите переменную
railway variables set NODE_ENV=production
```

### Проблема 3: Порт не открывается

```bash
# Проверьте PORT в переменных
railway variables set PORT=3000

# Проверьте health check
curl https://your-app.railway.app/
```

### Проблема 4: Supabase подключение

```bash
# Проверьте URL и ключи
railway variables set NEXT_PUBLIC_SUPABASE_URL=your-url
railway variables set NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key
```

---

## 📊 Мониторинг

### 1. Railway Dashboard

- **Метрики:** CPU, Memory, Network
- **Логи:** Real-time logs
- **Деплойменты:** История деплоев

### 2. Внешний мониторинг

```bash
# Health check
curl -f https://your-app.railway.app/

# Performance monitoring
# Добавьте в приложение
```

---

## 🔄 Откат на Vercel

Если что-то пойдет не так:

1. **Сохраните Railway конфигурацию**
2. **Вернитесь к Vercel**
3. **Обновите переменные окружения**
4. **Переключите DNS обратно**

---

## ✅ Чек-лист миграции

- [ ] Обновлен `next.config.ts`
- [ ] Обновлен `railway.json`
- [ ] Создан аккаунт Railway
- [ ] Подключен GitHub репозиторий
- [ ] Настроены переменные окружения
- [ ] Настроен домен
- [ ] Протестирован первый деплой
- [ ] Проверены все функции
- [ ] Настроен CI/CD
- [ ] Настроен мониторинг
- [ ] Обновлена документация

---

## 🎉 Завершение

После успешной миграции:

1. **Обновите документацию**
2. **Уведомите команду**
3. **Настройте мониторинг**
4. **Планируйте оптимизации**

**Удачи с миграцией! 🚂✨** 