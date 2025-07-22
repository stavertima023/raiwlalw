'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

export function LazyImage({
  src,
  alt,
  width = 60,
  height = 60,
  className = '',
  priority = false,
  onLoad,
  onError
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Начинаем загружать за 50px до появления
        threshold: 0.1
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  if (hasError) {
    return (
      <div 
        ref={imgRef}
        className={`bg-muted flex items-center justify-center text-muted-foreground text-xs ${className}`}
        style={{ width, height }}
      >
        Ошибка
      </div>
    );
  }

  if (!isInView && !priority) {
    return (
      <div ref={imgRef}>
        <Skeleton className={className} style={{ width, height }} />
      </div>
    );
  }

  return (
    <div ref={imgRef} className="relative">
      {!isLoaded && (
        <Skeleton className={className} style={{ width, height }} />
      )}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        onLoad={handleLoad}
        onError={handleError}
        priority={priority}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

// Компонент для отображения нескольких фото с lazy loading
interface LazyPhotoGalleryProps {
  photos: string[];
  size?: number;
  maxVisible?: number;
}

export function LazyPhotoGallery({ 
  photos, 
  size = 60, 
  maxVisible = 3 
}: LazyPhotoGalleryProps) {
  if (!photos || photos.length === 0) {
    return (
      <div className="flex gap-1">
        {Array.from({ length: maxVisible }).map((_, index) => (
          <div
            key={index}
            className="bg-muted rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <span className="text-xs text-muted-foreground">Фото {index + 1}</span>
          </div>
        ))}
      </div>
    );
  }

  const visiblePhotos = photos.slice(0, maxVisible);
  const remainingCount = photos.length - maxVisible;

  return (
    <div className="flex gap-1">
      {visiblePhotos.map((photo, index) => (
        <LazyImage
          key={index}
          src={photo}
          alt={`Фото ${index + 1}`}
          width={size}
          height={size}
          className="rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
          priority={index === 0} // Первое фото загружаем приоритетно
        />
      ))}
      {remainingCount > 0 && (
        <div
          className="bg-muted rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-muted-foreground">+{remainingCount}</span>
        </div>
      )}
    </div>
  );
} 