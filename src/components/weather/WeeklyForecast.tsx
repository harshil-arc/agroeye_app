import React from 'react';
import { Calendar, CloudRain, Sun, CloudSun, Wind, Droplets } from 'lucide-react';
import { DailyForecastItem, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

interface WeeklyForecastProps {
  forecast: DailyForecastItem[];
  lang: Language;
}

export const WeeklyForecast: React.FC<WeeklyForecastProps> = ({ forecast, lang }) => {
  const t = translations[lang];

  if (!forecast || forecast.length === 0) return null;

  const getSprayConditionBadge = (condition: string) => {
    switch (condition) {
      case 'Optimal Window':
        return {
          label: t.optimalWindow,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-200',
          tooltip: t.sprayOptimalTip,
        };
      case 'Caution':
        return {
          label: t.caution,
          classes: 'bg-amber-50 text-amber-800 border-amber-200',
          tooltip: t.sprayCautionTip,
        };
      case 'Do Not Spray':
      default:
        return {
          label: t.doNotSpray,
          classes: 'bg-rose-50 text-rose-800 border-rose-200',
          tooltip: t.sprayAvoidTip,
        };
    }
  };

  const renderWeatherIcon = (rainChance: number) => {
    if (rainChance > 40) return <CloudRain className="w-5 h-5 text-sky-600" />;
    if (rainChance > 15) return <CloudSun className="w-5 h-5 text-amber-500" />;
    return <Sun className="w-5 h-5 text-amber-500" />;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <h3 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
            {t.sevenDayForecast}
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {t.dailySprayIndex}
        </span>
      </div>

      <div className="space-y-2">
        {forecast.map((item, idx) => {
          const spray = getSprayConditionBadge(item.sprayCondition);
          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-slate-50/80 hover:bg-slate-100/90 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors"
            >
              {/* Day & Condition */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-2xs">
                  {renderWeatherIcon(item.rainChance)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-headline text-sm font-bold text-slate-900">
                      {item.day}
                    </span>
                    <span className="text-xs text-slate-400">
                      {item.date}
                    </span>
                  </div>
                  <span className="text-xs text-slate-600">
                    {item.condition}
                  </span>
                </div>
              </div>

              {/* Rain Chance, High/Low, and Spray Window Advisory */}
              <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-200/70">
                {/* Rain Chance & Volume */}
                <div className="flex items-center gap-1 text-xs text-slate-600">
                  <Droplets className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                  <span className="font-headline font-semibold">
                    {item.rainChance}% {item.rainSum > 0 ? `(${item.rainSum} mm)` : ''}
                  </span>
                </div>

                {/* Wind Gust */}
                <div className="hidden md:flex items-center gap-1 text-xs text-slate-500">
                  <Wind className="w-3.5 h-3.5 text-teal-600" />
                  <span>{item.windGustMax} km/h</span>
                </div>

                {/* Temperature Min / Max */}
                <div className="font-headline text-xs font-bold text-slate-900 font-mono">
                  <span>{item.tempMax}°</span>
                  <span className="text-slate-400 mx-1">/</span>
                  <span className="text-slate-500 font-normal">{item.tempMin}°</span>
                </div>

                {/* Spray Advisory Badge */}
                <div className="relative group">
                  <span
                    className={`px-2.5 py-1 rounded-full font-headline text-[10px] font-bold uppercase tracking-wider border cursor-help shadow-2xs transition-transform group-hover:scale-105 inline-block ${spray.classes}`}
                    title={spray.tooltip}
                  >
                    {spray.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
