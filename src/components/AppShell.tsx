'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import DetectionModal from '@/components/DetectionModal';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated && !isLoginPage) {
        router.replace('/login');
      } else if (isAuthenticated && isLoginPage) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Loading splash while determining initial session
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faf8] px-4">
        <div className="w-16 h-16 rounded-3xl bg-emerald-600 text-white flex items-center justify-center text-3xl shadow-xl ring-8 ring-emerald-100 animate-pulse mb-4">
          🌱
        </div>
        <span className="font-headline text-base font-bold text-slate-900 tracking-tight">
          AgroEye • Precision Smart Farming
        </span>
        <span className="text-xs text-slate-500 mt-1">Verifying secure authentication...</span>
      </div>
    );
  }

  // Guard against flash of protected dashboard content before redirect triggers
  if (!isAuthenticated && !isLoginPage) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f8faf8] px-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center text-2xl shadow-md mb-3">
          🌱
        </div>
        <span className="font-headline text-xs font-bold text-slate-500">
          Redirecting to Login...
        </span>
      </div>
    );
  }

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
