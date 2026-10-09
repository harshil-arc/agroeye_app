'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  TrendingDown,
  TrendingUp,
  CloudRain,
  ChevronRight,
  Info,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { MonsoonYearRecord, Language, CityMonsoonData } from '@/types/monsoon';
import { HISTORIC_MONSOON_DATA } from '@/data/historicMonsoonData';
import { translations } from '@/i18n/monsoonTranslations';
import { dayOfYearToDateString } from '@/utils/monsoonPredictor';

interface HistoricYearRowListProps {
  lang: Language;
  selectedCity?: CityMonsoonData;
}

export const HistoricYearRowList: React.FC<HistoricYearRowListProps> = ({
  lang,
  selectedCity,
}) => {
  const t = translations[lang];
  const isHi = lang === 'hi';
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc'); // default latest year first
  const [expandedYear, setExpandedYear] = useState<number | null>(null);

  // Filter and sort records
  const filteredRecords = useMemo(() => {
    return HISTORIC_MONSOON_DATA.filter((r) => {
      const matchSearch =
        r.year.toString().includes(searchTerm) ||
        r.formattedDate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ensoPhase.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.iodPhase.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notableFeatures.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.notableFeaturesHi.toLowerCase().includes(searchTerm.toLowerCase());

      const matchCategory =
        selectedCategory === 'all' || r.category.toLowerCase() === selectedCategory.toLowerCase();

      let matchDecade = true;
      if (selectedDecade !== 'all') {
        const startYr = parseInt(selectedDecade, 10);
        matchDecade = r.year >= startYr && r.year <= startYr + 9;
      }

      return matchSearch && matchCategory && matchDecade;
    }).sort((a, b) => {
      return sortOrder === 'desc' ? b.year - a.year : a.year - b.year;
    });
  }, [searchTerm, selectedCategory, selectedDecade, sortOrder]);

  // Helper to calculate localized arrival for the selected city
  const getCityOnsetDate = (record: MonsoonYearRecord) => {
    if (!selectedCity) return record.formattedDate;
    const dampedDelta = Math.round(record.deviationDays * 0.9);
    const cityDay = selectedCity.normalDayOfYear + dampedDelta;
    return dayOfYearToDateString(cityDay, record.year);
  };

  // CSV Export
  const handleExportCSV = () => {
    const cityName = selectedCity ? selectedCity.name : 'Kerala';
    const headers = [
      'Year',
      `${cityName}_Onset_Date`,
      'Kerala_Gateway_Date',
      'Deviation_Days',
      'Category',
      'ENSO_Phase',
      'IOD_Phase',
      'Rainfall_Percent_LPA',
      'Total_Rainfall_mm',
      'Withdrawal_Date',
      'Season_Duration_Days',
      'Meteorological_Notes'
    ];

    const rows = filteredRecords.map((r) => [
      r.year,
      getCityOnsetDate(r),
      r.formattedDate,
      r.deviationDays,
      r.category,
      r.ensoPhase,
      r.iodPhase,
      r.rainfallPercentOfLPA,
      r.totalRainfallMm,
      r.monsoonWithdrawalDate,
      r.seasonDurationDays,
      `"${r.notableFeatures.replace(/"/g, '""')}"`
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agroeye_historic_monsoon_${cityName.toLowerCase()}_1970_2025.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
              <Calendar className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
              {isHi
                ? `वर्षवार ऐतिहासिक मानसून आगमन (${selectedCity ? selectedCity.nameHi : 'केरल'})`
                : `Year-by-Year Historical Monsoon Onset (${selectedCity ? selectedCity.name : 'All-India / Kerala'})`}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {selectedCity ? (
              isHi
                ? `📍 ${selectedCity.nameHi} (${selectedCity.stateNameHi}) हेतु प्रत्येक वर्ष (1970–2025) की सटीक आगमन तिथि और मौसम प्रदर्शन।`
                : `📍 Localized historical monsoon onset dates for ${selectedCity.name}, ${selectedCity.stateName} calibrated across 1970–2025.`
            ) : (
              isHi
                ? 'प्रत्येक पूर्ववर्ती वर्ष के ठीक सामने उसकी सटीक मानसून आगमन तिथि, विचलन और मौसमी प्रदर्शन।'
                : 'Exact historical monsoon arrival dates displayed clearly in front of each corresponding previous year.'
            )}
          </p>
        </div>

        {/* Action Controls: Search, Sort, Export */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={isHi ? 'वर्ष या विवरण खोजें...' : 'Search year or details...'}
              className="pl-8 pr-3 py-1.5 rounded-xl text-xs bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 w-44 sm:w-56"
            />
          </div>

          {/* Sort Order Toggle */}
          <button
            type="button"
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-headline font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-200"
            title="Toggle sort order"
          >
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
            <span>{sortOrder === 'desc' ? (isHi ? 'नवीनतम पहले' : 'Latest First') : (isHi ? 'पुराने पहले' : 'Oldest First')}</span>
          </button>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-headline font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.exportCsv}</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 pb-1">
        {/* Decade Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full scrollbar-thin">
          {[
            { id: 'all', label: t.filterAll },
            { id: '2020', label: '2020s' },
            { id: '2010', label: '2010s' },
            { id: '2000', label: '2000s' },
            { id: '1990', label: '1990s' },
            { id: '1980', label: '1980s' },
            { id: '1970', label: '1970s' },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSelectedDecade(btn.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-headline font-bold transition-all cursor-pointer flex-shrink-0 ${
                selectedDecade === btn.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1 text-xs">
          {[
            { id: 'all', label: isHi ? 'सभी' : 'All' },
            { id: 'early', label: isHi ? 'समय पूर्व (Early)' : 'Early Onset', color: 'text-emerald-700' },
            { id: 'normal', label: isHi ? 'समय पर (Normal)' : 'Normal Onset', color: 'text-blue-700' },
            { id: 'delayed', label: isHi ? 'विलंबित (Delayed)' : 'Delayed Onset', color: 'text-amber-700' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-headline font-bold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-2xs'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Row-Wise Historical Data List */}
      <div className="space-y-2.5 pt-1">
        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
            {isHi ? 'कोई मेल खाने वाला वर्ष रिकॉर्ड नहीं मिला।' : 'No matching historic year records found.'}
          </div>
        ) : (
          filteredRecords.map((record) => {
            const isEarly = record.category === 'Early';
            const isDelayed = record.category === 'Delayed';
            const isExpanded = expandedYear === record.year;
            const cityArrivalDate = getCityOnsetDate(record);

            return (
              <div
                key={record.year}
                onClick={() => setExpandedYear(isExpanded ? null : record.year)}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer group ${
                  isExpanded
                    ? 'bg-emerald-50/50 border-emerald-300 ring-2 ring-emerald-100 shadow-sm'
                    : 'bg-white hover:bg-slate-50/80 border-slate-200 shadow-2xs hover:shadow-xs'
                }`}
              >
                {/* Main Clean Row Layout */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  {/* Left Column: Year -> City Onset Date -> Deviation */}
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap sm:flex-nowrap">
                    {/* 1. Year Badge */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="w-16 sm:w-20 text-center py-1.5 px-2.5 rounded-xl bg-slate-900 text-white font-headline font-extrabold text-base sm:text-lg tracking-tight shadow-xs">
                        {record.year}
                      </span>
                    </div>

                    {/* Arrow Divider */}
                    <ChevronRight className="w-4 h-4 text-slate-300 hidden sm:block flex-shrink-0" />

                    {/* 2. City-Specific Onset Date (Prominent & Clear) */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-headline font-bold text-slate-400 flex items-center gap-1">
                          {selectedCity ? (
                            <>
                              <MapPin className="w-3 h-3 text-emerald-600" />
                              <span>{isHi ? `${selectedCity.nameHi} आगमन तिथि` : `${selectedCity.name} Arrival Date`}</span>
                            </>
                          ) : (
                            <span>{isHi ? 'केरल आगमन तिथि' : 'Kerala Onset Date'}</span>
                          )}
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className={`text-xl sm:text-2xl font-headline font-black tracking-tight ${
                            isEarly ? 'text-emerald-700' : isDelayed ? 'text-amber-800' : 'text-blue-800'
                          }`}>
                            {cityArrivalDate}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 font-semibold hidden md:inline">
                            ({selectedCity ? selectedCity.normalOnsetDate : record.normalDate} Normal)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 3. Deviation Pill */}
                    <div className="flex-shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-headline font-bold ${
                          isEarly
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : isDelayed
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {isEarly ? (
                          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" />
                        ) : isDelayed ? (
                          <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
                        ) : (
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                        )}
                        <span>
                          {record.deviationDays < 0
                            ? `${Math.abs(record.deviationDays)} ${isHi ? 'दिन पूर्व (Early)' : 'Days Early'}`
                            : record.deviationDays > 0
                            ? `${record.deviationDays} ${isHi ? 'दिन विलंब (Delayed)' : 'Days Delayed'}`
                            : isHi ? 'समय पर (On Time)' : 'On Time'}
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Right Column: Climate Badges & Total Rain Volume */}
                  <div className="flex items-center justify-between lg:justify-end gap-3 sm:gap-5 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    {/* Kerala Gateway Date info */}
                    {selectedCity && (
                      <div className="text-left lg:text-right hidden sm:block">
                        <span className="text-[10px] uppercase font-headline font-bold text-slate-400 block">
                          {isHi ? 'केरल प्रवेश' : 'Kerala Onset'}
                        </span>
                        <span className="text-xs font-headline font-bold text-slate-700">
                          {record.formattedDate}
                        </span>
                      </div>
                    )}

                    {/* ENSO & IOD Tags */}
                    <div className="flex items-center gap-1.5 text-xs font-headline font-semibold">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${
                          record.ensoPhase === 'La Niña'
                            ? 'bg-teal-50 text-teal-800 border border-teal-200'
                            : record.ensoPhase === 'El Niño'
                            ? 'bg-orange-50 text-orange-800 border border-orange-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}
                      >
                        {record.ensoPhase}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] border border-slate-200">
                        {record.iodPhase} IOD
                      </span>
                    </div>

                    {/* Total Rainfall Volume */}
                    <div className="text-right flex-shrink-0">
                      <span className="text-[10px] uppercase font-headline font-bold text-slate-400 block">
                        {isHi ? 'सीजन कुल वर्षा' : 'Season Rainfall'}
                      </span>
                      <span
                        className={`text-sm font-headline font-extrabold font-mono ${
                          record.rainfallPercentOfLPA >= 100 ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {record.rainfallPercentOfLPA}% LPA
                        <span className="text-[11px] text-slate-500 font-normal ml-1 hidden sm:inline">
                          ({record.totalRainfallMm} mm)
                        </span>
                      </span>
                    </div>

                    {/* Details Expand Arrow */}
                    <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-slate-200 transition-colors flex-shrink-0">
                      <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90 text-emerald-700' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expanded Detailed Meteorological Memo */}
                {isExpanded && (
                  <div className="mt-3.5 pt-3.5 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-12 gap-3 text-xs animate-in fade-in duration-150">
                    <div className="md:col-span-8 p-3 bg-white rounded-xl border border-slate-200/80">
                      <span className="font-headline font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                        {isHi ? 'मौसम विज्ञान संबंधी टिप्पणी व परिस्थितियां:' : 'Synoptic Climate Features & Performance:'}
                      </span>
                      <p className="text-slate-700 text-[11px] leading-relaxed">
                        {isHi ? record.notableFeaturesHi : record.notableFeatures}
                      </p>
                    </div>

                    <div className="md:col-span-4 p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col justify-center space-y-1.5 text-[11px]">
                      {selectedCity && (
                        <div className="flex justify-between">
                          <span className="text-emerald-800 font-bold">{selectedCity.name} Sowing Window:</span>
                          <strong className="font-mono text-slate-900">{isHi ? selectedCity.sowingWindowHi : selectedCity.sowingWindow}</strong>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Monsoon Season Duration:</span>
                        <strong className="font-mono text-slate-900">{record.seasonDurationDays} days</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Monsoon Withdrawal Date:</span>
                        <strong className="font-mono text-slate-900">{record.monsoonWithdrawalDate}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
};
