'use client';
import React, { useState, useMemo } from 'react';
import {
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Layers,
  Sprout,
  ArrowRight,
  TrendingDown,
  TrendingUp
} from 'lucide-react';
import { StateRegionData, Language, PredictionResult } from '@/types/monsoon';
import { REGIONAL_MONSOON_DATA } from '@/data/historicMonsoonData';
import { translations } from '@/i18n/monsoonTranslations';
import { estimateStateArrival } from '@/utils/monsoonPredictor';

interface StateExplorerProps {
  selectedState: StateRegionData;
  onSelectState: (state: StateRegionData) => void;
  prediction: PredictionResult;
  lang: Language;
}

export const StateExplorer: React.FC<StateExplorerProps> = ({
  selectedState,
  onSelectState,
  prediction,
  lang,
}) => {
  const t = translations[lang];
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');

  const filteredStates = useMemo(() => {
    return REGIONAL_MONSOON_DATA.filter((st) => {
      const matchSearch =
        st.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.nameHi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        st.kharifCrops.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase())) ||
        st.kharifCropsHi.some((c) => c.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchRegion = selectedRegion === 'all' || st.region === selectedRegion;
      return matchSearch && matchRegion;
    });
  }, [searchTerm, selectedRegion]);

  const stateEstimate = estimateStateArrival(
    selectedState,
    prediction.estimatedDayOfYear,
    prediction.targetYear
  );

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-5">
      {/* Title & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <Sprout className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
              {t.stateExplorerTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t.stateExplorerSub}
          </p>
        </div>

        {/* Search & Region Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t.searchStatePlaceholder}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-48 sm:w-60"
            />
          </div>

          <div className="flex items-center gap-1">
            {['all', 'South', 'West', 'Central', 'North', 'East'].map((reg) => (
              <button
                key={reg}
                type="button"
                onClick={() => setSelectedRegion(reg)}
                className={`px-2.5 py-1 rounded-lg text-xs font-headline font-bold transition-all cursor-pointer ${
                  selectedRegion === reg
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {reg === 'all' ? t.allRegions : reg}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Horizontal State Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        {filteredStates.map((st) => {
          const isSelected = selectedState.id === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectState(st)}
              className={`flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-headline font-bold flex items-center gap-2 transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200'
              }`}
            >
              <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-600'}`} />
              <span>{lang === 'hi' ? st.nameHi : st.name}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {st.normalOnsetDate}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected State Comprehensive Deep-Dive */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2">
        {/* Left State Metrics Card (5 Cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold uppercase tracking-wider text-emerald-400">
                {selectedState.region} Meteorological Zone
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-slate-200 text-[10px] font-mono font-bold">
                Isochrone: {selectedState.isochroneDate}
              </span>
            </div>

            <h3 className="text-2xl font-headline font-extrabold text-white mt-2">
              {lang === 'hi' ? selectedState.nameHi : selectedState.name}
            </h3>

            {/* Target Year Arrival Forecast vs Normal */}
            <div className="mt-4 p-3.5 bg-white/10 rounded-xl border border-white/10 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-300 uppercase font-bold block">{t.stateNormalDate}</span>
                <span className="text-base font-headline font-extrabold text-white">{selectedState.normalOnsetDate}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-300 uppercase font-bold block">{prediction.targetYear} {t.estimatedStateArrival}</span>
                <span className="text-base font-headline font-extrabold text-emerald-300">{stateEstimate.estimatedDate}</span>
              </div>
            </div>

            {/* Historical Climatological Bounds */}
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span>{t.stateAvgArrival}:</span>
                <span className="font-mono font-bold text-white">{selectedState.avgHistoricOnset}</span>
              </div>
              <div className="flex justify-between items-center text-teal-300">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {t.stateEarliest}:
                </span>
                <span className="font-mono font-bold">{selectedState.earliestRecorded.date} ({selectedState.earliestRecorded.year})</span>
              </div>
              <div className="flex justify-between items-center text-amber-300">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {t.stateLatest}:
                </span>
                <span className="font-mono font-bold">{selectedState.latestRecorded.date} ({selectedState.latestRecorded.year})</span>
              </div>
              <div className="flex justify-between items-center text-slate-300 pt-2 border-t border-white/10">
                <span>{t.optimumSowingWindow}:</span>
                <span className="font-mono font-bold text-emerald-400">{lang === 'hi' ? selectedState.sowingWindowHi : selectedState.sowingWindow}</span>
              </div>
            </div>
          </div>

          {/* Key Kharif Crops */}
          <div className="pt-3 border-t border-white/10">
            <span className="text-[11px] font-headline uppercase font-bold text-slate-400 block mb-1.5">
              {t.majorKharifCrops}:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(lang === 'hi' ? selectedState.kharifCropsHi : selectedState.kharifCrops).map((crop, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 font-mono text-[11px] font-bold"
                >
                  {crop}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Agricultural Contingency Action Plans (7 Cols) */}
        <div className="lg:col-span-7 space-y-3">
          {/* Contingency 1: If Early Onset */}
          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-xs">
            <div className="flex items-center gap-2 text-emerald-950 font-headline font-bold text-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <h4>{t.earlyContingency}</h4>
            </div>
            <p className="mt-1.5 text-emerald-900 leading-relaxed">
              {lang === 'hi' ? selectedState.contingencyAdviceEarlyHi : selectedState.contingencyAdviceEarly}
            </p>
          </div>

          {/* Contingency 2: Normal Onset Routine */}
          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 text-xs">
            <div className="flex items-center gap-2 text-blue-950 font-headline font-bold text-sm">
              <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <h4>{t.normalContingency}</h4>
            </div>
            <p className="mt-1.5 text-blue-900 leading-relaxed">
              {lang === 'hi' ? selectedState.contingencyAdviceNormalHi : selectedState.contingencyAdviceNormal}
            </p>
          </div>

          {/* Contingency 3: If Delayed Onset */}
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs">
            <div className="flex items-center gap-2 text-amber-950 font-headline font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <h4>{t.delayedContingency}</h4>
            </div>
            <p className="mt-1.5 text-amber-900 leading-relaxed">
              {lang === 'hi' ? selectedState.contingencyAdviceDelayedHi : selectedState.contingencyAdviceDelayed}
            </p>
          </div>

          {/* Recent 5-Year History Table */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-slate-500 block mb-2">
              {t.recentArrivalHistory}
            </span>
            <div className="grid grid-cols-5 gap-2 text-center text-xs font-headline">
              {selectedState.recentRecords.map((rec) => (
                <div key={rec.year} className="p-2 bg-white rounded-xl border border-slate-200 shadow-2xs">
                  <span className="font-bold text-slate-800 block text-[11px]">{rec.year}</span>
                  <span className="font-extrabold text-slate-900 block mt-0.5">{rec.date}</span>
                  <span className={`text-[10px] font-mono font-bold block mt-0.5 ${
                    rec.deviation < 0 ? 'text-emerald-600' : rec.deviation > 0 ? 'text-amber-600' : 'text-blue-600'
                  }`}>
                    {rec.deviation < 0 ? `${rec.deviation}d` : rec.deviation > 0 ? `+${rec.deviation}d` : '0d'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

