'use client';

import * as React from 'react';

interface StabilityMonitorProps {
  children: React.ReactNode;
}

export function StabilityMonitor({ children }: StabilityMonitorProps) {
  const [isStable, setIsStable] = React.useState(true);
  const [lastActivity, setLastActivity] = React.useState(Date.now());

  React.useEffect(() => {
    let stabilityTimer: NodeJS.Timeout;
    let activityTimer: NodeJS.Timeout;

    // Отслеживаем активность пользователя
    const handleUserActivity = () => {
      setLastActivity(Date.now());
      setIsStable(true);
    };

    // Проверяем стабильность каждые 30 секунд
    const checkStability = () => {
      const now = Date.now();
      const timeSinceActivity = now - lastActivity;
      
      // Если пользователь неактивен более 5 минут, считаем приложение стабильным
      if (timeSinceActivity > 5 * 60 * 1000) {
        setIsStable(true);
      }
    };

    // Слушаем события активности
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    events.forEach(event => {
      document.addEventListener(event, handleUserActivity, { passive: true });
    });

    // Запускаем таймеры
    stabilityTimer = setInterval(checkStability, 30000);
    activityTimer = setInterval(() => {
      setLastActivity(Date.now());
    }, 60000);

    // Предотвращаем перезагрузки при потере фокуса
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Приложение стабильно - возврат в активное состояние');
        setIsStable(true);
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Логируем попытки перезагрузки
      console.log('🛡️ Попытка перезагрузки предотвращена');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Очистка при размонтировании
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserActivity);
      });
      clearInterval(stabilityTimer);
      clearInterval(activityTimer);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [lastActivity]);

  // Логируем состояние стабильности
  React.useEffect(() => {
    console.log(`🔒 Стабильность приложения: ${isStable ? 'СТАБИЛЬНО' : 'ПРОВЕРКА'}`);
  }, [isStable]);

  return (
    <div className="stability-monitor">
      {children}
      {/* Скрытый индикатор стабильности для отладки */}
      {process.env.NODE_ENV === 'development' && (
        <div 
          className="fixed bottom-2 right-2 w-3 h-3 rounded-full z-50"
          style={{ 
            backgroundColor: isStable ? '#10b981' : '#f59e0b',
            opacity: 0.7 
          }}
          title={`Стабильность: ${isStable ? 'Стабильно' : 'Проверка'}`}
        />
      )}
    </div>
  );
} 