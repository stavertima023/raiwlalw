'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { OrderSchema } from '@/lib/types';

export default function TestValidationPage() {
  const [testData, setTestData] = useState({
    orderNumber: '',
    shipmentNumber: '',
    productType: '',
    size: '',
    price: '',
    comment: '',
    photos: []
  });
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testValidation = () => {
    try {
      console.log('Тестируемые данные:', testData);
      
      // Создаем данные для тестирования
      const dataToTest = {
        orderNumber: testData.orderNumber,
        shipmentNumber: testData.shipmentNumber,
        productType: testData.productType || undefined,
        size: testData.size || undefined,
        price: testData.price ? parseFloat(testData.price) : undefined,
        comment: testData.comment,
        photos: testData.photos,
        seller: 'test_user',
        orderDate: new Date().toISOString()
      };

      console.log('Данные для валидации:', dataToTest);
      
      // Тестируем валидацию
      const validated = OrderSchema.parse(dataToTest);
      
      console.log('✅ Валидация прошла успешно:', validated);
      setResult(validated);
      setError(null);
      
    } catch (err: any) {
      console.error('❌ Ошибка валидации:', err);
      setError(err.message);
      setResult(null);
    }
  };

  const testIPhoneData = () => {
    // Симулируем данные, которые могут прийти с iPhone
    const iphoneData = {
      orderNumber: '  WB-12345  ', // с пробелами
      shipmentNumber: 'SHP-A1B2C3',
      productType: 'фб',
      size: 'M',
      price: '1500,50', // с запятой
      comment: 'Тестовый заказ',
      photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...'],
      seller: 'test_user',
      orderDate: new Date().toISOString()
    };

    console.log('Тестирование данных iPhone:', iphoneData);
    
    try {
      const validated = OrderSchema.parse(iphoneData);
      console.log('✅ iPhone данные прошли валидацию:', validated);
      setResult(validated);
      setError(null);
    } catch (err: any) {
      console.error('❌ iPhone данные не прошли валидацию:', err);
      setError(err.message);
      setResult(null);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Тест валидации данных</h1>
      
      <div className="space-y-4">
        <div>
          <Label>Номер заказа</Label>
          <Input 
            value={testData.orderNumber}
            onChange={(e) => setTestData(prev => ({ ...prev, orderNumber: e.target.value }))}
            placeholder="WB-12345"
          />
        </div>
        
        <div>
          <Label>Номер отправления</Label>
          <Input 
            value={testData.shipmentNumber}
            onChange={(e) => setTestData(prev => ({ ...prev, shipmentNumber: e.target.value }))}
            placeholder="SHP-A1B2C3"
          />
        </div>
        
        <div>
          <Label>Тип товара</Label>
          <Select value={testData.productType} onValueChange={(value) => setTestData(prev => ({ ...prev, productType: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите тип" />
            </SelectTrigger>
            <SelectContent>
              {['фб', 'фч', 'хч', 'хб', 'хс', 'шч', 'лб', 'лч', 'другое'].map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Размер</Label>
          <Select value={testData.size} onValueChange={(value) => setTestData(prev => ({ ...prev, size: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="Выберите размер" />
            </SelectTrigger>
            <SelectContent>
              {['S', 'M', 'L', 'XL'].map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Цена</Label>
          <Input 
            value={testData.price}
            onChange={(e) => setTestData(prev => ({ ...prev, price: e.target.value }))}
            placeholder="1500"
          />
        </div>
        
        <div>
          <Label>Комментарий</Label>
          <Input 
            value={testData.comment}
            onChange={(e) => setTestData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Комментарий"
          />
        </div>
      </div>
      
      <div className="flex gap-4 mt-6">
        <Button onClick={testValidation}>Тестировать валидацию</Button>
        <Button onClick={testIPhoneData} variant="outline">Тест iPhone данных</Button>
      </div>
      
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 rounded">
          <h3 className="font-bold text-red-800">Ошибка валидации:</h3>
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
      
      <div className="mt-6 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Инструкции:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Заполните поля формы</li>
          <li>Нажмите "Тестировать валидацию"</li>
          <li>Или нажмите "Тест iPhone данных" для автоматического теста</li>
          <li>Проверьте результат в консоли браузера (F12)</li>
        </ol>
      </div>
    </div>
  );
} 