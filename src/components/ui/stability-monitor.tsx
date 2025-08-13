'use client';

import * as React from 'react';

interface StabilityMonitorProps {
  children: React.ReactNode;
}

export function StabilityMonitor({ children }: StabilityMonitorProps) {
  // В продакшене вообще не вмешиваемся, чтобы не провоцировать перезапуски
  return <>{children}</>;
}