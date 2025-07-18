'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { EmergencyOrderSchema } from '@/lib/types';

export default function TestEmergencyPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testCrazyData = () => {
    // Тестируем самые безумные данные, которые могут прийти с iPhone
    const crazyData = {
      orderNumber: null,
      shipmentNumber: undefined,
      productType: 'invalid_type',
      size: 'XXL',
      price: 'abc',
      cost: 'def',
      comment: 123,
      photos: [null, undefined, 'valid_photo', 456],
      seller: '',
      orderDate: 'invalid_date'
    };

    console.log('Тестирование безумных данных:', crazyData);
    
    try {
      const validated = EmergencyOrderSchema.parse(crazyData);
      console.log('✅ Безумные данные прошли валидацию:', validated);
      setResult(validated);
      setError(null);
    } catch (err: any) {
      console.error('❌ Безумные данные не прошли валидацию:', err);
      setError(err.message);
      setResult(null);
    }
  };

  const testIPhoneData = () => {
    // Симулируем данные iPhone
    const iphoneData = {
      orderNumber: '  WB-12345  ',
      shipmentNumber: 'SHP-A1B2C3',
      productType: 'фб',
      size: 'M',
      price: '1500,50',
      cost: '500,25',
      comment: 'Тестовый заказ',
      photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'],
      seller: 'test_user',
      orderDate: new Date().toISOString()
    };

    console.log('Тестирование данных iPhone:', iphoneData);
    
    try {
      const validated = EmergencyOrderSchema.parse(iphoneData);
      console.log('✅ iPhone данные прошли валидацию:', validated);
      setResult(validated);
      setError(null);
    } catch (err: any) {
      console.error('❌ iPhone данные не прошли валидацию:', err);
      setError(err.message);
      setResult(null);
    }
  };

  const testEmptyData = () => {
    // Тестируем пустые данные
    const emptyData = {
      orderNumber: '',
      shipmentNumber: '',
      productType: '',
      size: '',
      price: '',
      cost: '',
      comment: '',
      photos: [],
      seller: '',
      orderDate: ''
    };

    console.log('Тестирование пустых данных:', emptyData);
    
    try {
      const validated = EmergencyOrderSchema.parse(emptyData);
      console.log('✅ Пустые данные прошли валидацию:', validated);
      setResult(validated);
      setError(null);
    } catch (err: any) {
      console.error('❌ Пустые данные не прошли валидацию:', err);
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест экстренной схемы валидации</h1>
      
      <div className="space-y-4">
        <Button onClick={testCrazyData} className="w-full">
          Тест безумных данных
        </Button>
        
        <Button onClick={testIPhoneData} variant="outline" className="w-full">
          Тест iPhone данных
        </Button>
        
        <Button onClick={testEmptyData} variant="secondary" className="w-full">
          Тест пустых данных
        </Button>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="font-bold text-red-800">❌ Ошибка валидации:</h3>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 rounded">
          <h3 className="font-bold text-green-800">✅ Валидация прошла успешно:</h3>
          <pre className="text-sm text-green-700 mt-2 overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-100 rounded">
        <h3 className="font-bold mb-2">Экстренная схема валидации:</h3>
        <ul className="list-disc list-inside space-y-1 text-sm">
          <li>Принимает любые типы данных</li>
          <li>Автоматически преобразует в правильный формат</li>
          <li>Устанавливает значения по умолчанию</li>
          <li>Не выбрасывает ошибки валидации</li>
        </ul>
      </div>
    </div>
  );
} 