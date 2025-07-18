'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function TestPhotoPage() {
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('=== ТЕСТОВАЯ ЗАГРУЗКА ФОТО ===');
    console.log('Event:', event);
    console.log('Event target:', event.target);
    console.log('Event target files:', event.target.files);
    
    const files = event.target.files;
    console.log('Files object:', files);
    console.log('Files length:', files?.length);
    
    if (!files || files.length === 0) {
      console.log('❌ НЕТ ФАЙЛОВ - ВЫХОД');
      return;
    }

    console.log(`✅ ВЫБРАНО ${files.length} ФАЙЛОВ`);
    
    // Логируем каждый файл подробно
    Array.from(files).forEach((file, index) => {
      console.log(`Файл ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        lastModifiedDate: new Date(file.lastModified)
      });
    });

    setIsUploading(true);

    try {
      const loadPromises = Array.from(files).map((file, index) => {
        console.log(`Создание промиса для файла ${index + 1}: ${file.name}`);
        
        return new Promise<string>((resolve, reject) => {
          console.log(`Начало чтения файла: ${file.name}`);
          
          const reader = new FileReader();
          
          reader.onload = (e) => {
            console.log(`✅ ФАЙЛ ПРОЧИТАН: ${file.name}`);
            const result = e.target?.result as string;
            if (result) {
              console.log(`✅ ФАЙЛ УСПЕШНО ЗАГРУЖЕН: ${file.name} (${file.size} bytes)`);
              resolve(result);
            } else {
              console.log(`❌ ПУСТОЙ РЕЗУЛЬТАТ: ${file.name}`);
              reject(new Error(`Failed to load file: ${file.name}`));
            }
          };
          
          reader.onerror = () => {
            console.error(`❌ ОШИБКА ЧТЕНИЯ ФАЙЛА: ${file.name}`, reader.error);
            reject(new Error(`Ошибка чтения файла ${file.name}`));
          };
          
          reader.onabort = () => {
            console.error(`❌ ЧТЕНИЕ ПРЕРВАНО: ${file.name}`);
            reject(new Error(`Чтение файла прервано: ${file.name}`));
          };
          
          console.log(`Запуск readAsDataURL для файла: ${file.name}`);
          reader.readAsDataURL(file);
        });
      });

      console.log('Ожидание завершения всех промисов...');
      const results = await Promise.all(loadPromises);
      console.log(`✅ ВСЕ ФАЙЛЫ ОБРАБОТАНЫ: ${results.length} файлов`);
      
      setPhotos(prev => [...prev, ...results]);
      console.log('✅ СОСТОЯНИЕ ОБНОВЛЕНО');
      
    } catch (error) {
      console.error('❌ ОШИБКА В ПРОЦЕССЕ ЗАГРУЗКИ:', error);
      alert(`Ошибка: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    console.log('=== КЛИК ПО КНОПКЕ ===');
    console.log('fileInputRef.current:', fileInputRef.current);
    
    if (fileInputRef.current) {
      console.log('Сброс значения input...');
      fileInputRef.current.value = '';
      console.log('Клик по input...');
      fileInputRef.current.click();
      console.log('Клик выполнен');
    } else {
      console.log('❌ fileInputRef.current НЕ НАЙДЕН');
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест загрузки фотографий</h1>
      
      <div className="space-y-4">
        <div>
          <Label>Выберите фотографии</Label>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handlePhotoUpload}
            className="hidden" 
            accept="image/*"
            multiple
          />
        </div>
        
        <Button onClick={handleClick} disabled={isUploading} className="w-full">
          {isUploading ? 'Загрузка...' : 'Выбрать фото'}
        </Button>
      </div>
      
      {photos.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold mb-2">Загруженные фото ({photos.length}):</h2>
          <div className="grid grid-cols-2 gap-4">
            {photos.map((photo, index) => (
              <div key={index} className="border rounded p-2">
                <img 
                  src={photo} 
                  alt={`Фото ${index + 1}`} 
                  className="w-full h-32 object-cover rounded"
                />
                <p className="text-sm mt-1">Фото {index + 1}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Инструкции:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Откройте консоль браузера (F12)</li>
          <li>Нажмите кнопку "Выбрать фото"</li>
          <li>Выберите фотографии из галереи</li>
          <li>Проверьте логи в консоли</li>
          <li>Фотографии должны появиться ниже</li>
        </ol>
      </div>
    </div>
  );
} 