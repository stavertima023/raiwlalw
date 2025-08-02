'use client';

import * as React from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { X, ZoomIn, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PhotoData {
  type: 'thumbnail' | 'full';
  data: string;
  size: string;
}

interface OrderPhotosLazyProps {
  orderId: string;
  size?: number;
  showThumbnails?: boolean;
  onPhotosLoad?: (photos: PhotoData[]) => void;
  // Убираем initialThumbnails, так как теперь всегда загружаем отдельно
  userRole?: string;
}

export const OrderPhotosLazy: React.FC<OrderPhotosLazyProps> = ({
  orderId,
  size = 60,
  showThumbnails = true,
  onPhotosLoad,
  userRole
}) => {
  const [thumbnails, setThumbnails] = React.useState<PhotoData[]>([]);
  const [fullPhotos, setFullPhotos] = React.useState<PhotoData[]>([]);
  const [loadingThumbnails, setLoadingThumbnails] = React.useState(false);
  const [loadingFull, setLoadingFull] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = React.useState(0);

  // Загружаем thumbnails при монтировании компонента
  React.useEffect(() => {
    if (showThumbnails && orderId) {
      loadThumbnails();
    }
  }, [orderId, showThumbnails]);

  const loadThumbnails = async () => {
    if (!orderId) return;

    setLoadingThumbnails(true);
    setError(null);

    try {
      console.log(`🖼️ Загружаем thumbnails для заказа ${orderId} (${userRole})`);
      const response = await fetch(`/api/orders/${orderId}/photos?type=thumbnails`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const thumbnailData = data.thumbnails || [];
      setThumbnails(thumbnailData);
      onPhotosLoad?.(thumbnailData);
      
      console.log(`✅ Загружено ${thumbnailData.length} thumbnails для заказа ${orderId}`);
    } catch (err) {
      console.error('❌ Ошибка загрузки thumbnails:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки фотографий');
    } finally {
      setLoadingThumbnails(false);
    }
  };

  const loadFullPhotos = async () => {
    if (!orderId || fullPhotos.length > 0) return;

    setLoadingFull(true);
    setError(null);

    try {
      console.log(`🖼️ Загружаем full-size фотографии для заказа ${orderId}`);
      const response = await fetch(`/api/orders/${orderId}/photos?type=full`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const fullPhotoData = data.fullPhotos || [];
      setFullPhotos(fullPhotoData);
      
      console.log(`✅ Загружено ${fullPhotoData.length} full-size фотографий для заказа ${orderId}`);
    } catch (err) {
      console.error('❌ Ошибка загрузки full-size фотографий:', err);
      setError(err instanceof Error ? err.message : 'Ошибка загрузки фотографий');
    } finally {
      setLoadingFull(false);
    }
  };

  const handlePhotoClick = async (index: number) => {
    setSelectedPhotoIndex(index);
    
    // Загружаем full-size фото при первом клике
    if (fullPhotos.length === 0) {
      await loadFullPhotos();
    }
  };

  // Показываем placeholder если нет фотографий
  if (!showThumbnails || thumbnails.length === 0) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <span className="text-xs text-muted-foreground">Фото {i}</span>
          </div>
        ))}
      </div>
    );
  }

  // Показываем loading для thumbnails
  if (loadingThumbnails) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <LoadingSpinner size="sm" />
          </div>
        ))}
      </div>
    );
  }

  // Показываем ошибку
  if (error) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted rounded border-2 border-dashed border-red-300 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <span className="text-xs text-red-500">Ошибка</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {thumbnails.map((photo, index) => (
        <div key={index} className="relative">
          <Dialog>
            <DialogTrigger asChild>
              <button 
                className="block group"
                onClick={() => handlePhotoClick(index)}
              >
                <Image
                  src={photo.data}
                  alt={`Фото ${index + 1}`}
                  width={size}
                  height={size}
                  className="rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ width: size, height: size }}
                  loading="lazy"
                />
                {/* Индикатор клика */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center rounded">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                    Просмотр
                  </div>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] max-h-[80vh] p-4 sm:max-w-2xl md:max-w-3xl" onPointerDownOutside={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between">
                  <span>Фото {selectedPhotoIndex + 1}</span>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-2 hover:bg-red-50 hover:border-red-300">
                      <X className="h-4 w-4 text-red-600" />
                    </Button>
                  </DialogTrigger>
                </DialogTitle>
              </DialogHeader>
              <div className="flex justify-center items-center">
                {loadingFull ? (
                  <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin" />
                    <span className="ml-2">Загрузка...</span>
                  </div>
                ) : fullPhotos.length > 0 ? (
                  <Image
                    src={fullPhotos[selectedPhotoIndex]?.data || thumbnails[selectedPhotoIndex]?.data}
                    alt={`Фото ${selectedPhotoIndex + 1}`}
                    width={800}
                    height={800}
                    className="rounded-md object-contain max-w-full max-h-[60vh]"
                    loading="eager"
                    priority={selectedPhotoIndex === 0}
                  />
                ) : (
                  <Image
                    src={thumbnails[selectedPhotoIndex]?.data}
                    alt={`Фото ${selectedPhotoIndex + 1}`}
                    width={800}
                    height={800}
                    className="rounded-md object-contain max-w-full max-h-[60vh]"
                    loading="eager"
                    priority={selectedPhotoIndex === 0}
                  />
                )}
              </div>
              {/* Навигация по фото если их несколько */}
              {thumbnails.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {thumbnails.map((_, photoIndex) => (
                    <button
                      key={photoIndex}
                      onClick={() => setSelectedPhotoIndex(photoIndex)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        photoIndex === selectedPhotoIndex ? 'bg-blue-500' : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      ))}
      {thumbnails.length < 3 && (
        <div
          className="bg-muted rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-muted-foreground">Фото {thumbnails.length + 1}</span>
        </div>
      )}
    </div>
  );
}; 