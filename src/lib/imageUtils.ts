/**
 * Утилиты для безопасной обработки изображений
 * Специально оптимизированы для iOS устройств
 */

export interface ImageProcessingResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

/**
 * Сжимает изображение до указанного качества и размера
 * Более агрессивное сжатие для предотвращения ошибок Kong
 */
export const compressImage = (file: File, maxWidth: number = 600, quality: number = 0.4): Promise<File> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Вычисляем новые размеры с сохранением пропорций
        let { width, height } = img;
        
        // Более агрессивное уменьшение размера
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        // Дополнительное уменьшение для очень больших изображений
        if (file.size > 2 * 1024 * 1024) { // 2MB (уменьшено с 3MB)
          const scale = 0.6; // Уменьшено с 0.7
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
            resolve(compressedFile);
          } else {
            reject(new Error('Не удалось сжать изображение'));
          }
        }, file.type, quality);
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
 * Специально для iOS устройств и предотвращения ошибок Kong
 */
export const safeImageToDataURL = async (file: File): Promise<ImageProcessingResult> => {
  try {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: `Файл "${file.name}" не является изображением`
      };
    }

    // Проверяем размер файла (максимум 6MB до сжатия - уменьшено с 8MB)
    const maxSize = 6 * 1024 * 1024; // 6MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: `Файл "${file.name}" слишком большой (максимум 6MB)`
      };
    }

    // Более агрессивное сжатие для предотвращения ошибок Kong
    let processedFile = file;
    let compressionApplied = false;
    
    if (file.size > 256 * 1024) { // 256KB - сжимаем файлы больше 256KB (уменьшено с 512KB)
      try {
        let quality = 0.4; // Уменьшено с 0.6
        let maxWidth = 600; // Уменьшено с 800
        
        // Более агрессивное сжатие для больших файлов
        if (file.size > 1 * 1024 * 1024) { // 1MB (уменьшено с 2MB)
          quality = 0.3; // Уменьшено с 0.5
          maxWidth = 500;
        }
        
        if (file.size > 2 * 1024 * 1024) { // 2MB (уменьшено с 4MB)
          quality = 0.25; // Уменьшено с 0.4
          maxWidth = 400;
        }
        
        processedFile = await compressImage(file, maxWidth, quality);
        compressionApplied = true;
        console.log(`Изображение сжато: ${file.size} -> ${processedFile.size} байт (качество: ${quality}, ширина: ${maxWidth}px)`);
      } catch (compressError) {
        console.warn('Не удалось сжать изображение, используем оригинал:', compressError);
        processedFile = file;
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

          // Проверяем размер base64 данных (уменьшенный лимит до 1.5MB)
          const base64Size = Math.ceil((base64Data.length * 3) / 4);
          const maxBase64Size = 1.5 * 1024 * 1024; // 1.5MB (уменьшено с 2MB)
          
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

      // Устанавливаем таймаут для iOS
      const timeout = setTimeout(() => {
        reader.abort();
        resolve({
          success: false,
          error: 'Таймаут чтения файла'
        });
      }, 30000); // 30 секунд

      reader.onloadend = () => {
        clearTimeout(timeout);
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
      if (base64SizeKB > 800) { // 800KB (уменьшено с 1000KB/1MB)
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