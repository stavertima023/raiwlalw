'use client';

import * as React from 'react';

interface MobileStabilityProps {
  children: React.ReactNode;
}

export const MobileStability: React.FC<MobileStabilityProps> = ({ children }) => {
  // В продакшене на мобильных отключаем всю логику, чтобы избежать самоперезапусков/рывков
  const isProd = typeof process !== 'undefined' && process.env.NODE_ENV === 'production';
  const isMobileUA = typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isProd && isMobileUA) {
    return <>{children}</>;
  }

  // В дев-режиме просто отображаем детей без вмешательства (индикатор не обязателен)
  return <>{children}</>;
}; 