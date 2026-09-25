'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarmData } from '@/context/FarmDataContext';

export default function Header() {
  const pathname = usePathname();
  const { isOfflineMode, firebaseConnected } = useFarmData();

  const getPageTitle = () => {
    if (pathname === '/') return 'Home';
    if (pathname.startsWith('/live')) return 'Live Feed';
    if (pathname.startsWith('/weather')) return 'Weather Microclimate';
    if (pathname.startsWith('/detections')) return 'Detections';
    if (pathname.startsWith('/profile')) return 'Farm Profile';
    return 'Smart Farming';
  };

  return (
    <header className="fixed top-0 w-full z-50 pt-safe bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
      <div className="h-16 px-4 max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand & Page Context */}
        <Link href="/" className="flex items-center gap-2.5 min-w-0 group">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-headline font-bold text-lg shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
            🌱
          </div>
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-headline text-[18px] sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
                AgroEye
              </span>
              <span className="font-headline text-xs text-slate-500 font-semibold tracking-wider uppercase hidden sm:inline-block">
                • {getPageTitle()}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium truncate flex items-center gap-0.5">
              <span>📍</span> Udaipur, RJ
            </span>
          </div>
        </Link>

        {/* Live Node Badge & Profile Avatar */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold tracking-wider uppercase transition-colors ${
              isOfflineMode
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOfflineMode
                  ? 'bg-amber-500'
                  : 'bg-emerald-600 animate-pulse'
              }`}
            />
            <span>{isOfflineMode ? 'Buffer #04' : firebaseConnected ? 'Firebase Live' : 'Live Node'}</span>
          </div>

          <Link href="/profile" className="relative block flex-shrink-0" title="Farm Operator Profile">
            <img
              alt="Farmer Profile"
              className="w-8 h-8 rounded-full object-cover ring-2 ring-emerald-600/30 shadow-sm hover:ring-emerald-600 transition-all"
              src="https://lh3.googleusercontent.com/aida/AEtjO1W7Z0YmoEh7fgrCcTh2Zj1tOtDNvssAXZe49VQblwr0m_SajWroswX9VueDJ1XL7Oq754rKujEHCOicP945BMczKQk4C39fpFmtoALbhwnKL3sFZIf8n55_snPfmLlgYwxzHco0DLEj_QUM6odyMdwom9pPogxl7f4pdZO448qjd2hrxU0Kf9gYiaKFqhnGa9dbjFmzz6OG38MEYvVN2qP5x4cGNJCgIbnr67uhoLfOWiyTUx2RyQb0eg"
            />
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-1 ring-white" />
          </Link>
        </div>
      </div>
    </header>
  );
}
