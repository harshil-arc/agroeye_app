'use client';

import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Calendar,
  Sparkles,
  TrendingUp,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import {
  CityMonsoonData,
  CityOnsetEstimation,
  Language,
  PredictionResult,
} from '@/types/monsoon';
import {
  CITIES_MONSOON_DATA,
  searchCityMonsoon,
} from '@/data/cityMonsoonData';
import { estimateCityArrival } from '@/utils/monsoonPredictor';

interface CityMonsoonPickerCardProps {
  selectedCity: CityMonsoonData;
  onSelectCity: (city: CityMonsoonData) => void;
  prediction: PredictionResult;
  lang: Language;
}

export const CityMonsoonPickerCard: React.FC<CityMonsoonPickerCardProps> = ({
  selectedCity,
  onSelectCity,
  prediction,
  lang,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const isHi = lang === 'hi';
  const searchResults = searchCityMonsoon(searchQuery);

  const cityEstimation: CityOnsetEstimation = estimateCityArrival(
    selectedCity,
    prediction.estimatedDayOfYear,
    prediction.targetYear
  );

  const popularCities = ['jaipur', 'udaipur', 'pune', 'nagpur', 'indore', 'ahmedabad', 'ludhiana', 'varanasi', 'patna', 'hyderabad'];

  const getStatusBadge = (status: 'Early' | 'Normal' | 'Delayed') => {
    switch (status) {
      case 'Early':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Delayed':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Normal':
      default:
        return 'bg-sky-100 text-sky-900 border-sky-300';
    }
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
              {isHi ? 'शहर-विशिष्ट मानसून आगमन व बुवाई खिड़की' : 'City / District Monsoon Onset & Sowing Advisory'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {isHi ? 'अपने शहर का चयन करें और ऐतिहासिक आगमन व अनुमानित तारीख देखें' : 'Input your city to get localized historical records & onset projection'}
            </p>
          </div>
        </div>

        <span className="text-[11px] font-headline font-bold text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
          {prediction.targetYear} {isHi ? 'पूर्वानुमान' : 'Outlook Active'}
        </span>
      </div>

      {/* Search Input Bar with Auto-suggest dropdown */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
            placeholder={isHi ? 'शहर या ज़िला खोजें (उदा. जयपुर, पुणे, इंदौर, नागपुर)...' : 'Search city or district (e.g. Jaipur, Pune, Indore, Nagpur)...'}
            className="w-full h-12 pl-10 pr-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-headline text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all shadow-2xs"
          />
        </div>

        {/* Dropdown Suggestions */}
        {isDropdownOpen && searchResults.length > 0 && (
          <div className="absolute top-14 left-0 right-0 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto p-1.5 animate-in fade-in slide-in-from-top-2">
            {searchResults.map((city) => (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  onSelectCity(city);
                  setSearchQuery('');
                  setIsDropdownOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-headline flex items-center justify-between transition-colors cursor-pointer ${
                  city.id === selectedCity.id
                    ? 'bg-emerald-50 text-emerald-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div>
                  <span className="font-bold">{isHi ? city.nameHi : city.name}</span>
                  <span className="text-slate-400 text-[11px] ml-2 font-normal">({isHi ? city.stateNameHi : city.stateName})</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-semibold bg-white px-2 py-0.5 rounded border border-emerald-100">
                  {city.normalOnsetDate}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Popular City Quick-Pick Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] uppercase font-bold text-slate-400 flex-shrink-0 mr-1">
          {isHi ? 'त्वरित चयन:' : 'Popular Cities:'}
        </span>
        {popularCities.map((cid) => {
          const c = CITIES_MONSOON_DATA.find((x) => x.id === cid);
          if (!c) return null;
          const isSel = selectedCity.id === c.id;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCity(c)}
              className={`px-3 py-1 rounded-full text-xs font-headline font-bold flex-shrink-0 transition-all cursor-pointer border ${
                isSel
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
              }`}
            >
              {isHi ? c.nameHi : c.name}
            </button>
          );
        })}
      </div>

      {/* Selected City Result Dashboard */}
      <div className="bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/50 rounded-2xl border border-emerald-200 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              <span className="text-[10px] font-headline uppercase font-bold text-emerald-800 tracking-wider">
                {selectedCity.agroZone}
              </span>
            </div>
            <h3 className="font-headline text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
              📍 {isHi ? selectedCity.nameHi : selectedCity.name}, {isHi ? selectedCity.stateNameHi : selectedCity.stateName}
            </h3>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span
              className={`px-3.5 py-1 rounded-full text-xs font-headline font-extrabold uppercase border ${getStatusBadge(
                cityEstimation.status
              )}`}
            >
              {cityEstimation.status === 'Early'
                ? isHi ? `${Math.abs(cityEstimation.deviationDays)} दिन पूर्व आगमन` : `${Math.abs(cityEstimation.deviationDays)} Days Early`
                : cityEstimation.status === 'Delayed'
                ? isHi ? `${cityEstimation.deviationDays} दिन विलंब` : `${cityEstimation.deviationDays} Days Delay`
                : isHi ? 'सामान्य समय पर' : 'Near Normal'}
            </span>
          </div>
        </div>

        {/* 4 Core City Climatology Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {/* 1. Normal Onset Date */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
              📅 {isHi ? 'मानक सामान्य आगमन' : 'IMD Normal Onset'}
            </span>
            <span className="font-headline text-base sm:text-lg font-black text-slate-900 mt-1 block">
              {selectedCity.normalOnsetDate}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              {isHi ? 'दीर्घकालिक औसत' : '30-yr Benchmark'}
            </span>
          </div>

          {/* 2. Estimated Arrival for Target Year */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 shadow-2xs">
            <span className="text-[10px] font-headline uppercase font-bold text-emerald-700 block tracking-wider">
              ✨ {prediction.targetYear} {isHi ? 'अनुमानित आगमन' : 'Projected Arrival'}
            </span>
            <span className="font-headline text-base sm:text-lg font-black text-emerald-800 mt-1 block">
              {cityEstimation.estimatedDate}
            </span>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">
              {cityEstimation.confidenceMin} – {cityEstimation.confidenceMax}
            </span>
          </div>

          {/* 3. Earliest Ever Recorded */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
              ⚡ {isHi ? 'सर्वप्रथम आगमन रिकॉर्ड' : 'Earliest Onset Record'}
            </span>
            <span className="font-headline text-base sm:text-lg font-bold text-emerald-700 mt-1 block">
              {selectedCity.earliestRecorded.date}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Year {selectedCity.earliestRecorded.year}
            </span>
          </div>

          {/* 4. Most Delayed Ever Recorded */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
              ⏳ {isHi ? 'सर्वाधिक विलंबित रिकॉर्ड' : 'Latest Delayed Record'}
            </span>
            <span className="font-headline text-base sm:text-lg font-bold text-rose-600 mt-1 block">
              {selectedCity.latestRecorded.date}
            </span>
            <span className="text-[10px] text-slate-500 mt-0.5 block">
              Year {selectedCity.latestRecorded.year}
            </span>
          </div>
        </div>

        {/* Agricultural Sowing Plan & Crops */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
          {/* Sowing Window & Crops */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-slate-800 flex items-center gap-1.5">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isHi ? 'खरीफ बुवाई खिड़की व मुख्य फसलें' : 'Kharif Sowing Window & Crops'}</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                {isHi ? selectedCity.sowingWindowHi : selectedCity.sowingWindow}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 pt-1">
              {(isHi ? selectedCity.primaryCropsHi : selectedCity.primaryCrops).map((crop, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-50 text-slate-800 rounded-lg text-xs font-headline font-semibold border border-slate-200"
                >
                  🌾 {crop}
                </span>
              ))}
            </div>
          </div>

          {/* Tailored Agronomic Advice */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5">
            <span className="text-xs font-headline font-bold text-slate-800 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isHi ? 'कृषि सलाह व तैयारी रणनीति' : 'Field Advisory & Action Plan'}</span>
            </span>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {isHi ? cityEstimation.sowingPrepRecommendationHi : cityEstimation.sowingPrepRecommendation}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
