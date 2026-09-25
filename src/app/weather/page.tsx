'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useFarmData } from '@/context/FarmDataContext';
import {
  fetchRealWeatherData,
  LiveWeatherResult,
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
} from 'lucide-react';

// Dynamically import Leaflet GIS Map with SSR disabled
const RealLeafletMap = dynamic(() => import('@/components/RealLeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full aspect-[16/11] sm:aspect-[21/9] rounded-2xl bg-slate-950 flex flex-col items-center justify-center border border-slate-800 text-slate-400 gap-2">
      <div className="flex items-center gap-2 text-emerald-400 font-headline text-sm font-bold">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
        Initializing Satellite Agronomic GIS Radar &amp; Calamity Models...
      </div>
      <span className="text-xs text-slate-500">Loading Esri World Imagery &amp; Real-Time Radar Tiles</span>
    </div>
  ),
});

interface PresetRegion {
  id: string;
  name: string;
  sub: string;
  lat: number;
  lng: number;
  crop: string;
  soil: string;
  riskLabel?: string;
  severity?: 'Critical' | 'High' | 'Moderate' | 'Low' | 'Safe';
}

const presetFarmRegions: PresetRegion[] = [
  {
    id: 'dabok_base',
    name: 'My Farm • Dabok Sector 1',
    sub: 'Mavli / Dabok, Udaipur',
    lat: 24.6128,
    lng: 73.8821,
    crop: 'Rice (Basmati) & Mustard',
    soil: 'Clay Loam (pH 7.1)',
    riskLabel: 'Flood / Spore Window',
    severity: 'High',
  },
  {
    id: 'vallabhnagar',
    name: 'Vallabhnagar Agronomic Basin',
    sub: 'Vallabhnagar Plains, Udaipur',
    lat: 24.6672,
    lng: 74.0049,
    crop: 'Maize & Sorghum',
    soil: 'Black Cotton Soil (pH 7.6)',
    riskLabel: 'Storm Gusts 45kph',
    severity: 'Moderate',
  },
  {
    id: 'girwa_valley',
    name: 'Girwa Highlands & Valley',
    sub: 'Girwa Vegetable Zone, Udaipur',
    lat: 24.5218,
    lng: 73.6912,
    crop: 'Tomato & Exotic Veg',
    soil: 'Sandy Loam (pH 6.8)',
    riskLabel: 'High Blight Incubation',
    severity: 'Critical',
  },
  {
    id: 'kherwara',
    name: 'Kherwara Semi-Arid Plateau',
    sub: 'Kherwara Arid Belt',
    lat: 23.9912,
    lng: 73.5821,
    crop: 'Bt Cotton & Pulses',
    soil: 'Red Sandy Soil (pH 6.5)',
    riskLabel: 'Soil Moisture Deficit',
    severity: 'Critical',
  },
  {
    id: 'chittorgarh',
    name: 'Chittorgarh Agronomic Zone',
    sub: 'Chittorgarh Plains',
    lat: 24.8887,
    lng: 74.6269,
    crop: 'Wheat & Mustard',
    soil: 'Alluvial Loam (pH 7.4)',
    riskLabel: 'Moderate Heat',
    severity: 'Low',
  },
  {
    id: 'mavli_north',
    name: 'Mavli North Farmlands',
    sub: 'Mavli Agri Belt',
    lat: 24.7865,
    lng: 73.9876,
    crop: 'Barley & Mustard',
    soil: 'Loamy Soil (pH 7.2)',
    riskLabel: 'Safe Condition',
    severity: 'Safe',
  },
];

type HeatmapMode = 'precipitation' | 'drought' | 'storm' | 'disease' | 'heat';

export default function WeatherPage() {
  const { sensors } = useFarmData();
  const [selectedZone, setSelectedZone] = useState<PresetRegion>(presetFarmRegions[0]);
  const [activeHeatmap, setActiveHeatmap] = useState<HeatmapMode>('precipitation');
  const [completedPrecautions, setCompletedPrecautions] = useState<Record<string, boolean>>({});
  
  // Real weather API state
  const [weatherData, setWeatherData] = useState<LiveWeatherResult | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number; label: string }>({
    lat: presetFarmRegions[0].lat,
    lng: presetFarmRegions[0].lng,
    label: presetFarmRegions[0].name,
  });

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

  // Initial load
  useEffect(() => {
    loadWeatherData(currentCoords.lat, currentCoords.lng, currentCoords.label);
  }, [loadWeatherData]);

  // Handle map click or region selection
  const handleLocationSelect = (lat: number, lng: number, placeName?: string) => {
    const label = placeName || `Field Coordinates (${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E)`;
    setCurrentCoords({ lat, lng, label });
    loadWeatherData(lat, lng, label);
  };

  const handlePresetSelect = (region: PresetRegion) => {
    setSelectedZone(region);
    setCurrentCoords({ lat: region.lat, lng: region.lng, label: region.name });
    loadWeatherData(region.lat, region.lng, region.name);
  };

  const togglePrecaution = (key: string) => {
    setCompletedPrecautions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Active risk score
  const getActiveRiskScore = (): number => {
    if (!weatherData) return 0;
    switch (activeHeatmap) {
      case 'precipitation':
        return weatherData.threatScores.floodRisk;
      case 'drought':
        return weatherData.threatScores.droughtRisk;
      case 'storm':
        return weatherData.threatScores.stormRisk;
      case 'disease':
        return weatherData.threatScores.diseaseRisk;
      case 'heat':
        return weatherData.threatScores.heatRisk;
      default:
        return 0;
    }
  };

  // Convert preset regions to NearbyRegionInfo for the map
  const nearbyList: NearbyRegionInfo[] = presetFarmRegions.map((p) => ({
    id: p.id,
    name: p.name,
    sub: p.sub,
    lat: p.lat,
    lng: p.lng,
    crop: p.crop,
    soil: p.soil,
    riskLabel: p.riskLabel,
    severity: p.severity,
  }));

  return (
    <div className="flex flex-col w-full pb-14 space-y-4">
      {/* 1. Page Header */}
      <section className="px-4 pt-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <span className="font-headline text-[11px] uppercase tracking-wider text-emerald-800 font-bold">
                Real-Time GIS Agronomic Radar &amp; Natural Calamity Map
              </span>
            </div>
            <h1 className="font-headline text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
              Field Radar, Upcoming Calamities &amp; Environmental Threats
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Real-time satellite GIS map with upcoming natural disasters, nearby regional calamity alerts, soil moisture deficits, and pre-emptive farmer safeguards.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => loadWeatherData(currentCoords.lat, currentCoords.lng, currentCoords.label)}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-headline font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingWeather ? 'animate-spin' : ''}`} />
              <span>Refresh Radar</span>
            </button>
            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs font-mono text-slate-700">
              📍 {currentCoords.lat.toFixed(4)}°N, {currentCoords.lng.toFixed(4)}°E
            </div>
          </div>
        </div>
      </section>

      {/* 2. REAL GIS SATELLITE, RADAR TILES & ON-MAP CALAMITY HUD */}
      <section className="px-4">
        <div className="bg-slate-950 rounded-2xl border border-slate-200 overflow-hidden shadow-md flex flex-col">
          {/* Heatmap Layer Selector Bar */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2 z-20">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="font-headline text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">
                Radar Layers:
              </span>
              {[
                { id: 'precipitation', label: '🌧️ Rain & Flood', color: 'bg-blue-600' },
                { id: 'drought', label: '☀️ Drought Deficit', color: 'bg-amber-600' },
                { id: 'storm', label: '🌪️ Storm & Wind', color: 'bg-purple-600' },
                { id: 'disease', label: '🌾 Fungal Spores', color: 'bg-rose-600' },
                { id: 'heat', label: '🔥 Heat Index', color: 'bg-red-600' },
              ].map((hm) => (
                <button
                  key={hm.id}
                  type="button"
                  onClick={() => setActiveHeatmap(hm.id as HeatmapMode)}
                  className={`h-8 px-3 rounded-lg font-headline text-xs font-bold whitespace-nowrap transition-all ${
                    activeHeatmap === hm.id
                      ? `${hm.color} text-white shadow-md ring-1 ring-white/40`
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {hm.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <span className="font-headline text-[10px] text-emerald-400 font-bold bg-black/60 px-2 py-1 rounded border border-emerald-500/30">
                ✨ Tap any field on map to inspect live weather &amp; disaster risk
              </span>
            </div>
          </div>

          {/* Real Leaflet Map Component with on-map calamity HUD and nearby stations */}
          <RealLeafletMap
            lat={currentCoords.lat}
            lng={currentCoords.lng}
            locationName={currentCoords.label}
            onLocationSelect={handleLocationSelect}
            heatmapType={activeHeatmap}
            riskScore={getActiveRiskScore()}
            weatherData={weatherData}
            nearbyRegions={nearbyList}
          />
        </div>
      </section>

      {/* 3. Nearby Agricultural Regions Quick Strip */}
      <section className="px-4">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <div>
              <span className="font-headline text-xs font-bold text-slate-900 block">
                Active Zone: {currentCoords.label}
              </span>
              <span className="text-[11px] text-slate-500">
                {selectedZone.sub} • Crop: {selectedZone.crop} • Soil: {selectedZone.soil}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {presetFarmRegions.map((region) => (
              <button
                key={region.id}
                type="button"
                onClick={() => handlePresetSelect(region)}
                className={`h-9 px-3 rounded-xl font-headline text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  currentCoords.lat === region.lat && currentCoords.lng === region.lng
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{region.name.split('•')[0]}</span>
                {region.severity === 'Critical' && (
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                )}
                {region.severity === 'High' && (
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 4. DISASTER & NATURAL CALAMITY EARLY-WARNING BOARD */}
      <section className="px-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
              <div>
                <h2 className="font-headline text-base font-bold text-slate-900">
                  Upcoming Natural Calamities &amp; Environmental Threat Board
                </h2>
                <span className="text-xs text-slate-500">
                  Real-time meteorological disaster models calibrated for {currentCoords.label}
                </span>
              </div>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-headline text-[10px] font-bold uppercase">
              {weatherData?.disasterAlerts.length || 0} Active Warning{weatherData?.disasterAlerts.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Loading or Error State */}
          {isLoadingWeather && (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200">
              <div className="inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
              <p className="text-xs font-headline font-semibold text-slate-700">
                Evaluating live satellite radar and natural disaster models...
              </p>
            </div>
          )}

          {weatherError && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <span>{weatherError}</span>
              <button
                type="button"
                onClick={() => loadWeatherData(currentCoords.lat, currentCoords.lng, currentCoords.label)}
                className="px-2.5 py-1 bg-amber-600 text-white rounded-lg font-bold"
              >
                Retry
              </button>
            </div>
          )}

          {/* No Threats Active state */}
          {!isLoadingWeather && weatherData && weatherData.disasterAlerts.length === 0 && (
            <div className="p-6 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="font-headline text-sm font-bold text-emerald-900">
                  All Agronomic Safety Indices Normal
                </h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  No critical flash floods, severe drought, squall gusts, or pathogen outbreaks detected for this region in the current forecast window.
                </p>
              </div>
            </div>
          )}

          {/* Calamity Alert Cards List */}
          {!isLoadingWeather && weatherData && weatherData.disasterAlerts.length > 0 && (
            <div className="space-y-3">
              {weatherData.disasterAlerts.map((alert, idx) => {
                return (
                  <div
                    key={idx}
                    className={`rounded-xl p-4 border transition-all ${
                      alert.severity === 'Critical'
                        ? 'bg-rose-50/80 border-rose-300'
                        : alert.severity === 'High'
                        ? 'bg-amber-50/80 border-amber-300'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            alert.severity === 'Critical'
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 rounded-full font-headline text-[10px] font-bold uppercase ${
                                alert.severity === 'Critical'
                                  ? 'bg-rose-200 text-rose-900'
                                  : 'bg-amber-200 text-amber-900'
                              }`}
                            >
                              {alert.severity} Hazard ({alert.probability}% Prob)
                            </span>
                            <span className="text-xs font-headline font-semibold text-slate-700">
                              {alert.onset}
                            </span>
                          </div>
                          <h3 className="font-headline text-base font-bold text-slate-900 mt-0.5">
                            {alert.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 mt-2 leading-relaxed">
                      {alert.description}
                    </p>

                    <div className="mt-2.5 p-2 bg-white/90 rounded-lg border border-slate-200/80 flex items-center gap-2 text-xs text-rose-900 font-medium">
                      <Info className="w-4 h-4 text-rose-600 flex-shrink-0" />
                      <span>
                        <strong>Crop Vulnerability Risk:</strong> {alert.impactRisk}
                      </span>
                    </div>

                    {/* Precaution Action Checklist for Farmer */}
                    <div className="mt-3.5 pt-3 border-t border-slate-200/60">
                      <span className="font-headline text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                        🛡️ Required Pre-Emptive Farm Precautions:
                      </span>
                      <div className="space-y-1.5">
                        {alert.precautions.map((precaution, pIdx) => {
                          const precKey = `${alert.title}_${pIdx}`;
                          const isDone = !!completedPrecautions[precKey];
                          return (
                            <div
                              key={pIdx}
                              onClick={() => togglePrecaution(precKey)}
                              className={`p-2 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${
                                isDone
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 line-through opacity-75'
                                  : 'bg-white border-slate-200 text-slate-800 hover:border-emerald-400'
                              }`}
                            >
                              <div className="flex items-center gap-2 text-xs">
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center ${
                                    isDone
                                      ? 'bg-emerald-600 border-emerald-600 text-white'
                                      : 'border-slate-400 bg-white'
                                  }`}
                                >
                                  {isDone && <Check className="w-3 h-3" />}
                                </div>
                                <span className="font-medium">{precaution}</span>
                              </div>
                              <span className="text-[10px] font-headline font-bold text-emerald-700">
                                {isDone ? 'COMPLETED' : 'PENDING'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 5. Live Telemetry Matrix Grid for Selected Region */}
      {weatherData && (
        <section className="px-4">
          <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/50 rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200">
            <div className="flex items-start justify-between relative z-10 mb-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 w-fit mb-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-headline text-[10px] text-emerald-800 uppercase tracking-wider font-bold">
                    {weatherData.locationName} • Live Weather Telemetry
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
                  Real Satellite Model • Apparent {Math.round(weatherData.current.apparentTemperature)}°C • Soil Moisture {weatherData.current.soilMoisturePercent}% ({weatherData.current.soilMoisture} m³/m³)
                </p>
              </div>

              <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200/70 flex items-center justify-center shadow-xs flex-shrink-0">
                <CloudSun className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            {/* 2x3 Sensor Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-3.5 bg-slate-50/90 border border-slate-200/70 rounded-xl p-3">
              <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Thermometer className="w-3.5 h-3.5 text-amber-600" />
                  <span>Soil &amp; Air Temp</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.temperature}°C / {weatherData.current.soilTemperature}°C soil
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  ESP32 Reading: {sensors.temperature}°C
                </span>
              </div>

              <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Droplets className="w-3.5 h-3.5 text-sky-600" />
                  <span>Humidity &amp; Moisture</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.humidity}% RH
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Soil Vol: {weatherData.current.soilMoisturePercent}% (ESP32: {sensors.soilMoisture}%)
                </span>
              </div>

              <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>Wind Velocity</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.windSpeed} km/h
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Heading: {weatherData.current.windDirection} • Gusts {weatherData.current.windGusts} km/h
                </span>
              </div>

              <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Solar &amp; UV Index</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  UV {weatherData.current.uvIndex} (Index)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  VPD Pressure: {weatherData.current.vpd} kPa
                </span>
              </div>

              <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Gauge className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Atm Pressure</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.surfacePressure} hPa
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Elevation: {weatherData.elevation}m ASL
                </span>
              </div>

              <div className="flex flex-col p-2 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
                <div className="flex items-center gap-1 text-slate-500 text-[11px] font-medium">
                  <Zap className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ET₀ Evapo-Loss</span>
                </div>
                <span className="font-headline text-base font-bold text-slate-900 mt-1 font-tabular">
                  {weatherData.current.et0} mm/day
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  Precipitation: {weatherData.current.precipitation} mm
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Real 7-Day Agronomic Forecast & Spray Windows */}
      {weatherData && weatherData.forecast.length > 0 && (
        <section className="px-4">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h2 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                Real 7-Day Agronomic Forecast &amp; Spray Advisory
              </h2>
            </div>
            <span className="font-headline text-[11px] text-slate-500 font-medium">
              Open-Meteo Meteorological Model
            </span>
          </div>

          <div className="space-y-2.5">
            {weatherData.forecast.map((day, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center flex-shrink-0 text-amber-500">
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
                    <span className="text-xs text-slate-600 block">{day.condition}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    <span className="font-headline font-semibold text-slate-800">
                      {day.rainChance}% ({day.rainSum} mm)
                    </span>
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
        </section>
      )}
    </div>
  );
}
