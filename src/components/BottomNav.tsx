'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarmData } from '@/context/FarmDataContext';
import { Home, Video, Sun, ScanLine, User } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();
  const { detections, cameraControl, setCameraMode } = useFarmData();

  if (pathname === '/login') return null;

  const untreatedCount = detections.filter((d) => !d.isTreated).length;

  const handleNavClick = (href: string) => {
    if (!href.startsWith('/live') && cameraControl.mode === 'manual') {
      setCameraMode('auto').catch(() => {});
    }
  };

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: pathname === '/',
    },
    {
      label: 'Live',
      href: '/live',
      icon: Video,
      isActive: pathname.startsWith('/live'),
      badge: 'live',
    },
    {
      label: 'Weather',
      href: '/weather',
      icon: Sun,
      isActive: pathname.startsWith('/weather'),
    },
    {
      label: 'Detections',
      href: '/detections',
      icon: ScanLine,
      isActive: pathname.startsWith('/detections'),
      count: untreatedCount,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: pathname.startsWith('/profile'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-lg">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => handleNavClick(item.href)}
              className={`group flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-all ${
                item.isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`relative flex items-center justify-center px-3.5 py-1 rounded-full transition-all ${
                  item.isActive ? 'bg-emerald-50 text-emerald-700 shadow-xs' : 'group-hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${item.isActive ? 'text-emerald-700' : 'text-slate-600'}`} />

                {item.badge === 'live' && (
                  <>
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white" />
                  </>
                )}

                {typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white font-headline text-[10px] flex items-center justify-center font-bold shadow-xs">
                    {item.count}
                  </span>
                )}
              </div>
              <span className="font-headline text-[11px] uppercase tracking-wider mt-0.5 font-semibold">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
