import React, { useState } from 'react';
import { BarChart3, Droplets } from 'lucide-react';
import { HistoryDay, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

interface WeatherTrendsChartProps {
  history: HistoryDay[];
  lang: Language;
}

export const WeatherTrendsChart: React.FC<WeatherTrendsChartProps> = ({ history, lang }) => {
  const [activeTab, setActiveTab] = useState<'temp' | 'rain' | 'humidity'>('temp');
  const t = translations[lang];

  if (!history || history.length === 0) return null;

  // Temperature chart SVG calculations
  const renderTemperatureChart = () => {
    const maxVals = history.map((h) => h.tempMax);
    const minVals = history.map((h) => h.tempMin);
    const maxTemp = Math.max(...maxVals, 38);
    const minTemp = Math.min(...minVals, 15);
    const range = maxTemp - minTemp || 1;

    const width = 500;
    const height = 150;
    const paddingX = 35;
    const paddingY = 25;
    const chartW = width - paddingX * 2;
    const chartH = height - paddingY * 2;

    const maxPoints = history.map((h, i) => ({
      x: paddingX + (i / (history.length - 1)) * chartW,
      y: paddingY + (1 - (h.tempMax - minTemp) / range) * chartH,
      val: h.tempMax,
      day: h.dayName,
      date: h.date,
    }));

    const minPoints = history.map((h, i) => ({
      x: paddingX + (i / (history.length - 1)) * chartW,
      y: paddingY + (1 - (h.tempMin - minTemp) / range) * chartH,
      val: h.tempMin,
      day: h.dayName,
      date: h.date,
    }));

    const maxLinePath = maxPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    const minLinePath = minPoints.reduce((acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`), '');
    const areaPath = `${maxLinePath} L ${minPoints[minPoints.length - 1].x} ${minPoints[minPoints.length - 1].y} ${minPoints
      .slice()
      .reverse()
      .map((p) => `L ${p.x} ${p.y}`)
      .join(' ')} Z`;

    return (
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[360px] h-40">
          <defs>
            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + chartH / 2} x2={width - paddingX} y2={paddingY + chartH / 2} stroke="#e2e8f0" strokeDasharray="3 3" />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} stroke="#cbd5e1" strokeWidth="1.5" />

          {/* Shaded Area between Max and Min */}
          <path d={areaPath} fill="url(#tempGradient)" />

          {/* Max Temp Line (Amber) */}
          <path d={maxLinePath} fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" />
          {/* Min Temp Line (Sky Blue) */}
          <path d={minLinePath} fill="none" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 3" strokeLinecap="round" />

          {/* Data Points */}
          {maxPoints.map((p, idx) => (
            <g key={`max-${idx}`}>
              <circle cx={p.x} cy={p.y} r="4" fill="#d97706" stroke="#ffffff" strokeWidth="2" />
              <text x={p.x} y={p.y - 7} textAnchor="middle" className="text-[10px] font-headline font-bold fill-amber-900">
                {p.val}°
              </text>
              <text x={p.x} y={height - 8} textAnchor="middle" className="text-[9px] font-headline font-semibold fill-slate-500">
                {p.day}
              </text>
            </g>
          ))}

          {minPoints.map((p, idx) => (
            <g key={`min-${idx}`}>
              <circle cx={p.x} cy={p.y} r="3.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
              <text x={p.x} y={p.y + 13} textAnchor="middle" className="text-[9px] font-headline font-semibold fill-sky-800">
                {p.val}°
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  };

  // Rainfall bar chart
  const renderRainfallChart = () => {
    const maxRain = Math.max(...history.map((h) => h.rainSum), 20);

    return (
      <div className="space-y-2 pt-2">
        <div className="flex items-end justify-between gap-2 h-36 px-2">
          {history.map((item, idx) => {
            const heightPercent = Math.max(8, (item.rainSum / maxRain) * 100);
            const hasRain = item.rainSum > 0;

            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                <span className="text-[10px] font-headline font-bold text-slate-700 font-mono">
                  {hasRain ? `${item.rainSum}m` : '0'}
                </span>
                <div
                  className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                    hasRain
                      ? 'bg-gradient-to-t from-blue-600 to-cyan-400 shadow-xs'
                      : 'bg-slate-200'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />
                <span className="text-[10px] font-headline font-semibold text-slate-500">
                  {item.dayName}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Humidity & ET0 grid
  const renderHumidityChart = () => {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-2">
        {history.map((item, idx) => (
          <div
            key={idx}
            className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center text-center"
          >
            <span className="text-[11px] text-slate-500 font-semibold">{item.dayName}</span>
            <Droplets className="w-4 h-4 text-sky-600 my-1.5" />
            <span className="font-headline text-sm font-bold text-slate-900">
              {item.humidityAvg}%
            </span>
            <span className="text-[9px] text-slate-400 font-mono mt-1">
              ET₀ {item.et0} mm
            </span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="font-headline text-base font-bold text-slate-900 leading-tight">
              📊 {t.historyTitle}
            </h3>
            <span className="text-xs text-slate-500">
              {t.historySub}
            </span>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('temp')}
            className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-all ${
              activeTab === 'temp'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.tempTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rain')}
            className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-all ${
              activeTab === 'rain'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.rainTab}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('humidity')}
            className={`px-3 py-1 rounded-lg font-headline text-xs font-bold transition-all ${
              activeTab === 'humidity'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.humidityTab}
          </button>
        </div>
      </div>

      {/* Active Chart View */}
      {activeTab === 'temp' && renderTemperatureChart()}
      {activeTab === 'rain' && renderRainfallChart()}
      {activeTab === 'humidity' && renderHumidityChart()}
    </div>
  );
};
