'use client';

import * as React from 'react';

interface MobileStabilityProps {
  children: React.ReactNode;
}

export const MobileStability: React.FC<MobileStabilityProps> = ({ children }) => {
  const [isStable, setIsStable] = React.useState(true);
  const lastActivityRef = React.useRef<number>(Date.now());

  React.useEffect(() => {
    // Обновляем активность пользователя (одноразовая регистрация обработчиков)
    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (!isStable) setIsStable(true);
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastActivityRef.current = Date.now();
        if (!isStable) setIsStable(true);
      }
    };

    const activityEvents = ['touchstart', 'touchmove', 'click', 'scroll'];
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Мягкая проверка стабильности раз в 30 секунд (без вмешательства в навигацию)
    const stabilityInterval = window.setInterval(() => {
      const idleMs = Date.now() - lastActivityRef.current;
      // Только для отладки меняем индикатор; никаких перезагрузок/блокировок
      if (idleMs > 120000) {
        setIsStable(false);
      }
    }, 30000);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity as any);
      });
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(stabilityInterval);
    };
  }, [isStable]);

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