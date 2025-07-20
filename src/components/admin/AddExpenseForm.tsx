
'use client';

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ExpenseSchema } from '@/lib/types';
import { processMultipleImages } from '@/lib/imageUtils';

interface AddExpenseFormProps {
  onExpenseAdded: () => void;
}

export function AddExpenseForm({ onExpenseAdded }: AddExpenseFormProps) {
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
    resolver: zodResolver(ExpenseSchema.omit({ id: true }))
  });

  // Обработка выбора файлов
  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    setError(null);
    setSelectedFiles(files);

    try {
      console.log(`Processing ${files.length} selected files for expense`);
      
      // Обрабатываем изображения
      const processed = await processMultipleImages(files);
      
      if (processed.length > 0) {
        setProcessedPhotos(processed);
        console.log(`Successfully processed ${processed.length} images for expense`);
      } else {
        setError('Не удалось обработать выбранные изображения');
        setSelectedFiles([]);
      }
    } catch (error) {
      console.error('Error processing expense images:', error);
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
      const expenseData = {
        ...data,
        photos: processedPhotos,
        date: new Date().toISOString()
      };

      console.log('Submitting expense with data:', {
        ...expenseData,
        photos: expenseData.photos ? `${expenseData.photos.length} photos` : 'no photos'
      });

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Ошибка при создании расхода');
      }

      console.log('Expense created successfully:', result);
      
      // Сбрасываем форму
      reset();
      setSelectedFiles([]);
      setProcessedPhotos([]);
      setError(null);
      
      // Уведомляем родительский компонент
      onExpenseAdded();
      
    } catch (error) {
      console.error('Error creating expense:', error);
      setError(error instanceof Error ? error.message : 'Ошибка при создании расхода');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-6">
        Добавить расход
      </h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Основные поля */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Категория
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Выберите категорию</option>
              <option value="Ткань">Ткань</option>
              <option value="Курьер">Курьер</option>
              <option value="Расходники швейки">Расходники швейки</option>
              <option value="Доставка">Доставка</option>
              <option value="Упаковка">Упаковка</option>
              <option value="Прочее">Прочее</option>
            </select>
            {errors.category && (
              <p className="mt-1 text-sm text-red-600">{errors.category.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Сумма
            </label>
            <input
              type="number"
              step="0.01"
              {...register('amount', { valueAsNumber: true })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите сумму"
            />
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Комментарий
            </label>
            <input
              type="text"
              {...register('comment')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите комментарий к расходу"
            />
            {errors.comment && (
              <p className="mt-1 text-sm text-red-600">{errors.comment.message?.toString()}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ответственный
            </label>
            <input
              type="text"
              {...register('responsible')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Введите имя ответственного"
            />
            {errors.responsible && (
              <p className="mt-1 text-sm text-red-600">{errors.responsible.message?.toString()}</p>
            )}
          </div>
        </div>

        {/* Загрузка фотографий */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Фотографии чека
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">
            Выберите фотографии чека (JPG, PNG, до 8MB каждая)
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
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Добавление...' : 'Добавить расход'}
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
