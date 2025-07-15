# Деплой на Vercel

## Переменные окружения

Для успешного деплоя на Vercel необходимо настроить следующие переменные окружения в настройках проекта:

### 1. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
```

### 2. Session Secret
```
SESSION_SECRET=your-random-32-character-string-for-session-encryption
```

## Инструкция по настройке

1. Зайдите в настройки проекта на Vercel
2. Перейдите в раздел "Environment Variables"
3. Добавьте все переменные из списка выше
4. Запустите новый деплой

## Получение Supabase ключей

1. Зайдите в ваш проект на supabase.com
2. Перейдите в Settings → API
3. Скопируйте:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - anon/public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY`

## Генерация SESSION_SECRET

Выполните команду в терминале:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Или используйте онлайн генератор случайных строк для создания строки длиной 32+ символов.

## База данных

Убедитесь, что в Supabase настроены все необходимые таблицы согласно схеме в файле `docs/database-schema.sql`. 