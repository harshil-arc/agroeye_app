'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useFarmData } from '@/context/FarmDataContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import {
  Bell,
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  UserX,
  ChevronDown,
  Globe,
  Layers,
  X,
  Lock,
  Sparkles,
  AlertTriangle,
} from 'lucide-react';

export default function Header() {
  const pathname = usePathname();
  const {
    isOfflineMode,
    firebaseConnected,
    isDataStale,
    plots,
    selectedPlot,
    setSelectedPlot,
    thresholdAlerts,
    dismissThresholdAlert,
  } = useFarmData();
  const { isAuthenticated, operator } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const [showAlertDrawer, setShowAlertDrawer] = useState<boolean>(false);
  const [showPlotDropdown, setShowPlotDropdown] = useState<boolean>(false);

  const getPageTitle = () => {
    if (pathname === '/') return t('home');
    if (pathname.startsWith('/live')) return t('live');
    if (pathname.startsWith('/weather')) return t('weather');
    if (pathname.startsWith('/detections')) return t('detections');
    if (pathname.startsWith('/profile')) return t('profile');
    return 'AgroEye';
  };

  const activePlot = plots.find((p) => p.id === selectedPlot) || plots[0];

  if (pathname === '/login') return null;

  return (
    <>
      <header className="fixed top-0 w-full z-40 pt-safe bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="h-16 px-4 max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* 1. Brand & Multi-Field Selector */}
          <div className="flex items-center gap-2.5 min-w-0">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0 group">
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
              </div>
            </Link>

            {/* Field / Plot Switcher Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPlotDropdown(!showPlotDropdown)}
                className="h-7 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline text-[11px] font-semibold flex items-center gap-1 transition-all border border-slate-200"
                title="Switch Active Field Plot"
              >
                <Layers className="w-3 h-3 text-emerald-600" />
                <span className="truncate max-w-[90px] sm:max-w-[130px]">
                  {activePlot?.name.split('•')[0] || 'Dabok Sector 1'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {/* Plot Dropdown Menu */}
              {showPlotDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-1 z-50 animate-in fade-in">
                  <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                    Select Active Farm Field:
                  </span>
                  {plots.map((plot) => (
                    <button
                      key={plot.id}
                      type="button"
                      onClick={() => {
                        setSelectedPlot(plot.id);
                        setShowPlotDropdown(false);
                      }}
                      className={`w-full text-left p-2 rounded-lg text-xs font-headline flex items-center justify-between transition-all ${
                        selectedPlot === plot.id
                          ? 'bg-emerald-50 text-emerald-900 font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{plot.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{plot.crop}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 2. Top Action Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language Switcher (EN / हिंदी) */}
            <button
              type="button"
              onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
              className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-headline text-xs font-bold flex items-center gap-1 transition-all"
              title="Toggle Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{lang === 'en' ? 'HI (हिंदी)' : 'EN (English)'}</span>
            </button>

            {/* Threshold Alert Notification Bell */}
            <button
              type="button"
              onClick={() => setShowAlertDrawer(!showAlertDrawer)}
              className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
              title="Active Threshold Alerts"
            >
              <Bell className="w-4 h-4" />
              {thresholdAlerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              )}
              {thresholdAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center">
                  {thresholdAlerts.length}
                </span>
              )}
            </button>

            {/* Auth Status & Profile */}
            {isAuthenticated ? (
              <Link
                href="/profile"
                className="flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[11px] font-headline font-bold transition-all"
                title="View Profile & Farm Settings"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">
                  {operator?.displayName ? operator.displayName.charAt(0).toUpperCase() : 'F'}
                </div>
                <span className="hidden sm:inline truncate max-w-[100px]">
                  {operator?.displayName || 'Farmer'}
                </span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                title="Login or Register Account"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{lang === 'hi' ? 'लॉगिन / रजिस्टर' : 'Login / Register'}</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* THRESHOLD ALERTS DRAWER MODAL */}
      {showAlertDrawer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl p-4 flex flex-col justify-between animate-in slide-in-from-right">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-rose-600" />
                  <h3 className="font-headline text-base font-bold text-slate-900">
                    Threshold &amp; Field Alerts
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAlertDrawer(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Alert List */}
              <div className="mt-3 space-y-2.5 overflow-y-auto max-h-[75vh]">
                {thresholdAlerts.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-100">
                    <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <h4 className="font-headline text-sm font-bold text-slate-900">All Parameters Normal</h4>
                    <p className="text-xs text-slate-500 mt-1">No sensor readings currently breach threshold boundaries.</p>
                  </div>
                ) : (
                  thresholdAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      className={`p-3 rounded-xl border transition-all ${
                        alt.severity === 'Critical'
                          ? 'bg-rose-50 border-rose-200 text-rose-900'
                          : 'bg-amber-50 border-amber-200 text-amber-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                          <h4 className="font-headline text-xs font-bold">{alt.title}</h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => dismissThresholdAlert(alt.id)}
                          className="text-[10px] text-slate-400 hover:text-slate-700 font-bold"
                        >
                          Dismiss
                        </button>
                      </div>
                      <p className="text-xs mt-1 text-slate-700">{alt.message}</p>
                      <span className="text-[10px] font-mono font-bold mt-1.5 block opacity-75">
                        Reading: {alt.value} • {alt.timestamp}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAlertDrawer(false)}
              className="w-full h-10 rounded-xl bg-slate-900 text-white font-headline text-xs font-bold uppercase tracking-wider"
            >
              Close Alerts
            </button>
          </div>
        </div>
      )}
    </>
  );
}
