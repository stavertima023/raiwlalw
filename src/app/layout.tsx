import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/layout/ThemeProvider';
import { StabilityMonitor } from '@/components/ui/stability-monitor';
import { MobileStability } from '@/components/ui/mobile-stability';

export const metadata: Metadata = {
  title: 'OrderFlow Factory',
  description: 'Профессиональное приложение для управления заказами.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OrderFlow Factory" />
        <meta name="application-name" content="OrderFlow Factory" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="theme-color" content="#000000" />
        {/* Дополнительные мета-теги для стабильности */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="apple-touch-fullscreen" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body>
        <MobileStability>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <StabilityMonitor>
              {children}
            </StabilityMonitor>
            <Toaster />
          </ThemeProvider>
        </MobileStability>
      </body>
    </html>
  );
}
