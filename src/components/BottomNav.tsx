'use client';

import React, { useState, useEffect, useMemo, useTransition, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useFarmData } from '@/context/FarmDataContext';
import { Home, Video, Sun, ScanLine, User } from 'lucide-react';

const TAB_ROUTES = ['/', '/live', '/weather', '/detections', '/profile'];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [mounted, setMounted] = useState(false);
  const [optimisticPath, setOptimisticPath] = useState<string>(pathname);

  // Sync optimistic path whenever URL changes
  useEffect(() => {
    setOptimisticPath(pathname);
  }, [pathname]);

  // Proactively prefetch all tab routes on mount for zero-latency instant transitions
  useEffect(() => {
    setMounted(true);
    TAB_ROUTES.forEach((route) => {
      try {
        router.prefetch(route);
      } catch {}
    });
  }, [router]);

  const { detections, cameraControl, setCameraMode } = useFarmData();

  const untreatedCount = useMemo(() => {
    return detections.filter((d) => !d.isTreated).length;
  }, [detections]);

  // Instant non-blocking tab switch handler
  const handleTabClick = useCallback(
    (e: React.MouseEvent, href: string) => {
      e.preventDefault();

      // If already on the requested tab, scroll smoothly to top
      if (pathname === href) {
        if (typeof window !== 'undefined') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }

      // 1. Instant optimistic active feedback (0ms UI latency)
      setOptimisticPath(href);

      // 2. Perform route transition via Next.js router in transition boundary
      startTransition(() => {
        router.push(href);
      });

      // 3. Fire background cleanup asynchronously (fire-and-forget without stalling UI)
      if (!href.startsWith('/live') && cameraControl.mode === 'manual') {
        setTimeout(() => {
          setCameraMode('auto').catch(() => {});
        }, 10);
      }
    },
    [pathname, router, cameraControl.mode, setCameraMode]
  );

  // Instant touch/pointer prefetch on tap or hover
  const handlePointerEnter = useCallback(
    (href: string) => {
      try {
        router.prefetch(href);
      } catch {}
    },
    [router]
  );

  if (pathname === '/login') return null;

  const navItems = [
    {
      label: 'Home',
      href: '/',
      icon: Home,
      isActive: optimisticPath === '/',
    },
    {
      label: 'Live',
      href: '/live',
      icon: Video,
      isActive: optimisticPath.startsWith('/live'),
      badge: 'live',
    },
    {
      label: 'Weather',
      href: '/weather',
      icon: Sun,
      isActive: optimisticPath.startsWith('/weather'),
    },
    {
      label: 'Detections',
      href: '/detections',
      icon: ScanLine,
      isActive: optimisticPath.startsWith('/detections'),
      count: untreatedCount,
    },
    {
      label: 'Profile',
      href: '/profile',
      icon: User,
      isActive: optimisticPath.startsWith('/profile'),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 pb-safe bg-white/95 backdrop-blur-xl border-t border-slate-200 shadow-lg select-none">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto w-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.href}
              type="button"
              onClick={(e) => handleTabClick(e, item.href)}
              onPointerDown={() => handlePointerEnter(item.href)}
              onMouseEnter={() => handlePointerEnter(item.href)}
              className={`group flex flex-col items-center justify-center min-w-[56px] min-h-[48px] py-1 transition-transform duration-150 active:scale-95 cursor-pointer outline-none ${
                item.isActive
                  ? 'text-emerald-700 font-bold'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <div
                className={`relative flex items-center justify-center px-4 py-1.5 rounded-full transition-all duration-150 ease-out ${
                  item.isActive ? 'bg-emerald-100/80 text-emerald-800 scale-105 shadow-xs' : 'group-hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-150 ${item.isActive ? 'text-emerald-700 scale-110' : 'text-slate-600'}`} />

                {item.badge === 'live' && (
                  <>
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white animate-ping" />
                    <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-rose-500 ring-1 ring-white" />
                  </>
                )}

                {mounted && typeof item.count === 'number' && item.count > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-amber-500 text-white font-headline text-[10px] flex items-center justify-center font-bold shadow-sm animate-pulse">
                    {item.count}
                  </span>
                )}
              </div>
              <span className={`font-headline text-[10px] uppercase tracking-wider mt-0.5 transition-all duration-150 ${item.isActive ? 'font-bold text-emerald-800' : 'font-medium text-slate-500'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
