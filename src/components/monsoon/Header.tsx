'use client';
import React, { useState } from 'react';
import {
  Bell,
  Globe,
  Layers,
  ChevronDown,
  ShieldAlert,
  ShieldCheck,
  X,
  MapPin,
  CalendarDays,
  CloudRain
} from 'lucide-react';
import { FarmLocation, Language } from '@/types/monsoon';
import { translations } from '@/i18n/monsoonTranslations';

interface HeaderProps {
  currentPlot: FarmLocation;
  plots: FarmLocation[];
  onSelectPlot: (plot: FarmLocation) => void;
  lang: Language;
  onToggleLang: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentPlot,
  plots,
  onSelectPlot,
  lang,
  onToggleLang,
}) => {
  const [isPlotDropdownOpen, setIsPlotDropdownOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const t = translations[lang];

  return (
    <>
      <header className="sticky top-0 w-full z-40 pt-safe bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs transition-all">
        <div className="h-16 px-4 max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex items-center gap-2 flex-shrink-0 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-headline font-bold text-lg shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                🌱
              </div>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-headline text-[18px] sm:text-xl font-bold text-slate-900 tracking-tight leading-none">
                    {t.appName}
                  </span>
                  <span className="font-headline text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/60 hidden sm:inline-flex items-center gap-1">
                    <CloudRain className="w-3 h-3 text-emerald-600" />
                    {t.navMonsoon}
                  </span>
                </div>
              </div>
            </div>

            {/* Farm Plot Switcher Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsPlotDropdownOpen(!isPlotDropdownOpen)}
                className="h-8 px-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline text-[11px] font-semibold flex items-center gap-1.5 transition-all border border-slate-200 shadow-2xs"
                title={t.switchPlot}
              >
                <Layers className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                <span className="truncate max-w-[100px] sm:max-w-[150px] font-bold">
                  {currentPlot.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isPlotDropdownOpen && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-slate-200 p-1.5 z-50 animate-in fade-in slide-in-from-top-1">
                  <span className="text-[10px] font-headline font-bold uppercase tracking-wider text-slate-400 px-2 py-1 block">
                    {t.selectPlot}
                  </span>
                  <div className="space-y-1">
                    {plots.map((plot) => (
                      <button
                        key={plot.id}
                        type="button"
                        onClick={() => {
                          onSelectPlot(plot);
                          setIsPlotDropdownOpen(false);
                        }}
                        className={`w-full text-left p-2.5 rounded-lg text-xs font-headline flex items-center justify-between transition-all ${
                          currentPlot.id === plot.id
                            ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                          <span className="truncate">{plot.name}</span>
                        </div>
                        {plot.crop && (
                          <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0">
                            {plot.crop}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Action Icons: Language Toggle, Alert Bell, Profile */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Language Toggle Button */}
            <button
              type="button"
              onClick={onToggleLang}
              className="h-8 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-headline text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
              title="Toggle Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.toggleLang}</span>
            </button>

            {/* Notification Bell */}
            <button
              type="button"
              onClick={() => setIsAlertsDrawerOpen(true)}
              className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all border border-slate-200 cursor-pointer"
              title={t.alertsTitle}
            >
              <Bell className="w-4 h-4 text-slate-700" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-600" />
            </button>

            {/* Profile Avatar Badge */}
            <div className="hidden sm:flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-headline font-bold">
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                A
              </div>
              <span className="truncate max-w-[120px]">{t.farmerBadge}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Alerts Drawer Modal */}
      {isAlertsDrawerOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in">
          <div className="w-full max-w-sm bg-white h-full shadow-2xl p-4 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-emerald-600" />
                  <h3 className="font-headline text-base font-bold text-slate-900">
                    {t.alertsTitle}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAlertsDrawerOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3">
                <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-950">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <h4 className="font-headline text-xs font-bold">
                      {lang === 'hi' ? 'मानसून आगमन निगरानी सक्रिय' : 'Monsoon Tracking Active'}
                    </h4>
                  </div>
                  <p className="text-xs mt-1.5 text-emerald-800 leading-relaxed">
                    {lang === 'hi'
                      ? '55 वर्षों के आईएमडी डेटा के आधार पर आपकी खरीफ बुवाई और खेत तैयारी की सिफारिशें अद्यतन हैं।'
                      : 'Kharif sowing preparedness calibrated using 55 years of IMD meteorological data.'}
                  </p>
                </div>

                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-sky-950">
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4 text-sky-600 flex-shrink-0" />
                    <h4 className="font-headline text-xs font-bold">
                      {lang === 'hi' ? 'केरल तट पर मानक तिथि' : 'Kerala Baseline Date'}
                    </h4>
                  </div>
                  <p className="text-xs mt-1.5 text-sky-800 leading-relaxed">
                    {lang === 'hi'
                      ? 'आईएमडी के अनुसार केरल में मानक आगमन 1 जून (± 4-5 दिन) है।'
                      : 'Standard normal onset over Kerala is 01 June with ± 4.8 days historical deviation.'}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsAlertsDrawerOpen(false)}
              className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-headline text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};

