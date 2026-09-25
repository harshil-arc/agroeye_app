'use client';

import React from 'react';
import Link from 'next/link';
import { useFarmData } from '@/context/FarmDataContext';
import {
  Wifi,
  CloudOff,
  MapPin,
  Sparkles,
  ArrowRight,
  Droplets,
  Thermometer,
  Wind,
  ShieldCheck,
  Video,
  Radio,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  Play,
  RotateCcw,
  Activity,
  Cpu,
  ImageIcon
} from 'lucide-react';

export default function HomePage() {
  const {
    sensors,
    detections,
    isOfflineMode,
    setIsOfflineMode,
    lastUpdated,
    firebaseConnected,
    triggerManualAlert,
    latestImageUrl,
    setAutoOpenedDetection
  } = useFarmData();

  const recentDetection = detections.length > 0 ? detections[0] : null;

  return (
    <div className="flex flex-col w-full pb-8">
      {/* 1. Interactive Simulation Bar & Live Firebase Sync Banner */}
      <div className="px-4 pt-2 pb-1">
        <div className="w-full rounded-xl bg-white border border-slate-200/80 p-3 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            {isOfflineMode ? (
              <CloudOff className="w-5 h-5 text-amber-600 flex-shrink-0" />
            ) : (
              <Wifi className="w-5 h-5 text-emerald-600 flex-shrink-0 animate-pulse" />
            )}
            <div className="font-headline text-xs uppercase tracking-wider text-slate-600 truncate">
              Telemetry:{' '}
              {isOfflineMode ? (
                <strong className="text-amber-700 font-bold">Offline Buffer Mode</strong>
              ) : firebaseConnected ? (
                <strong className="text-emerald-700 font-bold">Firebase Realtime Sync (ESP32)</strong>
              ) : (
                <strong className="text-emerald-700 font-bold">Edge Live Mode</strong>
              )}
            </div>
          </div>

          <button
            onClick={() => setIsOfflineMode(!isOfflineMode)}
            className="h-8 px-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-headline text-xs uppercase tracking-wider active:scale-95 transition-all flex items-center gap-1.5 shadow-sm border border-slate-200 font-semibold"
            type="button"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isOfflineMode ? 'bg-amber-600' : 'bg-emerald-600'
              }`}
            />
            <span>{isOfflineMode ? 'Resume Live' : 'Simulate Offline'}</span>
          </button>
        </div>

        {/* Cached Buffer Notice Banner (Revealed when offline) */}
        {isOfflineMode && (
          <div className="mt-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 flex items-center gap-2 shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
            <CloudOff className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-slate-800 flex-1">
              Showing latest cached farm telemetry{' '}
              <span className="text-slate-500 font-medium">(Edge node buffer #04 synced 4m ago)</span>
            </p>
          </div>
        )}
      </div>

      {/* 2. Top Greeting & Live Farm Header */}
      <section className="px-4 pt-3 pb-3 flex flex-col gap-2">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-headline text-[11px] uppercase tracking-widest text-emerald-700 font-bold">
              Agronomic Node • Dabok Sector 1
            </span>
            <h1 className="font-headline text-2xl sm:text-3xl text-slate-900 font-bold tracking-tight mt-0.5">
              Good Morning, Farmer
            </h1>
            <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              my Farm • Dabok, Udaipur (Rice Crop)
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <div
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-sm ${
                isOfflineMode
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200/80 text-emerald-700'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isOfflineMode ? 'bg-amber-600' : 'bg-emerald-600 animate-ping'
                }`}
              />
              <span className="font-headline text-[11px] uppercase font-bold tracking-wide">
                {isOfflineMode ? 'Cached Buffer' : 'ESP32 Online'}
              </span>
            </div>
            <span className="font-headline text-[10px] text-slate-500 font-semibold">{lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* 3. Farm Environment Status Strip */}
      <section className="px-4 pb-3.5">
        <div className="w-full rounded-xl bg-white border border-slate-200/80 p-3 flex items-center justify-between gap-2 overflow-x-auto shadow-sm">
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="font-headline text-xs uppercase tracking-wider text-slate-500 font-bold">
              Environment
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="inline-flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Soil Moist: {sensors.soilMoisture}%</span>
            </div>
            <span className="text-slate-300 text-xs">•</span>
            <div className="inline-flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Temp: {sensors.temperature}°C</span>
            </div>
            <span className="text-slate-300 text-xs">•</span>
            <div className="inline-flex items-center gap-1.5 text-slate-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-500" />
              <span>Air: {sensors.humidity}% RH</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Real 2x2 Telemetry Metrics Grid from ESP32 Firebase */}
      <section className="px-4 pb-4">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-emerald-600" />
            <h2 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
              Real Farm Telemetry (ESP32)
            </h2>
          </div>
          <span className="font-headline text-[11px] text-slate-500 font-medium font-mono">
            {sensors.datetime || 'Live Sync'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* 1. Real Soil Moisture Card */}
          <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Droplets className="w-4 h-4 text-emerald-600" />
                <span className="font-headline text-xs uppercase tracking-wider text-slate-600 font-bold">
                  Soil Moisture
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-headline text-[10px] uppercase font-bold">
                {sensors.soilMoistureStatus}
              </span>
            </div>
            <div className="mt-2 mb-1.5">
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-3xl font-bold text-slate-900 font-tabular">
                  {sensors.soilMoisture}
                </span>
                <span className="font-headline text-sm text-slate-500 font-bold">%</span>
              </div>
              <span className="text-xs text-slate-500 block font-medium">Volumetric Water Content</span>
            </div>
            <div className="w-full mt-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, sensors.soilMoisture))}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-slate-500 font-headline text-[11px]">
                <span>ADC Raw: {sensors.soilRaw || 449}</span>
                <span className="font-semibold text-slate-700">Dabok Sector 1</span>
              </div>
            </div>
          </div>

          {/* 2. Real Temperature Card */}
          <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-600" />
                <span className="font-headline text-xs uppercase tracking-wider text-slate-600 font-bold">
                  Temperature
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-headline text-[10px] uppercase font-bold">
                {sensors.tempStatus}
              </span>
            </div>
            <div className="mt-2 mb-1.5">
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-3xl font-bold text-slate-900 font-tabular">
                  {sensors.temperature}
                </span>
                <span className="font-headline text-sm text-slate-500 font-bold">°C</span>
              </div>
              <span className="text-xs text-slate-500 block font-medium">Canopy Temperature</span>
            </div>
            <div className="w-full mt-1 pt-1 bg-slate-50 border border-slate-100 rounded p-1.5">
              <div className="flex justify-between items-center font-headline text-[11px] text-slate-500">
                <span>
                  Min <strong className="text-slate-800">{sensors.tempMin}°C</strong>
                </span>
                <span>
                  Max <strong className="text-amber-700">{sensors.tempMax}°C</strong>
                </span>
              </div>
            </div>
          </div>

          {/* 3. Real Humidity Card */}
          <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-sky-600" />
                <span className="font-headline text-xs uppercase tracking-wider text-slate-600 font-bold">
                  Air Humidity
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-50 border border-sky-200 text-sky-700 font-headline text-[10px] uppercase font-bold">
                {sensors.humidityStatus}
              </span>
            </div>
            <div className="mt-2 mb-1.5">
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-3xl font-bold text-slate-900 font-tabular">
                  {sensors.humidity}
                </span>
                <span className="font-headline text-sm text-slate-500 font-bold">%</span>
              </div>
              <span className="text-xs text-slate-500 block font-medium">Relative Humidity</span>
            </div>
            <div className="w-full mt-1">
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-sky-500 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, sensors.humidity)}%` }}
                />
              </div>
              <div className="flex justify-between items-center mt-1.5 text-slate-500 font-headline text-[11px]">
                <span>VPD: {sensors.vpd} kPa</span>
                <span className="font-semibold text-slate-700">Calculated</span>
              </div>
            </div>
          </div>

          {/* 4. Real MQ-135 Air Quality Card */}
          <div className="rounded-xl bg-white border border-slate-200/80 p-3.5 flex flex-col justify-between shadow-sm">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-headline text-xs uppercase tracking-wider text-slate-600 font-bold">
                  Air Quality
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-headline text-[10px] uppercase font-bold">
                {sensors.airQualityStatus}
              </span>
            </div>
            <div className="mt-2 mb-1.5">
              <div className="flex items-baseline gap-1">
                <span className="font-headline text-2xl font-bold text-slate-900 font-tabular">
                  AQI {sensors.airQualityAqi}
                </span>
              </div>
              <span className="text-xs text-slate-500 block font-medium">MQ-135 Sensor</span>
            </div>
            <div className="w-full mt-1 pt-1 bg-slate-50 border border-slate-100 rounded p-1.5">
              <p className="font-headline text-[11px] text-slate-500 truncate">
                Raw: <strong className="text-slate-800">{sensors.mq135Raw || 330}</strong> • Volt:{' '}
                <strong className="text-slate-800">{sensors.mq135Voltage || 1.61}V</strong>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Real Latest AI Edge Detection Card from Firebase */}
      {recentDetection && (
        <section className="px-4 pb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <h2 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                Latest Real Edge Detection
              </h2>
            </div>
            <span className="font-headline text-[11px] text-slate-500 font-mono">
              {recentDetection.pathogen || 'YOLOv8 Edge'}
            </span>
          </div>

          <div className="w-full rounded-xl bg-white border border-slate-200/80 p-3.5 shadow-sm flex flex-col sm:flex-row gap-3">
            {/* Real photo from iili.io */}
            <div
              onClick={() => setAutoOpenedDetection(recentDetection)}
              className="relative w-full sm:w-36 h-40 sm:h-auto rounded-lg overflow-hidden flex-shrink-0 bg-slate-900 border border-slate-200 cursor-pointer group"
              title="Click to expand full image"
            >
              <img
                alt={recentDetection.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                src={recentDetection.imageUrl}
                onError={(e) => {
                  (e.target as HTMLElement).setAttribute('src', 'https://iili.io/nuiqbzg.jpg');
                }}
              />
              <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-black/70 text-white font-headline text-[10px] font-bold">
                {recentDetection.code}
              </span>
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-emerald-600 text-white font-headline text-[10px] font-bold">
                {recentDetection.confidence}%
              </div>
            </div>

            <div className="flex-1 flex flex-col justify-between min-w-0">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-headline text-[10px] uppercase font-bold tracking-wider">
                    {recentDetection.severity} Severity
                  </span>
                  <span className="font-headline text-[11px] text-slate-500">{recentDetection.timeAgo}</span>
                </div>
                <h3
                  onClick={() => setAutoOpenedDetection(recentDetection)}
                  className="font-headline text-base sm:text-lg text-slate-900 font-bold mt-1 cursor-pointer hover:text-emerald-700 transition-colors"
                >
                  {recentDetection.title}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed line-clamp-2">
                  {recentDetection.description}
                </p>
              </div>

              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1 truncate">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{recentDetection.recommendation}</span>
                </span>
                <Link
                  href={`/detections/${recentDetection.id}`}
                  className="h-9 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-all shadow-xs font-bold flex-shrink-0"
                >
                  <span>Inspect</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 6. Real Farm Optical Feed Preview */}
      <section className="px-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Video className="w-4 h-4 text-emerald-600" />
            <h2 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
              Farm Optical Camera Feed
            </h2>
          </div>
          <div className="inline-flex items-center gap-1.5 text-emerald-700 font-headline text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>1080p • Live Ingest</span>
          </div>
        </div>

        <div className="w-full rounded-xl bg-white border border-slate-200/80 overflow-hidden shadow-sm">
          {/* Real Photo Viewer */}
          <div className="relative w-full aspect-video bg-slate-950">
            <img
              alt="Real Ingested Farm Camera Capture"
              className="w-full h-full object-cover"
              src={latestImageUrl}
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', 'https://iili.io/nAclGhg.jpg');
              }}
            />
            {/* Live Camera HUD Overlays */}
            <div className="absolute inset-0 p-3 flex flex-col justify-between bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/50 pointer-events-none">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-black/60 backdrop-blur-md">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-headline text-[10px] text-rose-400 font-bold uppercase tracking-widest">
                    REC
                  </span>
                  <span className="text-slate-200 font-headline text-[10px] hidden sm:inline">
                    CAM #01 - DABOK RICE FIELD
                  </span>
                </div>
                <div className="px-2 py-0.5 rounded bg-black/60 backdrop-blur-md text-slate-200 font-headline text-[10px]">
                  ESP32 + iili Ingest
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div className="px-2 py-1 rounded bg-black/60 backdrop-blur-md">
                  <span className="font-headline text-[10px] text-emerald-400 font-bold block">
                    EDGE-AI ACTIVE
                  </span>
                  <span className="font-headline text-[10px] text-slate-300">
                    Auto-ingesting live field anomalies
                  </span>
                </div>
                <span className="font-headline text-[10px] text-slate-200 px-1.5 py-0.5 rounded bg-black/60">
                  Solar Bat: 98%
                </span>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-3 bg-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Pan-Tilt-Zoom Tactical HUD</span>
            </div>
            <Link
              href="/live"
              className="h-10 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs uppercase font-bold tracking-wider flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <span>View Full Camera HUD</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
