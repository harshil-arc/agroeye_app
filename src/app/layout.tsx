import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FarmDataProvider } from '@/context/FarmDataContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import DetectionModal from '@/components/DetectionModal';

export const metadata: Metadata = {
  title: 'AgroEye • Precision Smart Farming Platform',
  description: 'Real-time telemetry, IoT edge sensors, microclimate monitoring, and YOLOv8 AI pest & disease diagnostics for farmers.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🌱</text></svg>',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#059669',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Manrope:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#f8faf8] text-slate-900 antialiased flex flex-col min-h-screen">
        <FarmDataProvider>
          <Header />
          <main className="flex-1 flex flex-col relative w-full pt-16 pb-24 max-w-7xl mx-auto">
            {children}
          </main>
          <BottomNav />
          <DetectionModal />
        </FarmDataProvider>
      </body>
    </html>
  );
}
