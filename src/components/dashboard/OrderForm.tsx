
'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { OrderSchema } from '@/lib/types';
import { processMultipleImages } from '@/lib/imageUtils';

interface OrderFormProps {
  onOrderAdded: () => void;
}

export function OrderForm({ onOrderAdded }: OrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [processedPhotos, setProcessedPhotos] = useState<string[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm({
    resolver: zodResolver(OrderSchema)
  });

  // Обработка выбора файлов
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    setError(null);
    setSelectedFiles(files);

    try {
      console.log(`Processing ${files.length} selected files`);
      
      // Обрабатываем изображения
      const processed = await processMultipleImages(files);
      
      if (processed.length > 0) {
        setProcessedPhotos(processed);
        console.log(`Successfully processed ${processed.length} images`);
      } else {
        setError('Не удалось обработать выбранные изображения');
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error('Error processing images:', error);
      setError('Ошибка при обработке изображений');
      setSelectedFiles([]);
    }
  }, []);

  // Удаление фотографии
  const removePhoto = useCallback((index: number) => {
    setProcessedPhotos(prev => prev.filter((_, i) => i !== index));
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Открытие модального окна с фотографией
  const openPhotoModal = useCallback((photo: string) => {
    setSelectedPhoto(photo);
  }, []);

  // Закрытие модального окна
  const closePhotoModal = useCallback(() => {
    setSelectedPhoto(null);
  }, []);

  // Отправка формы
  const onSubmit = async (data: any) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const orderData = {
        ...data,
        photos: processedPhotos
      };

      console.log('Submitting order with data:', {
        ...orderData,
        photos: orderData.photos ? `${orderData.photos.length} photos` : 'no photos'
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при создании заказа');
      }

      console.log('Order created successfully:', result);
      
      // Сбрасываем форму
      reset();
      setSelectedFiles([]);
      setProcessedPhotos([]);
      setError(null);
      
      // Уведомляем родительский компонент
      onOrderAdded();
      
    } catch (error) {
      console.error('Error creating order:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при создании заказа');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Добавить заказ
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Основные поля */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Номер заказа
            </label>
            <input
              type="text"
              {...register('orderNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите номер заказа"
            />
            {errors.orderNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.orderNumber.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Номер отправления
            </label>
            <input
              type="text"
              {...register('shipmentNumber')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите номер отправления"
            />
            {errors.shipmentNumber && (
              <p className="mt-1 text-sm text-red-600">{errors.shipmentNumber.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Тип товара
            </label>
            <input
              type="text"
              {...register('productType')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите тип товара"
            />
            {errors.productType && (
              <p className="mt-1 text-sm text-red-600">{errors.productType.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Размер
            </label>
            <input
              type="text"
              {...register('size')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите размер"
            />
            {errors.size && (
              <p className="mt-1 text-sm text-red-600">{errors.size.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Продавец
            </label>
            <input
              type="text"
              {...register('seller')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите имя продавца"
            />
            {errors.seller && (
              <p className="mt-1 text-sm text-red-600">{errors.seller.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Цена
            </label>
            <input
              type="number"
              {...register('price', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите цену"
            />
            {errors.price && (
              <p className="mt-1 text-sm text-red-600">{errors.price.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Себестоимость
            </label>
            <input
              type="number"
              {...register('cost', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите себестоимость"
            />
            {errors.cost && (
              <p className="mt-1 text-sm text-red-600">{errors.cost.message?.toString()}</p>
            )}
          </div>
        </div>

        {/* Комментарий */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Комментарий
          </label>
          <textarea
            {...register('comment')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Введите комментарий к заказу"
          />
          {errors.comment && (
            <p className="mt-1 text-sm text-red-600">{errors.comment.message?.toString()}</p>
          )}
        </div>

        {/* Загрузка фотографий */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фотографии
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Выберите фотографии товара (JPG, PNG, до 8MB каждая)
          </p>
        </div>

        {/* Предварительный просмотр фотографий */}
        {processedPhotos.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Выбранные фотографии ({processedPhotos.length})
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {processedPhotos.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Фото ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg cursor-pointer"
                    onClick={() => openPhotoModal(photo)}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Ошибка */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Кнопка отправки */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Добавление...' : 'Добавить заказ'}
          </button>
        </div>
      </form>

      {/* Модальное окно для просмотра фотографии */}
      {selectedPhoto && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Просмотр фотографии</h3>
              <button
                onClick={closePhotoModal}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <img
              src={selectedPhoto}
              alt="Фотография"
              className="max-w-full max-h-[70vh] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
