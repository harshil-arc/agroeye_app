'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import DetectionModal from '@/components/DetectionModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  return (
    <>
      {!isLoginPage && <Header />}
      <main
        className={`flex-1 flex flex-col relative w-full max-w-7xl mx-auto ${
          isLoginPage ? 'pt-2 pb-6' : 'pt-16 pb-24'
        }`}
      >
        {children}
      </main>
      {!isLoginPage && <BottomNav />}
      {!isLoginPage && <DetectionModal />}
    </>
  );
}

