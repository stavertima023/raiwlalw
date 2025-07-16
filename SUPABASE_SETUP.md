# 🚀 Настройка аналитики в Supabase

## 📋 Пошаговая инструкция

### 1. Откройте Supabase Dashboard
- Перейдите на [supabase.com](https://supabase.com)
- Войдите в свой проект
- Откройте раздел **SQL Editor**

### 2. Выполните SQL скрипт
- Скопируйте весь код из файла `sql/supabase_analytics_setup.sql`
- Вставьте в SQL Editor
- Нажмите **RUN** (или Ctrl/Cmd + Enter)

### 3. Инициализируйте данные
После успешного выполнения скрипта, запустите:

```sql
SELECT public.initialize_analytics(30);
```

Это загрузит аналитику за последние 30 дней.

### 4. Проверьте работу
Выполните проверочный запрос:

```sql
SELECT * FROM public.analytics_summary 
ORDER BY date DESC 
LIMIT 10;
```

## ✅ Что создается

### Таблицы:
- `analytics_orders_daily` - ежедневная аналитика заказов
- `analytics_expenses_daily` - ежедневная аналитика расходов

### Представления:
- `analytics_summary` - сводная аналитика с прибылью

### Функции:
- `update_orders_analytics(date)` - обновление аналитики заказов
- `update_expenses_analytics(date)` - обновление аналитики расходов
- `refresh_analytics(date)` - полное обновление
- `initialize_analytics(days)` - первоначальная загрузка

### Автоматизация:
- Триггеры автоматически обновляют аналитику при изменении заказов/расходов
- RLS политики ограничивают доступ только администраторам

## 🔧 Полезные команды

### Проверить количество записей:
```sql
SELECT 'orders' as table_name, COUNT(*) as count FROM public.analytics_orders_daily
UNION ALL
SELECT 'expenses' as table_name, COUNT(*) as count FROM public.analytics_expenses_daily;
```

### Обновить аналитику за конкретную дату:
```sql
SELECT public.refresh_analytics('2024-01-15');
```

### Посмотреть аналитику за текущий месяц:
```sql
SELECT 
    date,
    seller_name,
    total_orders,
    total_revenue,
    total_expenses,
    net_profit
FROM public.analytics_summary 
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
ORDER BY date DESC;
```

## ⚠️ Важные моменты

1. **Права доступа**: Только администраторы могут видеть и изменять аналитику
2. **Автообновление**: Данные обновляются автоматически при изменении заказов/расходов  
3. **Производительность**: Индексы оптимизируют запросы по датам и продавцам
4. **Безопасность**: Функции выполняются с правами SECURITY DEFINER

## 🚨 Если что-то пошло не так

### Ошибки при выполнении скрипта:
1. Проверьте, что таблицы `orders`, `expenses`, `users` существуют
2. Убедитесь, что у вас есть права администратора в Supabase
3. Попробуйте выполнить скрипт частями

### Данные не отображаются:
1. Проверьте, что пользователь имеет роль 'Администратор'
2. Убедитесь, что инициализация прошла успешно
3. Проверьте наличие данных в исходных таблицах

## 📞 Поддержка

Если возникли проблемы:
1. Проверьте логи в Supabase Dashboard
2. Убедитесь, что все зависимости установлены
3. Проверьте корректность имен полей в ваших таблицах 