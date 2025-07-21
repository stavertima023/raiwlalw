import * as React from 'react';
import Tesseract from 'tesseract.js';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface OCRPhotoDialogProps {
  photoUrl: string;
}

export const OCRPhotoDialog: React.FC<OCRPhotoDialogProps> = ({ photoUrl }) => {
  const [text, setText] = React.useState('');
  const [progress, setProgress] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleRecognize = async () => {
    setLoading(true);
    setText('');
    setError(null);
    setProgress(0);
    try {
      const { data } = await Tesseract.recognize(photoUrl, 'rus+eng', {
        logger: m => {
          if (m.status === 'recognizing text' && m.progress) {
            setProgress(Math.round(m.progress * 100));
          }
        }
      });
      setText(data.text);
    } catch (e: any) {
      setError('Ошибка распознавания: ' + (e.message || 'Неизвестная ошибка'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full mt-2 hidden md:block">
          Распознать текст с фото
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 sm:max-w-2xl md:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Распознавание текста с фото</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Image src={photoUrl} alt="Фото для OCR" width={320} height={320} className="rounded object-contain max-w-xs max-h-xs" />
          <div className="flex-1 w-full">
            <Button onClick={handleRecognize} disabled={loading} className="mb-2 w-full">
              {loading ? `Распознаём... (${progress}%)` : 'Распознать текст'}
            </Button>
            {loading && (
              <div className="w-full bg-gray-200 rounded h-2 mb-2">
                <div className="bg-blue-500 h-2 rounded" style={{ width: `${progress}%` }} />
              </div>
            )}
            {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
            {text && (
              <div className="bg-muted p-2 rounded text-sm whitespace-pre-wrap max-h-48 overflow-auto">
                <b>Распознанный текст:</b>
                <br />
                {text}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 