'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useFarmData } from '@/context/FarmDataContext';
import {
  fetchRealWeatherData,
  LiveWeatherResult,
  SpatialHazard,
  NaturalEventReport,
  HistoricalWeatherDay,
} from '@/lib/realWeatherApi';
import { NearbyRegionInfo } from '@/components/RealLeafletMap';
import {
  Sun,
  CloudSun,
  CloudRain,
  Wind,
  Droplets,
  Gauge,
  Thermometer,
  Compass,
  AlertTriangle,
  MapPin,
  Check,
  Info,
  Sparkles,
  Zap,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Flame,
  Waves,
  RefreshCw,
  Search,
  Radio,
  ArrowUpRight,
  Eye,
  Cloud,
  ChevronRight,
  Calendar,
  BarChart3,
  TrendingUp,
  FileText,
  Clock,
  ArrowLeft,
  X,
  Crosshair,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

// Dynamically import Leaflet GIS Map with SSR disabled
const RealLeafletMap = dynamic(() => import('@/components/RealLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[16/11] sm:aspect-[21/9] rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-slate-800 text-slate-400 gap-2">
      <div className="flex items-center gap-2 text-emerald-400 font-headline text-sm font-bold">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        Initializing Real Satellite GIS Map &amp; Spatial Calamity Vectors...
      </div>
      <span className="text-xs text-slate-500">Loading Esri Satellite Imagery &amp; Real-Time Radar Tiles</span>
    </div>
  ),
});

const DEFAULT_FARM_LOCATION = {
  lat: 24.6128,
  lng: 73.8821,
  name: 'my Farm • Dabok Sector 1',
};

export default function WeatherPage() {
  const { sensors } = useFarmData();
  
  // Farm coordinates state (with localStorage persistence)
  const [farmLocation, setFarmLocation] = useState<{ lat: number; lng: number; name: string }>(DEFAULT_FARM_LOCATION);
  const [isMarkingFarm, setIsMarkingFarm] = useState<boolean>(false);
  const [showSavedToast, setShowSavedToast] = useState<boolean>(false);
  
  // Real weather API state
  const [weatherData, setWeatherData] = useState<LiveWeatherResult | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Active tabs & Modals
  const [activeHistoryGraph, setActiveHistoryGraph] = useState<'temperature' | 'rainfall' | 'humidity'>('temperature');
  const [selectedEventReport, setSelectedEventReport] = useState<NaturalEventReport | null>(null);
  const [selectedHazardModal, setSelectedHazardModal] = useState<SpatialHazard | null>(null);
  const [completedPrecautions, setCompletedPrecautions] = useState<Record<string, boolean>>({});

  // Restore saved farm location from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agroeye_saved_farm_location');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.lat && parsed.lng) {
            setFarmLocation(parsed);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // Fetch real Open-Meteo weather data
  const loadWeatherData = useCallback(async (lat: number, lng: number, label: string) => {
    setIsLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await fetchRealWeatherData(lat, lng, label);
      setWeatherData(data);
    } catch (err: any) {
      console.error('Failed to fetch real weather data:', err);
      setWeatherError('Failed to connect to real-time meteorological API. Retrying...');
    } finally {
      setIsLoadingWeather(false);
    }
  }, []);

  // Load weather when farmLocation changes
  useEffect(() => {
    loadWeatherData(farmLocation.lat, farmLocation.lng, farmLocation.name);
  }, [farmLocation.lat, farmLocation.lng, farmLocation.name, loadWeatherData]);

  // Handle farm relocation from Map click or search
  const handleFarmLocationSelect = (lat: number, lng: number, placeName?: string) => {
    const name = placeName || `Farm Landmark (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
    const updated = { lat, lng, name };
    setFarmLocation(updated);
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroeye_saved_farm_location', JSON.stringify(updated));
    }
    
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 4000);
    setIsMarkingFarm(false);
  };

  const togglePrecaution = (key: string) => {
    setCompletedPrecautions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Helper for Temperature History SVG Curve
  const renderTemperatureChart = (history: HistoricalWeatherDay[]) => {
    if (!history || history.length === 0) return null;
    const maxVal = Math.max(...history.map((h) => h.tempMax), 40);
    const minVal = Math.min(...history.map((h) => h.tempMin), 15);
    const range = maxVal - minVal || 1;
    const width = 500;
    const height = 140;
    const padding = 30;

    const pointsMax = history.map((item, idx) => {
      const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((item.tempMax - minVal) / range) * (height - padding * 2);
      return { x, y, val: item.tempMax, day: item.dayName, date: item.date };
    });

    const pointsMin = history.map((item, idx) => {
      const x = padding + (idx / (history.length - 1)) * (width - padding * 2);
      const y = height - padding - ((item.tempMin - minVal) / range) * (height - padding * 2);
      return { x, y, val: item.tempMin, day: item.dayName, date: item.date };
    });

    const pathDMax = pointsMax.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    const pathDMin = pointsMin.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[380px] h-36">
          {/* Horizontal Gridlines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Area fill between Max and Min */}
          <path
            d={`${pathDMax} L ${pointsMin[pointsMin.length - 1].x} ${pointsMin[pointsMin.length - 1].y} ${pointsMin.slice().reverse().map((p) => `L ${p.x} ${p.y}`).join(' ')} Z`}
            fill="#fef3c7"
            opacity="0.4"
          />

          {/* Curve Lines */}
          <path d={pathDMax} fill="none" stroke="#d97706" strokeWidth="2.5" />
          <path d={pathDMin} fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 3" />

          {/* Max Temp Circles & Labels */}
          {pointsMax.map((p, i) => (
            <g key={`max-${i}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
              <text x={p.x} y={p.y - 7} textAnchor="middle" className="text-[10px] font-headline font-bold fill-amber-800">
                {p.val}°
              </text>
              <text x={p.x} y={height - 10} textAnchor="middle" className="text-[9px] font-headline font-semibold fill-slate-500">
                {p.day}
              </text>
            </g>
          ))}

          {/* Min Temp Circles & Labels */}
          {pointsMin.map((p, i) => (
            <g key={`min-${i}`}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <text x={p.x} y={p.y + 12} textAnchor="middle" className="text-[9px] font-headline font-semibold fill-sky-700">
                {p.val}°
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Helper for Rainfall History Bar Chart
  const renderRainfallChart = (history: HistoricalWeatherDay[]) => {
    if (!history || history.length === 0) return null;
    const maxRain = Math.max(...history.map((h) => h.rainSum), 20);

    return (
      <div className="space-y-2">
        <div className="flex items-end justify-between gap-2 h-32 pt-4 px-2">
          {history.map((item, idx) => {
            const heightPercent = Math.max(8, (item.rainSum / maxRain) * 100);
            const hasRain = item.rainSum > 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                <span className="text-[10px] font-headline font-bold text-slate-700 font-mono">
                  {item.rainSum > 0 ? `${item.rainSum}mm` : '0'}
                </span>
                <div
                  className={`w-full max-w-[28px] rounded-t-lg transition-all ${
                    hasRain
                      ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-sm'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-headline font-semibold text-slate-500 mt-1">
                  {item.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Helper for Humidity & VPD History Graph
  const renderHumidityChart = (history: HistoricalWeatherDay[]) => {
    if (!history || history.length === 0) return null;
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-1.5 pt-2">
          {history.map((item, idx) => (
            <div key={idx} className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center">
              <span className="text-[10px] text-slate-500 font-semibold">{item.dayName}</span>
              <Droplets className="w-4 h-4 text-sky-600 my-1" />
              <span className="font-headline text-xs font-bold text-slate-900">{item.humidityAvg}%</span>
              <span className="text-[9px] text-slate-400 font-mono mt-0.5">ET₀ {item.et0}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-4">
      {/* 1. Page Header & Farm Landmark Status */}
      <section className="px-4 pt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Link href="/" className="text-slate-400 hover:text-slate-800 transition-colors">
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-headline text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                AgroEye • Weather &amp; Farm Safety
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <h1 className="font-headline text-2xl font-bold text-slate-900 tracking-tight">
                📍 {farmLocation.name}
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live meteorological station &amp; spatial calamity vectors calibrated for your marked farm.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 📍 Mark Your Farm Main Action Button */}
            <button
              type="button"
              onClick={() => setIsMarkingFarm(!isMarkingFarm)}
              className={`h-11 px-4 rounded-xl font-headline text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                isMarkingFarm
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 ring-4 ring-amber-300'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>{isMarkingFarm ? '📍 Tap Map to Save Pin' : '📍 Mark Your Farm'}</span>
            </button>
          </div>
        </div>
      </section>

      {/* Farm Location Saved Toast */}
      {showSavedToast && (
        <div className="px-4">
          <div className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 text-xs font-headline font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Farm location saved! All weather telemetry &amp; spatial hazards are now anchored to your farm.</span>
            </div>
            <button onClick={() => setShowSavedToast(false)} className="text-white/80 hover:text-white">✕</button>
          </div>
        </div>
      )}

      {/* 2. LARGE INTERACTIVE MAP WITH SPATIAL HAZARDS AROUND THE FARM */}
      <section className="px-4">
        <div className="bg-slate-950 rounded-2xl border border-slate-200 overflow-hidden shadow-md flex flex-col">
          {/* Map Sub-Header Bar */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-headline text-xs font-bold text-white uppercase tracking-wider">
                🗺️ Spatial Calamity &amp; Environmental Hazard Radar
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-headline text-[10px] text-amber-300 font-bold bg-black/60 px-2 py-1 rounded border border-amber-500/30">
                ⚠️ Interactive spatial hazards relative to YOUR FARM
              </span>
            </div>
          </div>

          {/* Real Leaflet Map Component */}
          <RealLeafletMap
            lat={farmLocation.lat}
            lng={farmLocation.lng}
            locationName={farmLocation.name}
            onLocationSelect={handleFarmLocationSelect}
            isMarkingFarm={isMarkingFarm}
            weatherData={weatherData}
          />
        </div>
      </section>

      {/* Spatial Hazards Relative to Farm Strip */}
      {weatherData && weatherData.spatialHazards && (
        <section className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-600" />
                <h3 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                  Surrounding Calamities Relative to Your Farm
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium font-mono">
                {weatherData.spatialHazards.length} Spatial Zones Detected
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
              {weatherData.spatialHazards.map((haz) => (
                <div
                  key={haz.id}
                  onClick={() => setSelectedHazardModal(haz)}
                  className="p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-400 group"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-base">{haz.emoji}</span>
                    <span
                      className={`text-[9px] font-headline font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        haz.severity === 'Critical'
                          ? 'bg-rose-100 text-rose-800'
                          : haz.severity === 'High'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {haz.severity}
                    </span>
                  </div>
                  <h4 className="font-headline text-xs font-bold text-slate-900 mt-1 truncate group-hover:text-emerald-700">
                    {haz.title}
                  </h4>
                  <div className="mt-1 text-[10px] text-slate-500 font-medium">
                    <span>{haz.distanceKm} km {haz.direction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. 🌦️ CURRENT CONDITIONS DASHBOARD */}
      {weatherData && (
        <section className="px-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/50 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between relative z-10 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 w-fit mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-headline text-[10px] text-emerald-800 uppercase tracking-wider font-bold">
                    🌦️ Live Current Weather at Your Farm
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="font-headline text-4xl sm:text-5xl font-bold text-slate-900 tracking-tight font-tabular">
                    {Math.round(weatherData.current.temperature)}°C
                  </span>
                  <span className="text-base text-emerald-700 font-bold">
                    {weatherData.current.weatherCondition}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 font-medium">
                  Feels like {Math.round(weatherData.current.apparentTemperature)}°C • Cloud Cover {weatherData.current.cloudCover}% • Visibility {weatherData.current.visibilityKm} km
                </p>
              </div>

              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center shadow-xs flex-shrink-0">
                <CloudSun className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            {/* 8-Metric Comprehensive Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5 bg-slate-50/90 border border-slate-200/70 rounded-xl p-3">
              {/* 1. Temp & Soil Temp */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Ambient &amp; Soil</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.temperature}°C / {weatherData.current.soilTemperature}°C
                </span>
                <span className="text-[10px] text-slate-500 font-medium">ESP32: {sensors.temperature}°C</span>
              </div>

              {/* 2. Humidity & VPD */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Humidity &amp; VPD</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.humidity}% RH
                </span>
                <span className="text-[10px] text-slate-500 font-medium">VPD: {weatherData.current.vpd} kPa</span>
              </div>

              {/* 3. Rainfall Rate */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <CloudRain className="w-3.5 h-3.5 text-blue-600" />
                  <span>Rainfall Rate</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.precipitation} mm/h
                </span>
                <span className="text-[10px] text-slate-500 font-medium">24h Sum: {weatherData.forecast[0]?.rainSum || 0} mm</span>
              </div>

              {/* 4. Wind Speed & Direction */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>Wind Velocity</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.windSpeed} km/h
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Heading: {weatherData.current.windDirection} • Gusts {weatherData.current.windGusts}kph
                </span>
              </div>

              {/* 5. Cloud Coverage */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Cloud className="w-3.5 h-3.5 text-slate-500" />
                  <span>Cloud Coverage</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.cloudCover}%
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Overcast Level</span>
              </div>

              {/* 6. UV Index & Solar */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>UV Index &amp; Sun</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  UV {weatherData.current.uvIndex} (Index)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Peak Solar Irradiance</span>
              </div>

              {/* 7. Visibility */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Field Visibility</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.visibilityKm} km
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Clear Sight Distance</span>
              </div>

              {/* 8. Soil Moisture & ET0 */}
              <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Soil &amp; ET₀ Loss</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.soilMoisturePercent}% ({weatherData.current.et0} mm/d)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">ESP32: {sensors.soilMoisture}%</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 4. 📅 24-HOUR HOURLY & 7-DAY REGIONAL FORECAST */}
      {weatherData && (
        <section className="px-4 space-y-3">
          {/* 24-Hour Hourly Forecast Carousel */}
          {weatherData.hourlyForecast.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <h3 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                    Next 24 Hours Hourly Forecast
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500 font-medium">Hourly Open-Meteo Ingest</span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
                {weatherData.hourlyForecast.map((hour, idx) => (
                  <div
                    key={idx}
                    className="min-w-[80px] p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center flex-shrink-0"
                  >
                    <span className="text-[11px] font-headline font-semibold text-slate-600">{hour.hourLabel}</span>
                    <div className="my-1.5 text-amber-500">
                      {hour.precipitationProbability > 40 ? (
                        <CloudRain className="w-5 h-5 text-sky-600" />
                      ) : hour.precipitationProbability > 15 ? (
                        <CloudSun className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Sun className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <span className="font-headline text-xs font-bold text-slate-900">{hour.temperature}°C</span>
                    <span className="text-[10px] text-sky-600 font-medium mt-0.5">{hour.precipitationProbability}% rain</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7-Day Regional Agronomic Forecast */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-600" />
                <h3 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                  7-Day Regional Forecast &amp; Spray Advisory
                </h3>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">Daily Spray Index</span>
            </div>

            <div className="space-y-2">
              {weatherData.forecast.map((day, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 text-amber-500 shadow-2xs">
                      {day.rainChance > 40 || day.rainSum > 2 ? (
                        <CloudRain className="w-5 h-5 text-sky-600" />
                      ) : day.rainChance > 15 ? (
                        <CloudSun className="w-5 h-5 text-amber-500" />
                      ) : (
                        <Sun className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-headline text-sm font-bold text-slate-900">{day.day}</span>
                        <span className="text-xs text-slate-500">{day.date}</span>
                      </div>
                      <span className="text-xs text-slate-600">{day.condition}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200">
                    <div className="flex items-center gap-1 text-xs text-slate-600">
                      <Droplets className="w-3.5 h-3.5 text-sky-600" />
                      <span className="font-headline font-semibold">{day.rainChance}% ({day.rainSum} mm)</span>
                    </div>

                    <div className="font-headline text-xs font-bold text-slate-900 font-tabular">
                      <span>{day.tempMax}°</span>
                      <span className="text-slate-400 mx-1">/</span>
                      <span className="text-slate-500 font-normal">{day.tempMin}°</span>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full font-headline text-[10px] font-bold uppercase tracking-wider ${
                        day.sprayCondition === 'Optimal Window'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : day.sprayCondition === 'Caution'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}
                    >
                      {day.sprayCondition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 5. ⚠️ NATURAL CALAMITY RISK SECTION */}
      {weatherData && (
        <section className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
                <div>
                  <h2 className="font-headline text-base font-bold text-slate-900">
                    ⚠️ Natural Calamity &amp; Disaster Risk Board
                  </h2>
                  <span className="text-xs text-slate-500">
                    Calibrated threat probabilities for {farmLocation.name}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-headline text-[10px] font-bold uppercase">
                {weatherData.calamityRiskTable.length} Monitored Risks
              </span>
            </div>

            {/* Calamity Risk Table Matrix */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-headline uppercase text-[10px] tracking-wider">
                    <th className="pb-2 font-bold">Natural Event</th>
                    <th className="pb-2 font-bold">Risk Level</th>
                    <th className="pb-2 font-bold">Expected Onset</th>
                    <th className="pb-2 font-bold hidden md:table-cell">Details &amp; Precaution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {weatherData.calamityRiskTable.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 pr-2">
                        <div className="flex items-center gap-2 font-headline font-bold text-slate-900">
                          <span className="text-base">{row.emoji}</span>
                          <span>{row.event}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-headline text-[10px] font-extrabold uppercase ${
                            row.risk === 'Critical'
                              ? 'bg-rose-100 text-rose-900 border border-rose-200'
                              : row.risk === 'High'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : row.risk === 'Medium'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {row.risk} ({row.riskPercent}%)
                        </span>
                      </td>
                      <td className="py-3 pr-2 font-headline font-semibold text-slate-700">
                        {row.expected}
                      </td>
                      <td className="py-3 text-slate-600 hidden md:table-cell max-w-xs truncate">
                        <span>{row.precaution}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 6. 📊 WEATHER HISTORY (INTERACTIVE VISUAL GRAPHS) */}
      {weatherData && (
        <section className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="font-headline text-base font-bold text-slate-900">
                    📊 Weather History &amp; Visual Trends
                  </h3>
                  <span className="text-xs text-slate-500">
                    Real past 7-day meteorological curves for your farm coordinates
                  </span>
                </div>
              </div>

              {/* History Graph Type Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveHistoryGraph('temperature')}
                  className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-all ${
                    activeHistoryGraph === 'temperature'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌡️ Temperature
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHistoryGraph('rainfall')}
                  className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-all ${
                    activeHistoryGraph === 'rainfall'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🌧️ Rainfall
                </button>
                <button
                  type="button"
                  onClick={() => setActiveHistoryGraph('humidity')}
                  className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-all ${
                    activeHistoryGraph === 'humidity'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  💧 Humidity
                </button>
              </div>
            </div>

            {/* Active Rendered Visual Graph */}
            <div className="pt-2">
              {activeHistoryGraph === 'temperature' && renderTemperatureChart(weatherData.history)}
              {activeHistoryGraph === 'rainfall' && renderRainfallChart(weatherData.history)}
              {activeHistoryGraph === 'humidity' && renderHumidityChart(weatherData.history)}
            </div>
          </div>
        </section>
      )}

      {/* 7. 📋 NATURAL EVENT REPORT HISTORY */}
      {weatherData && (
        <section className="px-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-headline text-base font-bold text-slate-900">
                    📋 Natural Event Report History
                  </h3>
                  <span className="text-xs text-slate-500">
                    Historical meteorological extremes and impact reports affecting this farm
                  </span>
                </div>
              </div>
              <span className="text-xs font-headline font-semibold text-indigo-700">
                Archived Log
              </span>
            </div>

            <div className="space-y-2">
              {weatherData.naturalEventsHistory.map((report) => (
                <div
                  key={report.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-indigo-300 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-2xs">
                      {report.emoji}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-headline font-bold text-slate-500">{report.date}</span>
                        <span
                          className={`px-2 py-0.2 rounded-full font-headline text-[9px] font-extrabold uppercase ${
                            report.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-900'
                              : report.severity === 'High'
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-blue-100 text-blue-900'
                          }`}
                        >
                          {report.severity}
                        </span>
                      </div>
                      <h4 className="font-headline text-sm font-bold text-slate-900 mt-0.5">
                        {report.title}
                      </h4>
                      <span className="text-xs text-slate-600 block">{report.peakMetric}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedEventReport(report)}
                    className="h-9 px-3.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-headline text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-xs flex-shrink-0"
                  >
                    <span>View Report</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EVENT REPORT DETAILS MODAL */}
      {selectedEventReport && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedEventReport.emoji}</span>
                <div>
                  <span className="text-xs text-slate-500 font-headline font-bold">{selectedEventReport.date}</span>
                  <h3 className="font-headline text-lg font-bold text-slate-900 leading-tight">
                    {selectedEventReport.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEventReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Peak Metric:</span>
                  <strong className="text-slate-900 font-headline">{selectedEventReport.peakMetric}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Duration:</span>
                  <strong className="text-slate-900 font-headline">{selectedEventReport.duration}</strong>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 font-bold block mb-1">Impact Summary:</span>
                <p>{selectedEventReport.impactSummary}</p>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <span className="font-bold block mb-1">🛡️ Precaution Executed:</span>
                <p>{selectedEventReport.precautionTaken}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                <span className="font-bold text-slate-900 block mb-1">Agronomic Damage Prevention Review:</span>
                <p>• {selectedEventReport.agronomicReport.soilMoistureImpact}</p>
                <p>• {selectedEventReport.agronomicReport.canopyStressLevel}</p>
                <p>• {selectedEventReport.agronomicReport.recommendedFollowUp}</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedEventReport(null)}
                className="w-full h-10 rounded-xl bg-slate-900 hover:bg-black text-white font-headline text-xs font-bold uppercase tracking-wider"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SPATIAL HAZARD DETAILS MODAL */}
      {selectedHazardModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">{selectedHazardModal.emoji}</span>
                <div>
                  <span className="text-[10px] text-amber-700 font-headline font-bold uppercase tracking-wider">
                    {selectedHazardModal.distanceKm} km {selectedHazardModal.direction} of Your Farm
                  </span>
                  <h3 className="font-headline text-lg font-bold text-slate-900 leading-tight">
                    {selectedHazardModal.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHazardModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-slate-500 block mb-0.5">Threat Magnitude:</span>
                <strong className="text-slate-900 font-headline text-sm">{selectedHazardModal.metric}</strong>
                <span className="text-slate-500 block mt-1">Onset: {selectedHazardModal.onset}</span>
              </div>

              <p className="text-slate-600 leading-relaxed">
                {selectedHazardModal.description}
              </p>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900">
                <strong className="block mb-1">🛡️ Pre-emptive Farm Safeguard:</strong>
                <p>{selectedHazardModal.precaution}</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setSelectedHazardModal(null)}
                className="w-full h-10 rounded-xl bg-slate-900 hover:bg-black text-white font-headline text-xs font-bold uppercase tracking-wider"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
