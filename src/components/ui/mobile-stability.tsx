'use client';

import * as React from 'react';

interface MobileStabilityProps {
  children: React.ReactNode;
}

export const MobileStability: React.FC<MobileStabilityProps> = ({ children }) => {
  const [isStable, setIsStable] = React.useState(true);
  const [lastActivity, setLastActivity] = React.useState(Date.now());

  React.useEffect(() => {
    // Отслеживаем активность пользователя
    const updateActivity = () => {
      setLastActivity(Date.now());
      setIsStable(true);
    };

    // Предотвращаем перезагрузки
    const preventReload = (e: Event) => {
      if (e.type === 'beforeunload') {
        console.log('🛡️ Попытка перезагрузки предотвращена');
        e.preventDefault();
        return '';
      }
    };

    // Обработчики активности
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    // Обработчики стабильности
    window.addEventListener('beforeunload', preventReload);
    window.addEventListener('pagehide', () => console.log('📱 Страница скрыта'));
    window.addEventListener('pageshow', () => console.log('📱 Страница показана'));

    // Проверка стабильности каждые 5 секунд
    const stabilityInterval = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivity;
      if (timeSinceActivity > 30000) { // 30 секунд бездействия
        setIsStable(false);
      }
    }, 5000);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      window.removeEventListener('beforeunload', preventReload);
      window.removeEventListener('pagehide', () => {});
      window.removeEventListener('pageshow', () => {});
      clearInterval(stabilityInterval);
    };
  }, [lastActivity]);

  // Показываем индикатор стабильности в режиме разработки
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className="relative">
        {children}
        <div 
          className={`fixed top-4 right-4 w-3 h-3 rounded-full z-50 ${
            isStable ? 'bg-green-500' : 'bg-red-500'
          }`}
          title={`Стабильность: ${isStable ? 'Стабильно' : 'Нестабильно'}`}
        />
      </div>
    );
  }

  return <>{children}</>;
}; 