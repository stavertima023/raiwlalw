/**
 * Утилиты для безопасной обработки изображений
 * Специально оптимизированы для iOS и Android устройств
 */

export interface ImageProcessingResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

/**
 * Определяет тип устройства для специальной обработки
 */
export const getDeviceType = (): 'ios' | 'android' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = window.navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else {
    return 'desktop';
  }
};

/**
 * Сжимает изображение до указанного качества и размера
 * Более агрессивное сжатие для предотвращения ошибок Kong
 * Специальная поддержка для Android
 */
export const compressImage = (file: File, maxWidth: number = 800, quality: number = 0.6): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    // Специальная обработка для Android
    const deviceType = getDeviceType();
    let adjustedQuality = quality;
    let adjustedMaxWidth = maxWidth;

    if (deviceType === 'android') {
      // Более консервативные настройки для Android
      adjustedQuality = Math.min(quality, 0.8);
      adjustedMaxWidth = Math.min(maxWidth, 1000);
    }

    img.onload = () => {
      try {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        
        // Более агрессивное уменьшение размера
        if (width > adjustedMaxWidth) {
          height = (height * adjustedMaxWidth) / width;
          width = adjustedMaxWidth;
        }

        // Дополнительное уменьшение для очень больших изображений
        if (file.size > 3 * 1024 * 1024) { // 3MB
          const scale = 0.7;
          width *= scale;
          height *= scale;
        }

        // Устанавливаем размеры canvas
        canvas.width = width;
        canvas.height = height;

        // Рисуем изображение с новыми размерами
        ctx?.drawImage(img, 0, 0, width, height);

        // Конвертируем в blob с указанным качеством
        canvas.toBlob((blob) => {
          if (blob) {
            // Создаем новый файл со сжатыми данными
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            console.log(`Изображение сжато для ${deviceType}: ${file.size} -> ${compressedFile.size} байт (качество: ${adjustedQuality}, ширина: ${adjustedMaxWidth}px)`);
            resolve(compressedFile);
          } else {
            reject(new Error('Не удалось сжать изображение'));
          }
        }, file.type, adjustedQuality);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Не удалось загрузить изображение для сжатия'));
    };

    // Загружаем изображение
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла для сжатия'));
    };
    reader.readAsDataURL(file);
  });
};

/**
 * Безопасно конвертирует файл в base64 data URL с автоматическим сжатием
 * Специально для iOS и Android устройств и предотвращения ошибок Kong
 */
export const safeImageToDataURL = async (file: File): Promise<ImageProcessingResult> => {
  try {
    const deviceType = getDeviceType();
    console.log(`Обработка файла для ${deviceType}: ${file.name} (${file.size} байт, тип: ${file.type})`);

    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: `Файл "${file.name}" не является изображением (тип: ${file.type})`
      };
    }

    // Проверяем размер файла (максимум 8MB до сжатия)
    const maxSize = 8 * 1024 * 1024; // 8MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Файл "${file.name}" слишком большой (максимум 8MB)`
      };
    }

    // Специальная обработка для Android
    let processedFile = file;
    let compressionApplied = false;
    
    if (deviceType === 'android') {
      // Для Android сжимаем все файлы больше 256KB
      if (file.size > 256 * 1024) {
        try {
          let quality = 0.7;
          let maxWidth = 900;
          
          // Более агрессивное сжатие для больших файлов на Android
          if (file.size > 1 * 1024 * 1024) { // 1MB
            quality = 0.6;
            maxWidth = 700;
          }
          
          if (file.size > 3 * 1024 * 1024) { // 3MB
            quality = 0.5;
            maxWidth = 600;
          }
          
          processedFile = await compressImage(file, maxWidth, quality);
          compressionApplied = true;
          console.log(`Android: изображение сжато: ${file.size} -> ${processedFile.size} байт (качество: ${quality}, ширина: ${maxWidth}px)`);
        } catch (compressError) {
          console.warn('Android: не удалось сжать изображение, используем оригинал:', compressError);
          processedFile = file;
        }
      }
    } else {
      // Для других устройств - стандартная логика
      if (file.size > 512 * 1024) { // 512KB - сжимаем файлы больше 512KB
        try {
          let quality = 0.6;
          let maxWidth = 800;
          
          // Более агрессивное сжатие для больших файлов
          if (file.size > 2 * 1024 * 1024) { // 2MB
            quality = 0.5;
            maxWidth = 600;
          }
          
          if (file.size > 4 * 1024 * 1024) { // 4MB
            quality = 0.4;
            maxWidth = 500;
          }
          
          processedFile = await compressImage(file, maxWidth, quality);
          compressionApplied = true;
          console.log(`Изображение сжато: ${file.size} -> ${processedFile.size} байт (качество: ${quality}, ширина: ${maxWidth}px)`);
        } catch (compressError) {
          console.warn('Не удалось сжать изображение, используем оригинал:', compressError);
          processedFile = file;
        }
      }
    }

    return new Promise((resolve) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const result = e.target?.result as string;
          
          // Дополнительная проверка результата
          if (!result || typeof result !== 'string') {
            resolve({
              success: false,
              error: 'Ошибка чтения файла'
            });
            return;
          }

          // Проверяем, что это валидный data URL
          if (!result.startsWith('data:image/')) {
            resolve({
              success: false,
              error: 'Неверный формат изображения'
            });
            return;
          }

          // Проверяем MIME тип
          const mimeMatch = result.match(/^data:image\/([a-zA-Z]+);base64,/);
          if (!mimeMatch) {
            resolve({
              success: false,
              error: 'Неверный MIME тип изображения'
            });
            return;
          }

          // Проверяем base64 данные
          const base64Data = result.split(',')[1];
          if (!base64Data || base64Data.length === 0) {
            resolve({
              success: false,
              error: 'Пустые данные изображения'
            });
            return;
          }

          // Проверяем, что base64 данные валидны
          try {
            atob(base64Data);
          } catch {
            resolve({
              success: false,
              error: 'Неверные base64 данные'
            });
            return;
          }

          // Проверяем размер base64 данных (увеличенный лимит до 2MB)
          const base64Size = Math.ceil((base64Data.length * 3) / 4);
          const maxBase64Size = 2 * 1024 * 1024; // 2MB
          
          if (base64Size > maxBase64Size) {
            // Если сжатие уже применялось, но размер все еще большой
            if (compressionApplied) {
              resolve({
                success: false,
                error: `Размер изображения слишком большой даже после сжатия (${Math.round(base64Size / 1024 / 1024)}MB). Попробуйте выбрать изображение меньшего размера.`
              });
              return;
            } else {
              // Пытаемся применить более агрессивное сжатие
              resolve({
                success: false,
                error: `Размер изображения слишком большой (${Math.round(base64Size / 1024 / 1024)}MB). Попробуйте уменьшить качество или размер изображения.`
              });
              return;
            }
          }

          console.log(`${deviceType}: файл успешно обработан: ${file.name} -> ${Math.round(base64Size / 1024)}KB`);
          resolve({
            success: true,
            dataUrl: result
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Ошибка обработки изображения'
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          error: `Ошибка чтения файла "${file.name}"`
        });
      };

      reader.onabort = () => {
        resolve({
          success: false,
          error: 'Чтение файла было прервано'
        });
      };

      // Устанавливаем таймаут (увеличен для Android)
      const timeout = deviceType === 'android' ? 45000 : 30000; // 45 секунд для Android, 30 для остальных
      const timeoutId = setTimeout(() => {
        reader.abort();
        resolve({
          success: false,
          error: `Таймаут чтения файла (${timeout / 1000}с)`
        });
      }, timeout);

      reader.onloadend = () => {
        clearTimeout(timeoutId);
      };

      // Читаем файл как data URL
      reader.readAsDataURL(processedFile);
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Неизвестная ошибка'
    };
  }
};

/**
 * Валидирует массив data URL изображений
 */
export const validateImageDataUrls = (dataUrls: string[]): { valid: string[]; invalid: string[] } => {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const dataUrl of dataUrls) {
    try {
      // Проверяем, что это валидный data URL
      if (!dataUrl.startsWith('data:image/')) {
        invalid.push(dataUrl);
        continue;
      }

      // Проверяем MIME тип
      const mimeMatch = dataUrl.match(/^data:image\/([a-zA-Z]+);base64,/);
      if (!mimeMatch) {
        invalid.push(dataUrl);
        continue;
      }

      // Проверяем base64 данные
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data || base64Data.length === 0) {
        invalid.push(dataUrl);
        continue;
      }

      // Проверяем размер base64 данных
      const base64SizeKB = (base64Data.length * 0.75) / 1024;
      if (base64SizeKB > 1000) { // 1MB
        invalid.push(dataUrl);
        continue;
      }

      // Проверяем, что base64 данные валидны
      try {
        atob(base64Data);
      } catch {
        invalid.push(dataUrl);
        continue;
      }

      valid.push(dataUrl);
    } catch {
      invalid.push(dataUrl);
    }
  }

  return { valid, invalid };
};

/**
 * Очищает массив изображений от невалидных данных
 */
export const cleanImageArray = (images: string[]): string[] => {
  const { valid } = validateImageDataUrls(images);
  return valid;
};

/**
 * Проверяет, поддерживается ли WebP на устройстве
 */
export const isWebPSupported = (): boolean => {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  
  try {
    ctx.fillStyle = 'rgba(0,0,0,0)';
    ctx.fillRect(0, 0, 1, 1);
    const dataURL = canvas.toDataURL('image/webp');
    return dataURL.startsWith('data:image/webp');
  } catch {
    return false;
  }
};

/**
 * Оптимизирует изображение для iOS
 */
export const optimizeImageForIOS = async (file: File): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Устанавливаем размеры canvas
      canvas.width = img.width;
      canvas.height = img.height;

      // Рисуем изображение
      ctx?.drawImage(img, 0, 0);

      // Конвертируем в blob
      canvas.toBlob((blob) => {
        if (blob) {
          // Создаем новый файл с оптимизированными данными
          const optimizedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(optimizedFile);
        } else {
          resolve(file);
        }
      }, file.type, 0.8); // Качество 80%
    };

    img.onerror = () => {
      resolve(file);
    };

    // Загружаем изображение
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}; 