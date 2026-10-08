'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import {
  INDIAN_STATES_AND_DISTRICTS,
  StateLocation,
  DistrictLocation,
  findClosestDistrict
} from '@/data/indiaLocations';
import {
  fetchIMDExtendedForecast,
  generateDemoIMDForecast,
  NormalizedIMDForecast,
  IMDWeekForecast
} from '@/lib/imdForecastService';
import {
  computeSowingWindow,
  SUPPORTED_CROPS,
  SoilType,
  CropDuration,
  SowingWindowResult
} from '@/lib/sowingWindowEngine';
import {
  CloudSun,
  MapPin,
  Calendar,
  Droplets,
  Thermometer,
  Wind,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  Search,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Layers,
  CheckCircle2,
  Clock,
  Compass,
  Zap,
  Info,
  ChevronDown,
  ArrowLeft,
  Filter,
  Check,
  Flame,
  Sprout,
  X,
  Radio,
  Sliders,
  HelpCircle
} from 'lucide-react';

export default function IMDForecastPage() {
  // State for Selection
  const [selectedStateName, setSelectedStateName] = useState<string>('Rajasthan');
  const [selectedDistrictName, setSelectedDistrictName] = useState<string>('Jaipur');
  const [stateSearchQuery, setStateSearchQuery] = useState<string>('');
  const [districtSearchQuery, setDistrictSearchQuery] = useState<string>('');
  const [isStateDropdownOpen, setIsStateDropdownOpen] = useState<boolean>(false);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState<boolean>(false);

  // Forecast Data State
  const [forecast, setForecast] = useState<NormalizedIMDForecast | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [activeWeekTab, setActiveWeekTab] = useState<number>(1);
  const [activeChartTab, setActiveChartTab] = useState<'rainfall' | 'temperature'>('rainfall');

  // Sowing Window Simulation Modal State
  const [isSowingModalOpen, setIsSowingModalOpen] = useState<boolean>(false);
  const [selectedCropId, setSelectedCropId] = useState<string>('cotton');
  const [selectedSoilType, setSelectedSoilType] = useState<SoilType>('Alluvial Loam');
  const [selectedCropDuration, setSelectedCropDuration] = useState<CropDuration>('Medium Duration (90-120 days)');
  const [sowingResult, setSowingResult] = useState<SowingWindowResult | null>(null);

  // Find active State & District objects
  const currentStateObj = useMemo(() => {
    return INDIAN_STATES_AND_DISTRICTS.find((s) => s.state === selectedStateName) || INDIAN_STATES_AND_DISTRICTS[0];
  }, [selectedStateName]);

  const currentDistrictObj = useMemo(() => {
    return currentStateObj.districts.find((d) => d.name === selectedDistrictName) || currentStateObj.districts[0];
  }, [currentStateObj, selectedDistrictName]);

  // Filtered States list for search
  const filteredStates = useMemo(() => {
    if (!stateSearchQuery.trim()) return INDIAN_STATES_AND_DISTRICTS;
    return INDIAN_STATES_AND_DISTRICTS.filter((s) =>
      s.state.toLowerCase().includes(stateSearchQuery.toLowerCase())
    );
  }, [stateSearchQuery]);

  // Filtered Districts list for search
  const filteredDistricts = useMemo(() => {
    if (!districtSearchQuery.trim()) return currentStateObj.districts;
    return currentStateObj.districts.filter((d) =>
      d.name.toLowerCase().includes(districtSearchQuery.toLowerCase())
    );
  }, [currentStateObj, districtSearchQuery]);

  // Fetch forecast function
  const loadForecast = useCallback(
    async (forceRefresh: boolean = false, demo: boolean = isDemoMode) => {
      setIsLoading(true);
      setError(null);

      try {
        if (demo) {
          const demoData = generateDemoIMDForecast(
            currentDistrictObj.lat,
            currentDistrictObj.lng,
            currentStateObj.state,
            currentStateObj.code,
            currentDistrictObj.name,
            currentDistrictObj.agroZone,
            currentDistrictObj.imdSubdivision
          );
          setForecast(demoData);
        } else {
          const liveData = await fetchIMDExtendedForecast(
            currentDistrictObj.lat,
            currentDistrictObj.lng,
            currentStateObj.state,
            currentStateObj.code,
            currentDistrictObj.name,
            currentDistrictObj.agroZone,
            currentDistrictObj.imdSubdivision,
            forceRefresh
          );
          setForecast(liveData);
        }
      } catch (err) {
        console.error('Failed to load IMD forecast', err);
        setError('IMD forecast service is temporarily unavailable. Please check internet connectivity or try again.');
      } finally {
        setIsLoading(false);
      }
    },
    [currentDistrictObj, currentStateObj, isDemoMode]
  );

  // Initial load
  useEffect(() => {
    loadForecast(false, isDemoMode);
  }, [selectedDistrictName, selectedStateName, isDemoMode, loadForecast]);

  // Handle "Use My Farm Location"
  const handleUseFarmLocation = () => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('agroeye_saved_farm_location');
        let lat = 24.6128;
        let lng = 73.8821;
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.lat && parsed?.lng) {
            lat = parsed.lat;
            lng = parsed.lng;
          }
        }
        const match = findClosestDistrict(lat, lng);
        if (match) {
          setSelectedStateName(match.state.state);
          setSelectedDistrictName(match.district.name);
        }
      } catch {
        // fallback
      }
    }
  };

  // Compute Sowing Window when modal opens or crop/soil changes
  useEffect(() => {
    if (forecast) {
      const res = computeSowingWindow(forecast, selectedCropId, selectedSoilType, selectedCropDuration);
      setSowingResult(res);
    }
  }, [forecast, selectedCropId, selectedSoilType, selectedCropDuration]);

  // Color helper for anomaly badges
  const getAnomalyBadge = (cat: string, type: 'rain' | 'temp') => {
    if (type === 'rain') {
      if (cat.includes('Above')) {
        return {
          bg: 'bg-emerald-50 text-emerald-800 border-emerald-300',
          dot: 'bg-emerald-600',
          label: cat
        };
      }
      if (cat.includes('Below')) {
        return {
          bg: 'bg-amber-50 text-amber-800 border-amber-300',
          dot: 'bg-amber-600',
          label: cat
        };
      }
      return {
        bg: 'bg-sky-50 text-sky-800 border-sky-300',
        dot: 'bg-sky-600',
        label: 'Normal'
      };
    } else {
      if (cat.includes('Above')) {
        return {
          bg: 'bg-rose-50 text-rose-800 border-rose-300',
          dot: 'bg-rose-600',
          label: cat
        };
      }
      if (cat.includes('Below')) {
        return {
          bg: 'bg-cyan-50 text-cyan-800 border-cyan-300',
          dot: 'bg-cyan-600',
          label: cat
        };
      }
      return {
        bg: 'bg-slate-50 text-slate-700 border-slate-300',
        dot: 'bg-slate-500',
        label: 'Normal'
      };
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 text-slate-900">
      {/* 1. Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors shadow-sm"
              title="Return to Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                <h1 className="font-headline text-base sm:text-lg font-bold text-slate-900">
                  IMD Extended Range Forecast
                </h1>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">
                Coupled Dynamical Ensemble (ERFS) • 2–4 Week Outlook
              </p>
            </div>
          </div>

          {/* Quick Action Badges */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDemoMode(!isDemoMode)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider border transition-all ${
                isDemoMode
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title="Toggle Demo Mode for presentations"
            >
              {isDemoMode ? 'DEMO DATA ACTIVE' : 'LIVE IMD MODE'}
            </button>

            <button
              onClick={() => loadForecast(true, isDemoMode)}
              disabled={isLoading}
              className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync Forecast</span>
            </button>
          </div>
        </div>
      </header>

      {/* Demo Mode Notice Banner if enabled */}
      {isDemoMode && (
        <div className="bg-amber-500 text-white text-xs font-headline font-bold px-4 py-1.5 text-center flex items-center justify-center gap-2 shadow-inner">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>DEMO MODE ACTIVE: Showing calibrated extended simulation for hackathon demonstration.</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-4 space-y-4">
        {/* 2. Step 1 & Step 2 Location Selector Card */}
        <section className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="font-headline text-[10px] uppercase font-bold tracking-widest text-emerald-700 block">
                Meteorological Location Configuration
              </span>
              <h2 className="font-headline text-sm font-bold text-slate-900 mt-0.5">
                Select Indian State &amp; District
              </h2>
            </div>

            <button
              onClick={handleUseFarmLocation}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-headline text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-sm self-start sm:self-auto"
            >
              <Compass className="w-3.5 h-3.5 text-emerald-600" />
              <span>Use My Farm Location</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
            {/* Step 1: Select State Dropdown */}
            <div className="relative">
              <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                Step 1: Select State
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsStateDropdownOpen(!isStateDropdownOpen);
                  setIsDistrictDropdownOpen(false);
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-left font-headline text-xs font-semibold text-slate-800 flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
              >
                <span className="truncate">{selectedStateName}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>

              {isStateDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-64 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search Indian State..."
                      value={stateSearchQuery}
                      onChange={(e) => setStateSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-0.5">
                    {filteredStates.map((st) => (
                      <button
                        key={st.state}
                        type="button"
                        onClick={() => {
                          setSelectedStateName(st.state);
                          setSelectedDistrictName(st.districts[0].name);
                          setIsStateDropdownOpen(false);
                          setStateSearchQuery('');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                          st.state === selectedStateName
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{st.state}</span>
                        {st.state === selectedStateName && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 2: Select District Dropdown */}
            <div className="relative">
              <label className="block font-headline text-xs font-bold text-slate-700 mb-1">
                Step 2: Select District / City
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsDistrictDropdownOpen(!isDistrictDropdownOpen);
                  setIsStateDropdownOpen(false);
                }}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white text-left font-headline text-xs font-semibold text-slate-800 flex items-center justify-between focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-colors"
              >
                <span className="truncate">{selectedDistrictName}</span>
                <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>

              {isDistrictDropdownOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-64 overflow-y-auto">
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      placeholder={`Search in ${selectedStateName}...`}
                      value={districtSearchQuery}
                      onChange={(e) => setDistrictSearchQuery(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-0.5">
                    {filteredDistricts.map((dst) => (
                      <button
                        key={dst.name}
                        type="button"
                        onClick={() => {
                          setSelectedDistrictName(dst.name);
                          setIsDistrictDropdownOpen(false);
                          setDistrictSearchQuery('');
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                          dst.name === selectedDistrictName
                            ? 'bg-emerald-50 text-emerald-800 font-bold'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <span>{dst.name}</span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            Zone: {dst.agroZone.split('(')[0]}
                          </span>
                        </div>
                        {dst.name === selectedDistrictName && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fetch Button & Metadata */}
            <div className="flex flex-col justify-end">
              <button
                type="button"
                onClick={() => loadForecast(true, isDemoMode)}
                disabled={isLoading}
                className="w-full h-11 rounded-xl bg-slate-900 hover:bg-emerald-700 text-white font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm active:scale-98 transition-all disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Retrieving IMD ERFS...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <span>Get IMD Forecast</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl bg-rose-50 border border-rose-200 p-4 text-rose-800 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-headline text-sm font-bold">Forecast Retrieval Notice</h4>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">{error}</p>
              <button
                onClick={() => loadForecast(true, isDemoMode)}
                className="mt-2 text-xs font-bold underline hover:text-rose-900"
              >
                Retry Request
              </button>
            </div>
          </div>
        )}

        {/* 3. Forecast Header & Metadata Overview */}
        {forecast && (
          <>
            <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white p-4 sm:p-5 shadow-md border border-emerald-800/40 relative overflow-hidden">
              <div className="absolute -right-12 -bottom-12 w-48 h-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-headline text-[10px] uppercase font-bold tracking-widest mb-1.5">
                    <MapPin className="w-3 h-3" />
                    <span>{forecast.location.district}, {forecast.location.state}</span>
                  </div>
                  <h2 className="font-headline text-xl sm:text-2xl font-bold tracking-tight">
                    IMD Extended Range Forecast
                  </h2>
                  <p className="text-xs text-slate-300 font-medium mt-0.5">
                    {forecast.location.agroClimaticZone} • IMD Sub-Division: {forecast.location.imdSubdivision}
                  </p>
                </div>

                <div className="flex flex-col sm:items-end gap-1 text-[11px] text-slate-300 font-medium">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 border border-white/15">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        forecast.isOffline ? 'bg-amber-400' : forecast.isCached ? 'bg-sky-400' : 'bg-emerald-400 animate-pulse'
                      }`}
                    />
                    <span className="font-headline uppercase font-bold text-[10px]">
                      {forecast.isOffline
                        ? 'Offline Cached'
                        : forecast.isCached
                        ? 'Cached Response'
                        : 'Live Ingest'}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">
                    Forecast Horizon: {forecast.forecastPeriod}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Updated: {forecast.lastSuccessfulUpdate} • Source: IMD ERFS
                  </span>
                </div>
              </div>

              {/* Sowing Suitability Topline Badge */}
              <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-headline font-bold text-sm">
                    {forecast.sowingSuitabilityIndex.scorePercent}%
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-300 uppercase font-bold block">
                      Sowing Window Feasibility
                    </span>
                    <span className="font-headline text-sm font-bold text-emerald-300">
                      {forecast.sowingSuitabilityIndex.overallFeasibility}
                    </span>
                  </div>
                </div>

                {/* Direct CTA to Sowing Window Engine */}
                <button
                  type="button"
                  onClick={() => setIsSowingModalOpen(true)}
                  className="h-10 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-headline text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                >
                  <Sprout className="w-4 h-4 text-slate-950" />
                  <span>Find Best Sowing Window →</span>
                </button>
              </div>
            </section>

            {/* 4. 2–4 Week Forecast Cards */}
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-headline text-sm font-bold text-slate-900 uppercase tracking-wide">
                    2–4 Week Forecast Breakdown
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">
                  Aggregated Weekly Climatology &amp; Anomaly
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {forecast.weeks.map((wk) => {
                  const rainBadge = getAnomalyBadge(wk.rainfall.category, 'rain');
                  const tempBadge = getAnomalyBadge(wk.temperature.category, 'temp');

                  return (
                    <div
                      key={wk.weekNumber}
                      onClick={() => setActiveWeekTab(wk.weekNumber)}
                      className={`rounded-2xl p-4 transition-all border cursor-pointer ${
                        activeWeekTab === wk.weekNumber
                          ? 'bg-white border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                          : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      {/* Week Header */}
                      <div className="flex items-start justify-between gap-1 pb-2.5 border-b border-slate-100">
                        <div>
                          <span className="font-headline text-xs font-bold text-slate-900 block">
                            {wk.weekLabel}
                          </span>
                          <span className="text-[11px] text-slate-500 font-medium">
                            {wk.dateRange}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full font-headline text-[10px] font-bold uppercase ${
                            wk.confidence === 'High'
                              ? 'bg-emerald-50 text-emerald-700'
                              : wk.confidence === 'Moderate'
                              ? 'bg-sky-50 text-sky-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {wk.confidence} Conf.
                        </span>
                      </div>

                      {/* Key Indicators */}
                      <div className="space-y-2.5 mt-3">
                        {/* Rainfall Metric */}
                        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <Droplets className="w-3.5 h-3.5 text-sky-600" />
                              <span>Rainfall</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-headline font-bold border ${rainBadge.bg}`}
                            >
                              {rainBadge.label}
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between">
                            <span className="font-headline text-lg font-bold text-slate-900">
                              {wk.rainfall.forecastAmountMm} <span className="text-xs text-slate-500 font-normal">mm</span>
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Normal: {wk.rainfall.normalAmountMm} mm ({wk.rainfall.departurePercent >= 0 ? `+${wk.rainfall.departurePercent}` : wk.rainfall.departurePercent}%)
                            </span>
                          </div>
                        </div>

                        {/* Temperature Metric */}
                        <div className="rounded-xl bg-slate-50 p-2.5 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                              <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                              <span>Temperature</span>
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-headline font-bold border ${tempBadge.bg}`}
                            >
                              {tempBadge.label}
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline justify-between font-headline text-xs font-bold text-slate-800">
                            <span>Max: {wk.temperature.maxAvg}°C</span>
                            <span>Min: {wk.temperature.minAvg}°C</span>
                          </div>
                        </div>

                        {/* Synthetic Soil Moisture Metric */}
                        <div className="rounded-xl bg-emerald-50/60 p-2.5 border border-emerald-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                              Estimated Moisture
                            </span>
                            <span className="font-headline text-[11px] font-bold text-emerald-700">
                              {wk.syntheticSoilMoisture.outlook}
                            </span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="font-headline text-sm font-bold text-slate-900">
                              ~{wk.syntheticSoilMoisture.estimatedPercent}% VWC
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              {wk.syntheticSoilMoisture.trend}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 5. Farmer-Friendly Visual Charts */}
            <section className="rounded-2xl bg-white border border-slate-200/90 p-4 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  <div>
                    <h3 className="font-headline text-sm font-bold text-slate-900">
                      Forecast Visual Trends
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Extended Range Probabilities &amp; Normal Baselines
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('rainfall')}
                    className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-colors ${
                      activeChartTab === 'rainfall'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌧 Rainfall Trend
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChartTab('temperature')}
                    className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-colors ${
                      activeChartTab === 'temperature'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌡 Temperature Trend
                  </button>
                </div>
              </div>

              {/* Chart Body */}
              <div className="pt-4">
                {activeChartTab === 'rainfall' ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {forecast.weeks.map((wk) => (
                        <div key={wk.weekNumber} className="flex flex-col items-center gap-1">
                          <div className="w-full bg-slate-100 rounded-xl h-36 flex flex-col justify-end p-2 relative overflow-hidden">
                            {/* Normal baseline reference line */}
                            <div
                              className="absolute left-0 right-0 border-t-2 border-dashed border-slate-400 z-10"
                              style={{ bottom: `${Math.min(90, Math.max(15, wk.rainfall.normalAmountMm * 2))}%` }}
                              title={`Normal Climatological Baseline: ${wk.rainfall.normalAmountMm}mm`}
                            />

                            {/* Bar fill */}
                            <div
                              className={`w-full rounded-lg transition-all duration-500 ${
                                wk.rainfall.category.includes('Above')
                                  ? 'bg-emerald-500'
                                  : wk.rainfall.category.includes('Below')
                                  ? 'bg-amber-500'
                                  : 'bg-sky-500'
                              }`}
                              style={{
                                height: `${Math.min(100, Math.max(15, (wk.rainfall.forecastAmountMm / 70) * 100))}%`
                              }}
                            />
                          </div>
                          <span className="font-headline text-xs font-bold text-slate-800 mt-1">
                            {wk.weekLabel}
                          </span>
                          <span className="text-[11px] text-slate-600 font-semibold">
                            {wk.rainfall.forecastAmountMm} mm
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Prob: {wk.rainfall.probabilityOfRain}%
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 pt-2">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-emerald-500" /> Above Normal
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-sky-500" /> Normal
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-amber-500" /> Below Normal
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400" /> IMD Climatological Normal
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-4 gap-2 text-center">
                      {forecast.weeks.map((wk) => (
                        <div key={wk.weekNumber} className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex flex-col justify-between h-36">
                          <div>
                            <span className="font-headline text-xs font-bold text-slate-800 block">
                              {wk.weekLabel}
                            </span>
                            <span className="text-[10px] text-slate-500">{wk.dateRange}</span>
                          </div>
                          <div className="my-1">
                            <span className="font-headline text-xl font-bold text-amber-700 block">
                              {wk.temperature.maxAvg}°C
                            </span>
                            <span className="font-headline text-xs font-bold text-cyan-700">
                              Min {wk.temperature.minAvg}°C
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            Departure: {wk.temperature.departureMax > 0 ? `+${wk.temperature.departureMax}` : wk.temperature.departureMax}°C
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* 6. "What does this mean for your farm?" Agricultural Interpretation */}
            <section className="rounded-2xl bg-white border border-slate-200/90 p-4 sm:p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-headline text-base font-bold text-slate-900">
                    What does this mean for your farm?
                  </h3>
                  <span className="text-xs text-slate-500 font-medium">
                    Rule-Based Agricultural Decision Support generated from IMD ERFS data
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {forecast.agriculturalAdvisories.map((adv) => (
                  <div
                    key={adv.id}
                    className="rounded-xl bg-slate-50/80 border border-slate-200/80 p-3.5 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="font-headline text-[10px] uppercase font-bold tracking-wider text-slate-500">
                          {adv.category.replace('_', ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full font-headline text-[10px] font-bold uppercase ${
                            adv.level === 'Optimal' || adv.level === 'Favorable'
                              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              : adv.level === 'Caution'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-rose-50 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {adv.level}
                        </span>
                      </div>
                      <h4 className="font-headline text-xs font-bold text-slate-900 leading-snug">
                        {adv.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                        {adv.statement}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-200/60">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase">
                        Action Directive • {adv.timingWindow}
                      </span>
                      <p className="text-xs text-emerald-900 font-semibold mt-0.5">
                        {adv.recommendedAction}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 7. Synthetic Soil Moisture Estimation Notice Section */}
            <section className="rounded-2xl bg-sky-50/70 border border-sky-200 p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-headline text-xs uppercase font-bold tracking-wider text-sky-900">
                    Synthetic Soil Moisture Estimation Model (FAO-56 Water Balance)
                  </h4>
                  <p className="text-xs text-sky-800 leading-relaxed">
                    Soil moisture values shown here are <strong>Estimated Soil Moisture</strong> calculated from forecasted precipitation, reference evapotranspiration (ET0), and Antecedent Precipitation Index (API). These are distinct from <strong>Measured Soil Moisture</strong> provided by physical in-situ sensors on your field node.
                  </p>
                  <div className="flex flex-wrap gap-4 pt-1 text-[11px] font-semibold text-sky-900">
                    <span>Baseline Soil: {forecast.syntheticMoistureSummary.baselineSoilType}</span>
                    <span>Current Est. VWC: {forecast.syntheticMoistureSummary.currentEstimatedVwc}%</span>
                    <span>2-Week Est. VWC: {forecast.syntheticMoistureSummary.forecasted2WeekVwc}%</span>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* 8. Interactive Sowing Window Probability Engine Modal / Drawer */}
      {isSowingModalOpen && sowingResult && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-4 sm:p-5 flex items-start justify-between">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-headline text-[10px] uppercase font-bold tracking-wider mb-1">
                  <Sprout className="w-3 h-3" />
                  <span>AgroEye Sowing Window Probability Engine</span>
                </div>
                <h3 className="font-headline text-lg sm:text-xl font-bold">
                  Recommended Sowing Window Analysis
                </h3>
                <p className="text-xs text-slate-300">
                  {sowingResult.location.district}, {sowingResult.location.state} • {sowingResult.location.agroClimaticZone}
                </p>
              </div>

              <button
                onClick={() => setIsSowingModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              {/* Parameter Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                {/* Crop Selector */}
                <div>
                  <label className="block font-headline text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Select Target Crop
                  </label>
                  <select
                    value={selectedCropId}
                    onChange={(e) => setSelectedCropId(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-headline text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {SUPPORTED_CROPS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.season})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Soil Type Selector */}
                <div>
                  <label className="block font-headline text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Field Soil Classification
                  </label>
                  <select
                    value={selectedSoilType}
                    onChange={(e) => setSelectedSoilType(e.target.value as SoilType)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white font-headline text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="Alluvial Loam">Alluvial Loam (दोमट मिट्टी)</option>
                    <option value="Black Cotton Soil (Heavy Clay)">Black Cotton Soil (काली मिट्टी)</option>
                    <option value="Sandy Loam / Light Soil">Sandy Loam / Light Soil (बलुई मिट्टी)</option>
                    <option value="Red & Lateritic Soil">Red &amp; Lateritic Soil (लाल मिट्टी)</option>
                  </select>
                </div>
              </div>

              {/* Primary Output Banner */}
              <div className="rounded-2xl bg-emerald-50 border border-emerald-200/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="font-headline text-[10px] uppercase font-bold tracking-widest text-emerald-800 block">
                    Optimal Planting Horizon
                  </span>
                  <h4 className="font-headline text-2xl font-bold text-slate-900 mt-0.5">
                    {sowingResult.recommendedWindowDateRange}
                  </h4>
                  <p className="text-xs text-emerald-800 font-medium mt-1">
                    Week {sowingResult.recommendedWeekNumber} of Extended Forecast • {sowingResult.soilMoistureStatusSummary}
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-emerald-200 shadow-sm flex-shrink-0">
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Sowing Probability
                    </span>
                    <span className="font-headline text-2xl font-bold text-emerald-600 font-tabular">
                      {sowingResult.sowingProbabilityPercent}%
                    </span>
                  </div>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase block">
                      Confidence
                    </span>
                    <span className="font-headline text-xs font-bold text-slate-800 uppercase block mt-1">
                      {sowingResult.confidence}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scientific Agronomic Rationale */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">
                  Agronomic Rationale
                </span>
                <p className="text-xs text-slate-700 leading-relaxed font-medium mt-1">
                  {sowingResult.reason}
                </p>
              </div>

              {/* Component Score Matrix */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Moisture Match</span>
                  <span className="font-headline text-base font-bold text-slate-900 mt-0.5 block">
                    {sowingResult.scores.soilMoistureAdequacy}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Rain Timing</span>
                  <span className="font-headline text-base font-bold text-slate-900 mt-0.5 block">
                    {sowingResult.scores.rainfallTimingScore}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] text-slate-500 uppercase block font-bold">Thermal Range</span>
                  <span className="font-headline text-base font-bold text-slate-900 mt-0.5 block">
                    {sowingResult.scores.thermalSafetyScore}%
                  </span>
                </div>
              </div>

              {/* Action Directives */}
              <div className="space-y-1.5">
                <span className="font-headline text-xs font-bold text-slate-900 block">
                  Farmer Field Checklist
                </span>
                <ul className="space-y-1 text-xs text-slate-600">
                  {sowingResult.actionChecklist.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">
                Connected to AgroEye Decision Engine
              </span>
              <button
                type="button"
                onClick={() => setIsSowingModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-headline text-xs font-bold shadow-sm active:scale-95 transition-all"
              >
                Close Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
