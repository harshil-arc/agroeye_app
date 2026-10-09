'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  RefreshCw,
  Trash2,
  Share2,
  Droplets,
  Wind,
  Compass,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
  ShieldCheck,
  Sun,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  Layers,
  Sprout,
  Info,
} from 'lucide-react';
import { FarmLocation, WeatherData, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

const FarmMap = dynamic(() => import('./FarmMap').then((mod) => mod.FarmMap), {
  ssr: false,
  loading: () => (
    <div className="h-80 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-center text-slate-400 font-headline text-xs font-semibold">
      Loading Satellite Map &amp; Radar...
    </div>
  ),
});

interface FarmBlockProps {
  farm: FarmLocation;
  weather: WeatherData;
  lang: Language;
  onDeleteFarm: (id: string) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export const FarmBlock: React.FC<FarmBlockProps> = ({
  farm,
  weather,
  lang,
  onDeleteFarm,
  onRefresh,
  isLoading = false,
}) => {
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const t = translations[lang];
  const isHi = lang === 'hi';

  const current = weather.current;

  // WhatsApp Share Handler
  const handleShareWhatsApp = () => {
    const sprayBadge = weather.forecast[0]?.sprayCondition || 'Optimal Window';
    const topAlertTitle = weather.disasterAlerts && weather.disasterAlerts.length > 0
      ? weather.disasterAlerts[0].title
      : (isHi ? 'कोई खतरा नहीं, खेत सुरक्षित है' : 'No threats, farm is safe');

    const msg = isHi
      ? `🌱 *एग्रोआई • किसान मौसम एवं आपदा सलाह*\n📍 *खेत:* ${farm.name}\n🌡️ *तापमान:* ${current.temperature}°C (महसूस: ${current.apparentTemperature}°C)\n💧 *आर्द्रता:* ${current.humidity}%\n💨 *हवा की गति:* ${current.windSpeed} km/h (${current.windDirection})\n🧪 *कीटनाशक छिड़काव:* ${sprayBadge}\n⚠️ *आपदा चेतावनी:* ${topAlertTitle}\n\n👉 AgroEye Smart Farming App`
      : `🌱 *AgroEye • Farm Weather & Advisory Report*\n📍 *Farm:* ${farm.name}\n🌡️ *Temp:* ${current.temperature}°C (Feels like: ${current.apparentTemperature}°C)\n💧 *Humidity:* ${current.humidity}%\n💨 *Wind Speed:* ${current.windSpeed} km/h (${current.windDirection})\n🧪 *Spray Window:* ${sprayBadge}\n⚠️ *Alert:* ${topAlertTitle}\n\n👉 AgroEye Smart Farming App`;

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const renderWeatherIcon = (rainChance: number) => {
    if (rainChance > 45) return <CloudLightning className="w-5 h-5 text-indigo-600" />;
    if (rainChance > 20) return <CloudRain className="w-5 h-5 text-sky-600" />;
    if (rainChance > 10) return <CloudDrizzle className="w-5 h-5 text-sky-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  const getSprayConditionBadge = (condition: string) => {
    switch (condition) {
      case 'Optimal Window':
        return {
          label: t.optimalWindow,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        };
      case 'Caution':
        return {
          label: t.caution,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
        };
      case 'Do Not Spray':
      default:
        return {
          label: t.doNotSpray,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
        };
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
      {/* 1. Farm Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-50/80 to-white">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-headline font-bold uppercase tracking-wider flex items-center gap-1.5 bg-emerald-100 text-emerald-800 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
              <span>{isHi ? '🟢 लाइव ओपन-मेटियो डेटा' : '🟢 Live Open-Meteo Feed'}</span>
            </span>

            <span className="text-xs text-slate-500 font-mono">
              📍 {farm.lat.toFixed(4)}°N, {farm.lng.toFixed(4)}°E
            </span>
          </div>

          <h2 className="font-headline text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{farm.name}</span>
          </h2>
        </div>

        {/* Action Buttons: Refresh, WhatsApp, Remove */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoading}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-headline font-bold flex items-center gap-1.5 transition-all border border-slate-200"
            title="Refresh Live Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-600' : ''}`} />
            <span className="hidden sm:inline">{isHi ? 'ताज़ा करें' : 'Refresh'}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="h-9 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-headline font-bold flex items-center gap-1.5 transition-all border border-emerald-200"
            title="Share Advisory on WhatsApp"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">{isHi ? 'शेयर' : 'Share'}</span>
          </button>

          <button
            type="button"
            onClick={() => onDeleteFarm(farm.id)}
            className="h-9 px-2.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 text-xs transition-all border border-slate-200"
            title="Remove Farm"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. Severe Disaster Alerts or Reassuring Safe State Banner */}
      {weather.disasterAlerts && weather.disasterAlerts.length > 0 ? (
        <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-950 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse flex-shrink-0" />
              <h3 className="font-headline text-sm font-extrabold uppercase tracking-wide text-rose-900">
                {isHi ? '⚠️ सक्रिय आपदा चेतावनी (DISASTER ALERT)' : '⚠️ ACTIVE SEVERE DISASTER ADVISORY'}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-headline text-[10px] font-bold">
              {weather.disasterAlerts.length} {isHi ? 'चेतावनियाँ' : 'Alerts Active'}
            </span>
          </div>

          <div className="space-y-2">
            {weather.disasterAlerts.map((alert) => (
              <div
                key={alert.id}
                className="p-3 bg-white/90 rounded-xl border border-rose-200 shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-headline text-xs font-bold text-slate-900">
                    {alert.title}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 font-headline text-[10px] font-extrabold uppercase border border-rose-300">
                    {alert.severity} ({alert.probability}% {isHi ? 'संभावना' : 'Risk'})
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {alert.description}
                </p>
                <div className="pt-1.5 border-t border-slate-100">
                  <span className="text-[10px] font-headline font-bold uppercase text-emerald-800 block mb-0.5">
                    💡 {isHi ? 'किसान हेतु अनिवार्य सुरक्षा उपाय:' : 'Mandatory Agronomic Precautions:'}
                  </span>
                  <ul className="text-[11px] text-slate-800 list-disc list-inside space-y-0.5">
                    {alert.precautions.map((p, idx) => (
                      <li key={idx}>{p}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 bg-emerald-50/90 border-b border-emerald-200/90 text-emerald-950 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center flex-shrink-0 text-emerald-700 shadow-2xs">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="font-headline text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                <span>{isHi ? '🛡️ कोई खतरा नहीं, खेत सुरक्षित है' : '🛡️ No threats, farm is safe'}</span>
              </h3>
              <p className="text-xs text-emerald-700 mt-0.5">
                {isHi ? 'सभी मौसमी मानक सामान्य और सुरक्षित कृषि सीमा के भीतर हैं।' : 'All meteorological and calamity parameters are within safe agricultural thresholds.'}
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-headline font-bold tracking-wider uppercase flex-shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{isHi ? 'सुरक्षित' : 'Safe'}</span>
          </span>
        </div>
      )}

      {/* 3. Core Weather Telemetry: Temperature, Humidity, Wind Speed, Wind Direction */}
      <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-white">
        {/* Temperature Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-headline uppercase font-bold text-slate-500 tracking-wider block">
              🌡️ {isHi ? 'तापमान (TEMPERATURE)' : 'TEMPERATURE'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-tabular">
                {current.temperature}°C
              </span>
            </div>
            <span className="text-xs font-bold text-emerald-700 block mt-0.5">
              {current.weatherCondition}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {t.feelsLike} {current.apparentTemperature}°C
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-100/70 border border-amber-200 flex items-center justify-center flex-shrink-0">
            <Sun className="w-6 h-6 text-amber-600" />
          </div>
        </div>

        {/* Humidity Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-headline uppercase font-bold text-slate-500 tracking-wider block">
              💧 {isHi ? 'आर्द्रता (HUMIDITY)' : 'HUMIDITY'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-tabular">
                {current.humidity}%
              </span>
            </div>
            <span className="text-xs font-medium text-slate-600 block mt-0.5">
              {current.humidity > 70 ? (isHi ? 'उच्च नमी' : 'High Moisture') : (isHi ? 'सामान्य नमी' : 'Moderate Moisture')}
            </span>
            <span className="text-[11px] text-slate-400 font-medium font-mono">
              VPD: {current.vpd} kPa
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-100/70 border border-sky-200 flex items-center justify-center flex-shrink-0">
            <Droplets className="w-6 h-6 text-sky-600" />
          </div>
        </div>

        {/* Wind Speed & Direction Card */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="min-w-0">
            <span className="text-[11px] font-headline uppercase font-bold text-slate-500 tracking-wider block">
              💨 {isHi ? 'हवा की गति (WIND SPEED)' : 'WIND SPEED'}
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="font-headline text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-tabular">
                {current.windSpeed} <span className="text-sm font-normal text-slate-500">km/h</span>
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs font-bold text-slate-800 mt-0.5 truncate">
              <Compass className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
              <span className="truncate">{current.windDirection}</span>
            </div>
            <span className="text-[11px] text-slate-400 font-medium font-mono">
              {t.gusts}: {current.windGusts} km/h
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-teal-100/70 border border-teal-200 flex items-center justify-center flex-shrink-0">
            <Wind className="w-6 h-6 text-teal-600" />
          </div>
        </div>
      </div>

      {/* 4. Next 7 Days Forecast (directly from Open-Meteo) */}
      <div className="px-4 sm:px-5 pb-5">
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <span className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
                📅 {t.sevenDayForecast}
              </span>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">
              {t.dailySprayIndex}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {weather.forecast.map((day, idx) => {
              const spray = getSprayConditionBadge(day.sprayCondition);
              return (
                <div
                  key={idx}
                  className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col justify-between items-center text-center shadow-2xs hover:border-emerald-300 transition-colors"
                >
                  <span className="font-headline text-xs font-bold text-slate-900">
                    {day.day}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {day.date}
                  </span>

                  <div className="my-2">
                    {renderWeatherIcon(day.rainChance)}
                  </div>

                  <span className="text-[11px] font-bold text-slate-800 line-clamp-1">
                    {day.tempMax}° / <span className="text-slate-500 font-normal">{day.tempMin}°</span>
                  </span>

                  <span className="text-[10px] text-sky-600 font-medium mt-0.5">
                    {day.rainChance}% rain
                  </span>

                  <span
                    className={`mt-2 px-1.5 py-0.5 rounded font-headline text-[9px] font-bold uppercase tracking-wider border w-full truncate ${spray.classes}`}
                    title={day.sprayCondition}
                  >
                    {spray.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 5. Regional Soil Profile & Composition Card */}
      {weather.soilProfile && (
        <div className="px-4 sm:px-5 pb-5">
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 bg-gradient-to-br from-amber-50/40 via-white to-emerald-50/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-headline text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>{t.soilSectionTitle}</span>
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isHi ? 'कृषि अनुसंधान परिषद (ICAR) एवं ISRIC SoilGrids आधारित विश्लेषण' : 'Based on ICAR Agro-Climatic Classification & ISRIC SoilGrids'}
                  </span>
                </div>
              </div>

              {/* Soil Type Main Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-100 border border-amber-200 text-amber-900 text-xs font-headline font-extrabold tracking-wide self-start sm:self-auto">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-black/10"
                  style={{ backgroundColor: weather.soilProfile.colorHex || '#8D6E63' }}
                />
                <span>{isHi ? weather.soilProfile.soilTypeHi : weather.soilProfile.soilType}</span>
              </div>
            </div>

            {/* Grid of Soil Properties */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* 1. Texture */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
                  🧪 {t.soilTextureLabel}
                </span>
                <span className="font-headline text-xs sm:text-sm font-bold text-slate-800 mt-1 block">
                  {isHi ? weather.soilProfile.textureHi : weather.soilProfile.texture}
                </span>
                {weather.soilProfile.clayPercent !== undefined && (
                  <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">
                    Clay: {weather.soilProfile.clayPercent}% | Sand: {weather.soilProfile.sandPercent}%
                  </span>
                )}
              </div>

              {/* 2. Soil pH Reaction */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
                  ⚗️ {t.soilPhLabel}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="font-headline text-base sm:text-lg font-extrabold text-slate-900 font-tabular">
                    pH {weather.soilProfile.ph}
                  </span>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                    {weather.soilProfile.phCategory}
                  </span>
                </div>
              </div>

              {/* 3. Water Retention & Drainage */}
              <div className="p-3 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
                  💧 {t.waterRetentionLabel}
                </span>
                <span className="font-headline text-xs sm:text-sm font-bold text-slate-800 mt-1 block">
                  {isHi ? weather.soilProfile.waterRetentionHi : weather.soilProfile.waterRetention}
                </span>
                <span className="text-[10px] text-slate-500 mt-0.5 block">
                  {t.drainageLabel}: {isHi ? weather.soilProfile.drainageHi : weather.soilProfile.drainage}
                </span>
              </div>

              {/* 4. Live Sensor Moisture & Temperature */}
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 shadow-2xs">
                <span className="text-[10px] font-headline uppercase font-bold text-emerald-800 block tracking-wider">
                  📡 {t.liveSoilMetrics}
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-headline text-base sm:text-lg font-extrabold text-emerald-950 font-tabular">
                    {current.soilMoisturePercent}%
                  </span>
                  <span className="text-xs text-emerald-700 font-semibold font-tabular">
                    {current.soilTemperature}°C
                  </span>
                </div>
                <span className="text-[10px] text-emerald-600 font-medium mt-0.5 block">
                  {isHi ? 'सक्रिय जड़ क्षेत्र की नमी' : 'Root-zone moisture & temp'}
                </span>
              </div>
            </div>

            {/* Suitable Crops Pill Tags */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-[11px] font-headline font-bold text-slate-700 flex items-center gap-1.5 flex-shrink-0">
                <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                <span>{t.suitableCropsLabel}:</span>
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(isHi ? weather.soilProfile.suitableCropsHi : weather.soilProfile.suitableCrops).map((crop, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold"
                  >
                    {crop}
                  </span>
                ))}
              </div>
            </div>

            {/* Agronomic Management Advice */}
            <div className="mt-3 p-3 bg-amber-50/80 rounded-xl border border-amber-200/80 flex items-start gap-2">
              <Info className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-amber-950 leading-relaxed">
                <strong className="font-headline font-bold block mb-0.5 text-amber-900">
                  💡 {t.managementTipLabel}:
                </strong>
                <span>{isHi ? weather.soilProfile.managementTipHi : weather.soilProfile.managementTip}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Collapsible Map & Satellite Radar Drawer */}
      <div className="border-t border-slate-200/80 bg-slate-50 px-4 py-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsMapExpanded(!isMapExpanded)}
          className="text-xs font-headline font-bold text-slate-700 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>🗺️ {isHi ? 'गूगल मैप्स सैटेलाइट नक्शा एवं वर्षा रडार देखें' : 'View Google Maps Satellite & Rain Radar'}</span>
          {isMapExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <span className="text-[11px] text-slate-400 font-mono">
          Google Maps • RainViewer
        </span>
      </div>

      {isMapExpanded && (
        <div className="p-4 bg-slate-900 border-t border-slate-800">
          <FarmMap
            lat={farm.lat}
            lng={farm.lng}
            locationName={farm.name}
            onLocationSelect={() => {}}
            isMarkingFarm={false}
            onToggleMarkingFarm={() => {}}
            spatialHazards={weather.spatialHazards}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
};
