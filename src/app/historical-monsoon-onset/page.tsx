'use client';

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  CloudRain,
  MapPin,
  Calendar,
  Sparkles,
  Info,
  ShieldCheck,
  RotateCcw,
  ArrowLeft,
  Globe,
  Layers,
  CalendarDays,
} from 'lucide-react';
import {
  Language,
  FarmLocation,
  PredictionParameters,
  StateRegionData,
  CityMonsoonData,
} from '@/types/monsoon';
import {
  REGIONAL_MONSOON_DATA,
  DEMO_PLOTS,
} from '@/data/historicMonsoonData';
import { CITIES_MONSOON_DATA } from '@/data/cityMonsoonData';
import { estimateMonsoonOnset } from '@/utils/monsoonPredictor';
import { translations } from '@/i18n/monsoonTranslations';

// Components
import { MonsoonSummaryCards } from '@/components/monsoon/MonsoonSummaryCards';
import { CityMonsoonPickerCard } from '@/components/monsoon/CityMonsoonPickerCard';
import { PredictionEngineCard } from '@/components/monsoon/PredictionEngineCard';
import { HistoricYearRowList } from '@/components/monsoon/HistoricYearRowList';
import { HistoricalTimelineChart } from '@/components/monsoon/HistoricalTimelineChart';
import { StateExplorer } from '@/components/monsoon/StateExplorer';
import { CropSowingAdvisoryCard } from '@/components/monsoon/CropSowingAdvisoryCard';
import { CorrelationAnalysisSection } from '@/components/monsoon/CorrelationAnalysisSection';
import { HistoricDataTable } from '@/components/monsoon/HistoricDataTable';

// Leaflet map dynamically imported with SSR disabled
const MonsoonProgressionMap = dynamic(
  () => import('@/components/monsoon/MonsoonProgressionMap').then((mod) => mod.MonsoonProgressionMap),
  { ssr: false }
);

export default function HistoricalMonsoonOnsetPage() {
  const [lang, setLang] = useState<Language>('en');

  const [currentPlot, setCurrentPlot] = useState<FarmLocation>(() => DEMO_PLOTS[0]);

  // Selected City & State in map and explorer
  const [selectedCity, setSelectedCity] = useState<CityMonsoonData>(() => CITIES_MONSOON_DATA[0]);
  const [selectedState, setSelectedState] = useState<StateRegionData>(() => {
    return REGIONAL_MONSOON_DATA[0];
  });

  // Prediction Simulation Parameters (Defaults to 2026 Season Outlook)
  const [predictionParams, setPredictionParams] = useState<PredictionParameters>({
    targetYear: 2026,
    ensoForecast: 'La Niña',
    iodForecast: 'Positive',
    mjoStatus: 'Active Bay of Bengal',
    seaSurfaceTempAnomaly: 0.6,
    eurasianSnowCover: 'Below Normal',
    customConfidence: 80,
  });

  // Sync with localStorage on client mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = (localStorage.getItem('agroeye_monsoon_lang') as Language) || 'en';
      setLang(savedLang);

      const savedFarm = localStorage.getItem('agroeye_saved_farm_location');
      if (savedFarm) {
        try {
          const parsed = JSON.parse(savedFarm);
          if (parsed && parsed.lat && parsed.lng) {
            setCurrentPlot(parsed);
            const matchedState = REGIONAL_MONSOON_DATA.find((s) => s.id === parsed.stateId);
            if (matchedState) setSelectedState(matchedState);

            const matchedCity = CITIES_MONSOON_DATA.find((c) =>
              parsed.name.toLowerCase().includes(c.name.toLowerCase()) ||
              c.stateId === parsed.stateId
            );
            if (matchedCity) setSelectedCity(matchedCity);
          }
        } catch (e) {
          console.error('Failed to parse active farm', e);
        }
      }
    }
  }, []);

  const t = translations[lang];

  // Calculate live dynamic prediction based on parameters
  const livePrediction = useMemo(() => {
    return estimateMonsoonOnset(predictionParams);
  }, [predictionParams]);

  // Toggle Language Handler
  const handleToggleLang = () => {
    const nextLang = lang === 'en' ? 'hi' : 'en';
    setLang(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroeye_monsoon_lang', nextLang);
    }
  };

  // Handle City Selection
  const handleSelectCity = (city: CityMonsoonData) => {
    setSelectedCity(city);
    const matched = REGIONAL_MONSOON_DATA.find((s) => s.id === city.stateId);
    if (matched) {
      setSelectedState(matched);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* 1. Header with Breadcrumb & Plot Switcher */}
      <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-xs">
        <div className="h-16 px-4 max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-headline font-bold text-lg shadow-sm flex-shrink-0">
              🌧️
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-headline text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none truncate">
                  {lang === 'hi' ? 'ऐतिहासिक मानसून आगमन व पूर्वानुमान' : 'Historic Monsoon Onset'}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200/60 hidden sm:inline-block">
                  IMD 1970–2025
                </span>
              </div>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={handleToggleLang}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-headline text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{lang === 'en' ? 'HI (हिंदी)' : 'EN'}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-4 space-y-4 sm:space-y-5">
        {/* Page Hero Header Banner */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-headline text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                {t.appName} • {t.pageSubtitle}
              </span>
            </div>

            <h1 className="font-headline text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mt-1.5 flex items-center gap-2.5">
              <CloudRain className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-600 flex-shrink-0" />
              <span>{t.pageTitle}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-3xl leading-relaxed font-medium">
              {t.liveStation}
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start lg:self-auto flex-shrink-0">
            {/* Active Selected City Badge */}
            <div className="px-3.5 py-2 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-headline flex items-center gap-2 shadow-2xs">
              <MapPin className="w-4 h-4 text-emerald-700" />
              <div>
                <span className="text-[10px] text-emerald-800 font-bold block">
                  {lang === 'hi' ? 'चयनित शहर व राज्य' : 'Active Region'}
                </span>
                <span className="font-extrabold text-emerald-950 truncate max-w-[170px] inline-block">
                  {selectedCity.name}, {selectedCity.stateName}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* 1. Summary High-Impact KPI Metric Cards */}
        <MonsoonSummaryCards
          prediction={livePrediction}
          lang={lang}
        />

        {/* 2. City & District Onset Search and Localized Advisory Section */}
        <CityMonsoonPickerCard
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          prediction={livePrediction}
          lang={lang}
        />

        {/* 3. Previous Year Historical Monsoon Onset Dates */}
        <HistoricYearRowList
          lang={lang}
          selectedCity={selectedCity}
        />

        {/* 4. AI / Statistical Prediction & Simulation Engine for Current Year */}
        <PredictionEngineCard
          params={predictionParams}
          onUpdateParams={setPredictionParams}
          prediction={livePrediction}
          lang={lang}
        />

        {/* 5. Interactive Leaflet GIS Progression Map & Isochrone Radar (Key-Free OpenStreetMap & Esri Satellite) */}
        <MonsoonProgressionMap
          currentPlot={currentPlot}
          selectedState={selectedState}
          onSelectState={setSelectedState}
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          prediction={livePrediction}
          lang={lang}
        />

        {/* 6. 55-Year Historical Timeline Chart */}
        <HistoricalTimelineChart
          lang={lang}
        />

        {/* 7. State & Regional Agro-Climatic Zone Explorer */}
        <StateExplorer
          selectedState={selectedState}
          onSelectState={setSelectedState}
          prediction={livePrediction}
          lang={lang}
        />

        {/* 8. Kharif Season Preparedness & Sowing Action Plan */}
        <CropSowingAdvisoryCard
          prediction={livePrediction}
          lang={lang}
        />

        {/* 9. Climate Teleconnections & ENSO / IOD Analysis */}
        <CorrelationAnalysisSection
          lang={lang}
        />

        {/* 10. Full Historic Archive Data Table with CSV Download */}
        <HistoricDataTable
          lang={lang}
        />

        {/* Data Source & Academic Citation Footer */}
        <footer className="pt-6 pb-2 text-center text-xs text-slate-400 space-y-1">
          <p>{t.dataSourceCredit}</p>
          <p className="font-headline font-bold text-slate-500">{t.copyright}</p>
        </footer>
      </main>
    </div>
  );
}
