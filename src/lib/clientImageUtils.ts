// Клиентские утилиты для обработки изображений (без Sharp)

export interface ImageProcessResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
}

export const safeImageToDataURL = async (file: File): Promise<ImageProcessResult> => {
  try {
    // Проверяем тип файла
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Файл должен быть изображением'
      };
    }

    // Проверяем размер файла (максимум 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'Размер файла слишком большой (максимум 5MB)'
      };
    }

    // Создаем canvas для сжатия изображения
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return {
        success: false,
        error: 'Не удалось создать контекст для обработки изображения'
      };
    }

    // Создаем изображение
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        try {
          // Вычисляем новые размеры (максимум 800x600)
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          // Устанавливаем размеры canvas
          canvas.width = width;
          canvas.height = height;

          // Рисуем изображение с новыми размерами
          ctx.drawImage(img, 0, 0, width, height);

          // Конвертируем в base64 с качеством 0.8
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          resolve({
            success: true,
            dataUrl
          });
        } catch (error) {
          resolve({
            success: false,
            error: 'Ошибка при обработке изображения'
          });
        }
      };

      img.onerror = () => {
        resolve({
          success: false,
          error: 'Не удалось загрузить изображение'
        });
      };

      // Читаем файл
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          resolve({
            success: false,
            error: 'Не удалось прочитать файл'
          });
        }
      };
      reader.onerror = () => {
        resolve({
          success: false,
          error: 'Ошибка при чтении файла'
        });
      };
      reader.readAsDataURL(file);
    });
  } catch (error) {
    return {
      success: false,
      error: 'Неожиданная ошибка при обработке изображения'
    };
  }
};

export const cleanImageArray = (images: string[]): string[] => {
  return images.filter(img => 
    img && 
    typeof img === 'string' && 
    img.startsWith('data:image/') &&
    img.length > 0
  );
}; 