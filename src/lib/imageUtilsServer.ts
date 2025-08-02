/**
 * Серверные утилиты для обработки изображений
 * Используются только на сервере (API routes)
 */

/**
 * Серверная функция для создания thumbnail из base64 изображения
 * @param base64Image - исходное изображение в base64
 * @param maxWidth - максимальная ширина thumbnail
 * @param maxHeight - максимальная высота thumbnail
 * @param quality - качество JPEG (0-100)
 * @returns Promise<string> - thumbnail в base64
 */
export const createThumbnailServer = async (
  base64Image: string,
  maxWidth: number = 150,
  maxHeight: number = 150,
  quality: number = 70
): Promise<string> => {
  try {
    // Динамически импортируем sharp только на сервере
    const sharp = (await import('sharp')).default;
    
    // Убираем data:image/...;base64, из строки
    const base64Data = base64Image.replace(/^data:image\/[a-z]+;base64,/, '');
    
    // Конвертируем base64 в Buffer
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Создаем thumbnail с помощью sharp
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({ quality })
      .toBuffer();
    
    // Конвертируем обратно в base64
    const thumbnailBase64 = `data:image/jpeg;base64,${thumbnailBuffer.toString('base64')}`;
    
    return thumbnailBase64;
  } catch (error) {
    console.error('Ошибка создания thumbnail на сервере:', error);
    // В случае ошибки возвращаем оригинальное изображение
    return base64Image;
  }
};

/**
 * Серверная функция для создания thumbnails для массива изображений
 * @param images - массив base64 изображений
 * @param maxWidth - максимальная ширина thumbnail
 * @param maxHeight - максимальная высота thumbnail
 * @param quality - качество JPEG
 * @returns Promise<string[]> - массив thumbnails в base64
 */
export const createThumbnailsServer = async (
  images: string[],
  maxWidth: number = 150,
  maxHeight: number = 150,
  quality: number = 70
): Promise<string[]> => {
  const thumbnails: string[] = [];
  
  for (const image of images) {
    try {
      const thumbnail = await createThumbnailServer(image, maxWidth, maxHeight, quality);
      thumbnails.push(thumbnail);
    } catch (error) {
      console.warn('Ошибка создания thumbnail:', error);
      // В случае ошибки добавляем оригинальное изображение
      thumbnails.push(image);
    }
  }
  
  return thumbnails;
}; 