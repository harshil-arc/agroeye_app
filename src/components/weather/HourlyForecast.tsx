import React from 'react';
import { Clock, CloudRain, Sun, CloudSun, CloudDrizzle, CloudLightning } from 'lucide-react';
import { HourlyForecastItem, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
  lang: Language;
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly, lang }) => {
  const t = translations[lang];

  if (!hourly || hourly.length === 0) return null;

  const renderIcon = (iconName: string, rainProb: number) => {
    if (rainProb > 45) return <CloudLightning className="w-5 h-5 text-indigo-600" />;
    if (rainProb > 25) return <CloudRain className="w-5 h-5 text-sky-600" />;
    if (iconName.includes('Drizzle')) return <CloudDrizzle className="w-5 h-5 text-sky-500" />;
    if (iconName.includes('Sun')) return <CloudSun className="w-5 h-5 text-amber-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-emerald-600" />
          <h3 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
            {t.next24Hours}
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {t.hourlyIngest}
        </span>
      </div>

      <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-thin">
        {hourly.map((item, idx) => (
          <div
            key={idx}
            className="min-w-[85px] p-2.5 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-100 flex flex-col items-center text-center flex-shrink-0 transition-colors"
          >
            <span className="text-[11px] font-headline font-semibold text-slate-600">
              {item.hourLabel}
            </span>

            <div className="my-2">
              {renderIcon(item.icon, item.precipitationProbability)}
            </div>

            <span className="font-headline text-xs font-bold text-slate-900">
              {item.temperature}°C
            </span>

            <span className={`text-[10px] font-medium mt-0.5 ${
              item.precipitationProbability > 30 ? 'text-sky-600 font-bold' : 'text-slate-400'
            }`}>
              {item.precipitationProbability}% {t.rainProb}
            </span>

            {item.precipitation > 0 && (
              <span className="text-[9px] font-mono text-blue-600 font-bold">
                {item.precipitation} mm
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
