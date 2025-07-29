#!/usr/bin/env node

/**
 * Скрипт для проверки подключения к Railway и базе данных
 * Запуск: node scripts/check-railway-connection.js
 */

const { createClient } = require('@supabase/supabase-js');

// Получаем переменные окружения
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Проверка подключения к Railway и Supabase...\n');

// Проверяем наличие переменных окружения
console.log('📋 Проверка переменных окружения:');
console.log(`✅ NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'Установлен' : '❌ Отсутствует'}`);
console.log(`✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: ${supabaseAnonKey ? 'Установлен' : '❌ Отсутствует'}`);
console.log(`✅ SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Установлен' : '❌ Отсутствует'}`);

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.log('\n❌ Не все переменные окружения установлены!');
  console.log('Проверьте настройки в Railway Dashboard → Variables');
  process.exit(1);
}

// Создаем клиент Supabase
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function checkConnection() {
  try {
    console.log('\n🔌 Проверка подключения к Supabase...');
    
    // Проверяем подключение через анонимный ключ
    const { data: publicData, error: publicError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (publicError) {
      console.log(`❌ Ошибка подключения (анонимный ключ): ${publicError.message}`);
    } else {
      console.log('✅ Подключение через анонимный ключ успешно');
    }
    
    // Проверяем подключение через сервисный ключ
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    if (adminError) {
      console.log(`❌ Ошибка подключения (сервисный ключ): ${adminError.message}`);
    } else {
      console.log('✅ Подключение через сервисный ключ успешно');
    }
    
    // Проверяем основные таблицы
    console.log('\n📊 Проверка таблиц базы данных:');
    
    const tables = ['users', 'orders', 'expenses', 'payouts'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Таблица ${table}: ${error.message}`);
        } else {
          console.log(`✅ Таблица ${table}: доступна`);
        }
      } catch (err) {
        console.log(`❌ Таблица ${table}: ${err.message}`);
      }
    }
    
    // Проверяем Railway переменные
    console.log('\n🚂 Проверка Railway переменных:');
    console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'не установлен'}`);
    console.log(`✅ PORT: ${process.env.PORT || 'не установлен'}`);
    console.log(`✅ NEXT_TELEMETRY_DISABLED: ${process.env.NEXT_TELEMETRY_DISABLED || 'не установлен'}`);
    
    // Проверяем доступность приложения
    console.log('\n🌐 Проверка доступности приложения:');
    const port = process.env.PORT || 3000;
    console.log(`✅ Приложение должно быть доступно на порту: ${port}`);
    
    console.log('\n🎉 Все проверки завершены!');
    console.log('\n📝 Рекомендации:');
    console.log('1. Убедитесь что все переменные окружения установлены в Railway');
    console.log('2. Проверьте логи приложения в Railway Dashboard');
    console.log('3. Убедитесь что домен настроен правильно');
    console.log('4. Проверьте health check в настройках сервиса');
    
  } catch (error) {
    console.error('\n❌ Критическая ошибка:', error.message);
    process.exit(1);
  }
}

// Запускаем проверку
checkConnection(); 