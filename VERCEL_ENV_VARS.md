# 🔑 Переменные окружения для Vercel

## 📋 Полный список переменных

### 1. Основная база данных Supabase
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 2. Хранилище фотографий (отдельный проект Supabase)
```
PHOTO_SUPABASE_URL=https://your-photo-project.supabase.co
PHOTO_SUPABASE_SERVICE_ROLE_KEY=your-photo-service-role-key
PHOTO_SUPABASE_BUCKET=order-photos
```

### 3. Безопасность
```
SESSION_SECRET=your-super-secret-session-key-here
```

### 4. AI аналитика
```
OPENAI_API_KEY=sk-proj-your-openai-key
```

### 5. Опциональные S3/MinIO переменные
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

## ⚠️ Важные замечания

1. **NEXT_PUBLIC_*** переменные должны быть доступны в браузере
2. Остальные переменные только для сервера
3. Все переменные должны быть установлены в Vercel Dashboard
4. Убедитесь, что значения корректны и без лишних символов

## 🔗 Источники значений

- **Supabase**: Из вашего проекта Railway (accurate-flexibility)
- **Photo Storage**: Из отдельного Supabase проекта
- **SESSION_SECRET**: Сгенерируйте новый случайный ключ
- **OpenAI**: Из вашего аккаунта OpenAI
