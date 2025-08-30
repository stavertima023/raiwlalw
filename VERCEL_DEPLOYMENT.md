# 🚀 Деплой на Vercel - Пошаговая инструкция

## 📋 Подготовка проекта

Проект уже подготовлен для деплоя на Vercel. Все необходимые файлы созданы и настроены.

## 🔑 Переменные окружения для Vercel

### Обязательные переменные:

#### 1. Основная база данных Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

#### 2. Хранилище фотографий (отдельный проект Supabase)
```
PHOTO_SUPABASE_URL=https://your-photo-project.supabase.co
PHOTO_SUPABASE_SERVICE_ROLE_KEY=your-photo-service-role-key
PHOTO_SUPABASE_BUCKET=order-photos
```

#### 3. Безопасность
```
SESSION_SECRET=your-super-secret-session-key-here
```

#### 4. AI аналитика
```
OPENAI_API_KEY=sk-proj-your-openai-key
```

### Опциональные переменные (если используете S3/MinIO):
```
S3_ENDPOINT=your-s3-endpoint
S3_REGION=your-s3-region
S3_BUCKET=your-s3-bucket
S3_ACCESS_KEY_ID=your-s3-access-key
S3_SECRET_ACCESS_KEY=your-s3-secret-key
S3_FORCE_PATH_STYLE=true
S3_PUBLIC_HOSTNAME=your-s3-public-hostname
S3_PUBLIC_PROTOCOL=https
```

## 🚀 Процесс деплоя

### Шаг 1: Подготовка репозитория
1. Убедитесь, что все изменения закоммичены в Git
2. Убедитесь, что репозиторий находится на GitHub

### Шаг 2: Создание проекта на Vercel
1. Перейдите на [vercel.com](https://vercel.com)
2. Войдите в аккаунт (через GitHub)
3. Нажмите "New Project"
4. Выберите ваш репозиторий `WebApp_TG`
5. Нажмите "Import"

### Шаг 3: Настройка проекта
1. **Framework Preset**: Next.js (должен определиться автоматически)
2. **Root Directory**: оставьте пустым (если проект в корне)
3. **Build Command**: `npm run build` (по умолчанию)
4. **Output Directory**: `.next` (по умолчанию)
5. **Install Command**: `npm install` (по умолчанию)

### Шаг 4: Настройка переменных окружения
1. В разделе "Environment Variables" добавьте все переменные из списка выше
2. **ВАЖНО**: Убедитесь, что `NEXT_PUBLIC_*` переменные помечены как "Production", "Preview" и "Development"
3. Остальные переменные помечайте только как "Production"

### Шаг 5: Деплой
1. Нажмите "Deploy"
2. Дождитесь завершения сборки (обычно 2-5 минут)
3. При успешном деплое вы получите URL вида: `https://your-project.vercel.app`

## 🔧 Настройка домена (опционально)

1. В настройках проекта перейдите в "Domains"
2. Добавьте ваш кастомный домен
3. Настройте DNS записи согласно инструкциям Vercel

## 📱 Обновление приложения

### Автоматический деплой:
- При каждом push в ветку `main` будет происходить автоматический деплой
- Vercel автоматически собирает и разворачивает новую версию

### Ручной деплой:
1. Войдите в Vercel Dashboard
2. Выберите ваш проект
3. Нажмите "Redeploy" на нужной версии

## 🐛 Отладка проблем

### Ошибки сборки:
1. Проверьте логи сборки в Vercel Dashboard
2. Убедитесь, что все переменные окружения установлены
3. Проверьте, что код компилируется локально (`npm run build`)

### Ошибки runtime:
1. Проверьте логи функций в Vercel Dashboard
2. Убедитесь, что Supabase доступен
3. Проверьте права доступа к базе данных

### Проблемы с изображениями:
1. Убедитесь, что `PHOTO_SUPABASE_URL` корректный
2. Проверьте, что bucket `order-photos` существует и доступен
3. Убедитесь, что CORS настроен правильно

## 📊 Мониторинг

1. **Analytics**: Включите в настройках проекта для отслеживания производительности
2. **Speed Insights**: Автоматический анализ скорости загрузки
3. **Logs**: Просмотр логов функций в реальном времени

## 🔒 Безопасность

1. Никогда не коммитьте `.env` файлы
2. Используйте сильные `SESSION_SECRET`
3. Ограничьте доступ к `SUPABASE_SERVICE_ROLE_KEY`
4. Регулярно обновляйте API ключи

## 📞 Поддержка

При возникновении проблем:
1. Проверьте [документацию Vercel](https://vercel.com/docs)
2. Обратитесь в [Vercel Support](https://vercel.com/support)
3. Проверьте [Next.js документацию](https://nextjs.org/docs)

---

**Успешного деплоя! 🎉**
