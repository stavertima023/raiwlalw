/**
 * Конфигурация сервера для увеличения лимитов
 */

export const serverConfig = {
  // Лимиты для API запросов
  api: {
    maxRequestBodySize: '10mb',
    maxResponseSize: '10mb',
    timeout: 60000, // 60 секунд
  },
  
  // Лимиты для изображений
  images: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxBase64Size: 3 * 1024 * 1024, // 3MB
    maxTotalPhotoSize: 8 * 1024 * 1024, // 8MB для всех фотографий
    maxReceiptPhotoSize: 5 * 1024 * 1024, // 5MB для фото чека
    compression: {
      maxWidth: 1200,
      quality: 0.7,
    },
  },
  
  // Лимиты для базы данных
  database: {
    maxQuerySize: 10 * 1024 * 1024, // 10MB
    timeout: 30000, // 30 секунд
  },
  
  // Настройки для Railway
  railway: {
    maxRequestSize: '10mb',
    maxResponseSize: '10mb',
    clientBodyBufferSize: '10mb',
    clientMaxBodySize: '10mb',
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
    isValid: sizeInMB <= 3 // 3MB лимит
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
    isValid: totalSizeInMB <= 8 // 8MB лимит для всех фотографий
  };
}; 