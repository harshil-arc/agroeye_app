import React from 'react';
import {
  Thermometer,
  Droplets,
  CloudRain,
  Wind,
  Cloud,
  Sun,
  Eye,
  Sprout,
} from 'lucide-react';
import { CurrentWeather, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

interface CurrentWeatherCardProps {
  current: CurrentWeather;
  twentyFourHourRainSum: number;
  lang: Language;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  current,
  twentyFourHourRainSum,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-white via-white to-emerald-50/40 rounded-2xl p-4 sm:p-6 shadow-sm border border-slate-200">
      {/* Top Section: Main Temperature & Conditions */}
      <div className="flex items-start justify-between relative z-10 mb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 w-fit mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span className="font-headline text-[10px] text-emerald-800 uppercase tracking-wider font-bold">
              {t.currentAtFarm}
            </span>
          </div>

          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="font-headline text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              {Math.round(current.temperature)}°C
            </span>
            <span className="text-base sm:text-lg text-emerald-700 font-bold">
              {current.weatherCondition}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-1 font-medium">
            {t.feelsLike} {Math.round(current.apparentTemperature)}°C • {t.cloudCover} {current.cloudCover}% • {t.visibility} {current.visibilityKm} km
          </p>
        </div>

        {/* Big Weather Icon Badge */}
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-amber-50 border border-amber-200/70 flex items-center justify-center shadow-xs flex-shrink-0">
          <Sun className="w-8 h-8 text-amber-500" />
        </div>
      </div>

      {/* Grid of 8 Agricultural Telemetry Parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3.5 bg-slate-50/90 border border-slate-200/70 rounded-xl p-3">
        {/* 1. Ambient & Soil Temperature */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Thermometer className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="truncate">{t.ambientAndSoil}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            {current.temperature}°C / {current.soilTemperature}°C
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {lang === 'hi' ? 'वायु / मृदा सतह' : 'Air / Soil Surface'}
          </span>
        </div>

        {/* 2. Humidity & VPD */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Droplets className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
            <span className="truncate">{t.humidityAndVpd}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            {current.humidity}% RH
          </span>
          <span className="text-[10px] text-slate-500 font-medium font-mono">
            VPD: {current.vpd} kPa
          </span>
        </div>

        {/* 3. Rainfall Rate & 24h Sum */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <CloudRain className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span className="truncate">{t.rainfallRate}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            {current.precipitation} mm/h
          </span>
          <span className="text-[10px] text-slate-500 font-medium font-mono">
            {t.rainfall24h}: {twentyFourHourRainSum} mm
          </span>
        </div>

        {/* 4. Wind Velocity & Gusts */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Wind className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
            <span className="truncate">{t.windVelocity}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            {current.windSpeed} km/h
          </span>
          <span className="text-[10px] text-slate-500 font-medium font-mono truncate">
            {t.heading}: {current.windDirection} • {t.gusts} {current.windGusts}kph
          </span>
        </div>

        {/* 5. Cloud Coverage */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Cloud className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            <span className="truncate">{t.cloudCoverage}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            {current.cloudCover}%
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {t.overcastLevel}
          </span>
        </div>

        {/* 6. UV Index & Solar Irradiance */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Sun className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span className="truncate">{t.uvAndSun}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            UV {current.uvIndex}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {t.solarIrradiance}
          </span>
        </div>

        {/* 7. Field Sight Visibility */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Eye className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
            <span className="truncate">{t.fieldVisibility}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            {current.visibilityKm} km
          </span>
          <span className="text-[10px] text-slate-500 font-medium">
            {t.clearSight}
          </span>
        </div>

        {/* 8. Soil Moisture & ET0 Water Loss */}
        <div className="flex flex-col p-2.5 bg-white rounded-lg border border-slate-200/70 shadow-2xs">
          <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-medium">
            <Sprout className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span className="truncate">{t.soilAndEt0}</span>
          </div>
          <span className="font-headline text-base font-bold text-slate-900 mt-1">
            {current.soilMoisturePercent}% ({current.et0} mm/d)
          </span>
          <span className="text-[10px] text-slate-500 font-medium font-mono">
            {current.soilMoisture} m³/m³
          </span>
        </div>
      </div>
    </div>
  );
};
