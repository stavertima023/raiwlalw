import { getSession } from '@/lib/session';

export default async function DebugPage() {
  let session;
  let sessionError;
  
  try {
    session = await getSession();
  } catch (error) {
    sessionError = error;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Диагностика приложения</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Состояние сессии</h2>
          {sessionError ? (
            <div className="text-red-600">
              <p><strong>Ошибка сессии:</strong></p>
              <pre className="mt-2 p-2 bg-red-50 rounded text-sm overflow-auto">
                {JSON.stringify(sessionError, null, 2)}
              </pre>
            </div>
          ) : (
            <div className="text-green-600">
              <p><strong>Сессия загружена успешно</strong></p>
              <pre className="mt-2 p-2 bg-green-50 rounded text-sm overflow-auto">
                {JSON.stringify(session, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Переменные окружения</h2>
          <div className="space-y-2">
            <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
            <p><strong>VERCEL_ENV:</strong> {process.env.VERCEL_ENV}</p>
            <p><strong>SESSION_SECRET:</strong> {process.env.SESSION_SECRET ? 'Установлен' : 'Не установлен'}</p>
            <p><strong>SUPABASE_URL:</strong> {process.env.SUPABASE_URL ? 'Установлен' : 'Не установлен'}</p>
            <p><strong>SUPABASE_ANON_KEY:</strong> {process.env.SUPABASE_ANON_KEY ? 'Установлен' : 'Не установлен'}</p>
            <p><strong>SUPABASE_SERVICE_ROLE_KEY:</strong> {process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Установлен' : 'Не установлен'}</p>
          </div>
        </div>

        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Ссылки</h2>
          <div className="space-y-2">
            <a href="/" className="block text-blue-600 hover:underline">Главная страница</a>
            <a href="/login" className="block text-blue-600 hover:underline">Страница входа</a>
            <a href="/admin" className="block text-blue-600 hover:underline">Админ панель</a>
            <a href="/api/orders" className="block text-blue-600 hover:underline">API заказов</a>
          </div>
        </div>

        {session?.isLoggedIn && session?.user ? (
          <div className="bg-green-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Пользователь авторизован</h2>
            <p><strong>Имя:</strong> {session.user.name}</p>
            <p><strong>Роль:</strong> {session.user.role}</p>
            <p><strong>Username:</strong> {session.user.username}</p>
            <a href="/" className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Перейти в приложение
            </a>
          </div>
        ) : (
          <div className="bg-yellow-100 p-4 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Пользователь не авторизован</h2>
            <a href="/login" className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Войти в систему
            </a>
          </div>
        )}
      </div>
    </div>
  );
} 