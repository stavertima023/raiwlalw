/**
 * Конфигурация сервера для увеличения лимитов
 * Обновлено для предотвращения ошибок Kong
 */

export const serverConfig = {
  // Лимиты для API запросов
  api: {
    maxRequestBodySize: '15mb',
    maxResponseSize: '15mb',
    timeout: 90000, // 90 секунд
  },
  
  // Лимиты для изображений (обновлены для предотвращения ошибок Kong)
  images: {
    maxFileSize: 8 * 1024 * 1024, // 8MB
    maxBase64Size: 2 * 1024 * 1024, // 2MB (уменьшен для предотвращения ошибок Kong)
    maxTotalPhotoSize: 6 * 1024 * 1024, // 6MB для всех фотографий
    maxReceiptPhotoSize: 3 * 1024 * 1024, // 3MB для фото чека
    compression: {
      maxWidth: 800, // уменьшено с 1200
      quality: 0.6, // уменьшено с 0.7
      aggressiveCompression: {
        threshold: 512 * 1024, // 512KB - начало сжатия
        largeFileThreshold: 2 * 1024 * 1024, // 2MB - агрессивное сжатие
        veryLargeFileThreshold: 4 * 1024 * 1024, // 4MB - очень агрессивное сжатие
      },
    },
  },
  
  // Лимиты для базы данных
  database: {
    maxQuerySize: 15 * 1024 * 1024, // 15MB
    timeout: 60000, // 60 секунд
  },
  
  // Настройки для Railway (обновлены для предотвращения ошибок Kong)
  railway: {
    maxRequestSize: '15mb',
    maxResponseSize: '15mb',
    clientBodyBufferSize: '15mb',
    clientMaxBodySize: '15mb',
    kong: {
      clientBodyBufferSize: '15mb',
      clientMaxBodySize: '15mb',
      clientBodyTempPath: '/tmp/kong_client_body_temp',
    },
  },
};

/**
 * Проверяет размер base64 данных
 */
export const checkBase64Size = (base64Data: string): { size: number; sizeInMB: number; isValid: boolean } => {
  const size = Math.ceil((base64Data.length * 3) / 4);
  const sizeInMB = size / (1024 * 1024);
  
  return {
    size,
    sizeInMB,
    isValid: sizeInMB <= 2 // 2MB лимит (уменьшен для предотвращения ошибок Kong)
  };
};

/**
 * Проверяет общий размер массива base64 данных
 */
export const checkTotalBase64Size = (base64Array: string[]): { totalSize: number; totalSizeInMB: number; isValid: boolean } => {
  const totalSize = base64Array.reduce((total, base64Data) => {
    if (base64Data && typeof base64Data === 'string') {
      const data = base64Data.split(',')[1];
      if (data) {
        return total + Math.ceil((data.length * 3) / 4);
      }
    }
    return total;
  }, 0);
  
  const totalSizeInMB = totalSize / (1024 * 1024);
  
  return {
    totalSize,
    totalSizeInMB,
    isValid: totalSizeInMB <= 6 // 6MB лимит для всех фотографий (уменьшен)
  };
};

/**
 * Рекомендации по сжатию для предотвращения ошибок Kong
 */
export const getCompressionRecommendations = (fileSize: number) => {
  if (fileSize <= 512 * 1024) {
    return { compress: false, reason: 'Файл достаточно мал' };
  } else if (fileSize <= 2 * 1024 * 1024) {
    return { compress: true, quality: 0.6, maxWidth: 800, reason: 'Стандартное сжатие' };
  } else if (fileSize <= 4 * 1024 * 1024) {
    return { compress: true, quality: 0.5, maxWidth: 600, reason: 'Агрессивное сжатие' };
  } else {
    return { compress: true, quality: 0.4, maxWidth: 500, reason: 'Очень агрессивное сжатие' };
  }
}; 