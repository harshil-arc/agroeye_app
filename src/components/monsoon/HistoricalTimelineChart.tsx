'use client';
import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Layers,
  Info,
  TrendingUp,
  Filter
} from 'lucide-react';
import { MonsoonYearRecord, Language } from '@/types/monsoon';
import { translations } from '@/i18n/monsoonTranslations';
import { HISTORIC_MONSOON_DATA } from '@/data/historicMonsoonData';

interface HistoricalTimelineChartProps {
  lang: Language;
}

export const HistoricalTimelineChart: React.FC<HistoricalTimelineChartProps> = ({ lang }) => {
  const t = translations[lang];
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [hoveredYear, setHoveredYear] = useState<MonsoonYearRecord | null>(null);

  // Filter records by decade
  const filteredData = useMemo(() => {
    if (selectedDecade === 'all') return [...HISTORIC_MONSOON_DATA].sort((a, b) => a.year - b.year);
    const startYear = parseInt(selectedDecade, 10);
    const endYear = startYear + 9;
    return HISTORIC_MONSOON_DATA.filter((d) => d.year >= startYear && d.year <= endYear).sort(
      (a, b) => a.year - b.year
    );
  }, [selectedDecade]);

  // Compute 5-year rolling moving average of DayOfYear
  const movingAvgData = useMemo(() => {
    const fullSorted = [...HISTORIC_MONSOON_DATA].sort((a, b) => a.year - b.year);
    const map = new Map<number, number>();
    for (let i = 0; i < fullSorted.length; i++) {
      const windowStart = Math.max(0, i - 2);
      const windowEnd = Math.min(fullSorted.length - 1, i + 2);
      const sub = fullSorted.slice(windowStart, windowEnd + 1);
      const avg = sub.reduce((acc, v) => acc + v.dayOfYear, 0) / sub.length;
      map.set(fullSorted[i].year, avg);
    }
    return map;
  }, []);

  // Chart dimensions & scaling
  const chartHeight = 260;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 40;
  const innerHeight = chartHeight - paddingTop - paddingBottom;
  const totalWidth = 900;
  const innerWidth = totalWidth - paddingLeft - paddingRight;

  // Day of Year scale: Min: 135 (May 15), Normal: 152 (June 1), Max: 175 (June 24)
  const minDay = 136; // ~16 May
  const maxDay = 172; // ~21 June
  const normalDay = 152; // 01 June

  const getY = (day: number) => {
    // Invert Y so earlier dates (smaller DOY) are at the top or bottom as appropriate.
    // Let's place earlier dates above normal line, later dates below normal line.
    const normalized = (day - minDay) / (maxDay - minDay);
    return paddingTop + normalized * innerHeight;
  };

  const normalY = getY(normalDay);

  const getX = (index: number, count: number) => {
    if (count <= 1) return paddingLeft + innerWidth / 2;
    return paddingLeft + (index / (count - 1)) * innerWidth;
  };

  // Generate SVG path for 5-year moving average line
  const movingAvgPath = useMemo(() => {
    if (filteredData.length < 2) return '';
    const points = filteredData.map((d, idx) => {
      const avgDay = movingAvgData.get(d.year) || d.dayOfYear;
      return `${getX(idx, filteredData.length)},${getY(avgDay)}`;
    });
    return `M ${points.join(' L ')}`;
  }, [filteredData, movingAvgData]);

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Title & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
              {t.chartSectionTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t.chartSectionSub}
          </p>
        </div>

        {/* Decade Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 hidden sm:inline" />
          {[
            { id: 'all', label: t.filterAll },
            { id: '2020', label: t.filter2020s },
            { id: '2010', label: t.filter2010s },
            { id: '2000', label: t.filter2000s },
            { id: '1990', label: t.filter1990s },
            { id: '1980', label: t.filter1980s },
            { id: '1970', label: t.filter1970s },
          ].map((btn) => (
            <button
              key={btn.id}
              type="button"
              onClick={() => setSelectedDecade(btn.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-headline font-bold transition-all cursor-pointer ${
                selectedDecade === btn.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70 font-headline">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-xs bg-emerald-500" />
            <span>{t.legendEarly}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-xs bg-blue-500" />
            <span>{t.legendNormal}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-3 h-3 rounded-xs bg-amber-500" />
            <span>{t.legendDelayed}</span>
          </div>
          <div className="flex items-center gap-1.5 font-semibold">
            <span className="w-4 h-0.5 bg-slate-800 border-t-2 border-dashed border-slate-700" />
            <span>{t.legendMovingAvg}</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 italic">
          {t.chartHoverTip}
        </span>
      </div>

      {/* Interactive SVG Chart Container */}
      <div className="relative w-full overflow-x-auto scrollbar-thin">
        <div className="min-w-[720px] relative">
          <svg
            viewBox={`0 0 ${totalWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            {/* Background Grid Lines & Date Labels */}
            {[
              { day: 140, label: '20 May' },
              { day: 146, label: '26 May' },
              { day: 152, label: '01 June (Normal)' },
              { day: 158, label: '07 June' },
              { day: 165, label: '14 June' },
            ].map((grid, idx) => {
              const y = getY(grid.day);
              const isBaseline = grid.day === normalDay;
              return (
                <g key={idx}>
                  <line
                    x1={paddingLeft}
                    y1={y}
                    x2={totalWidth - paddingRight}
                    y2={y}
                    stroke={isBaseline ? '#059669' : '#e2e8f0'}
                    strokeWidth={isBaseline ? 1.5 : 1}
                    strokeDasharray={isBaseline ? '4 2' : 'none'}
                    opacity={isBaseline ? 0.9 : 0.8}
                  />
                  <text
                    x={paddingLeft - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className={`text-[10px] font-mono ${
                      isBaseline ? 'fill-emerald-700 font-bold' : 'fill-slate-400'
                    }`}
                  >
                    {grid.label}
                  </text>
                </g>
              );
            })}

            {/* Normal Band ± 4 days highlight */}
            <rect
              x={paddingLeft}
              y={getY(normalDay - 4)}
              width={innerWidth}
              height={getY(normalDay + 4) - getY(normalDay - 4)}
              fill="#ecfdf5"
              opacity="0.4"
            />

            {/* Deviation Bars for each Year */}
            {filteredData.map((record, idx) => {
              const x = getX(idx, filteredData.length);
              const y = getY(record.dayOfYear);
              const isHovered = hoveredYear?.year === record.year;
              const barWidth = Math.max(
                4,
                Math.min(14, innerWidth / (filteredData.length * 1.5))
              );

              const color =
                record.category === 'Early'
                  ? '#10b981'
                  : record.category === 'Delayed'
                  ? '#f59e0b'
                  : '#3b82f6';

              const barHeight = Math.abs(y - normalY);
              const barY = Math.min(y, normalY);

              return (
                <g
                  key={record.year}
                  onMouseEnter={() => setHoveredYear(record)}
                  onMouseLeave={() => setHoveredYear(null)}
                  className="cursor-pointer group"
                >
                  {/* Stem Line from Normal to Value */}
                  <line
                    x1={x}
                    y1={normalY}
                    x2={x}
                    y2={y}
                    stroke={color}
                    strokeWidth={isHovered ? 3.5 : 2}
                    className="transition-all"
                  />

                  {/* Bubble Circle Point */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered ? 6.5 : 4}
                    fill={color}
                    stroke="#ffffff"
                    strokeWidth={2}
                    className="transition-all shadow-xs"
                  />

                  {/* Year Label on X Axis */}
                  <text
                    x={x}
                    y={chartHeight - paddingBottom + 16}
                    textAnchor="middle"
                    className={`text-[10px] font-mono transition-all ${
                      isHovered
                        ? 'fill-emerald-700 font-bold text-[11px]'
                        : 'fill-slate-500'
                    }`}
                    transform={filteredData.length > 20 ? `rotate(-45 ${x} ${chartHeight - paddingBottom + 16})` : undefined}
                  >
                    {filteredData.length > 25 && idx % 2 !== 0 && !isHovered ? '' : record.year}
                  </text>
                </g>
              );
            })}

            {/* 5-Year Rolling Moving Average Curve */}
            {movingAvgPath && (
              <path
                d={movingAvgPath}
                fill="none"
                stroke="#1e293b"
                strokeWidth={2}
                strokeDasharray="4 3"
                opacity={0.85}
              />
            )}
          </svg>

          {/* Hover Floating Details Card */}
          {hoveredYear && (
            <div
              className="absolute z-30 bg-slate-950/95 text-white p-3.5 rounded-2xl shadow-2xl border border-slate-700 text-xs w-72 pointer-events-none backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
              style={{
                top: '10px',
                right: '15px'
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-base font-headline font-black text-emerald-400">
                    {hoveredYear.year}
                  </span>
                  <span className="text-slate-300 font-bold">
                    • {hoveredYear.formattedDate}
                  </span>
                </div>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    hoveredYear.category === 'Early'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                      : hoveredYear.category === 'Delayed'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                  }`}
                >
                  {hoveredYear.deviationDays < 0
                    ? `${Math.abs(hoveredYear.deviationDays)}d ${lang === 'hi' ? 'पहले' : 'Early'}`
                    : hoveredYear.deviationDays > 0
                    ? `${hoveredYear.deviationDays}d ${lang === 'hi' ? 'देरी' : 'Late'}`
                    : lang === 'hi' ? 'समय पर' : 'Normal'}
                </span>
              </div>

              <div className="mt-2.5 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-400">ENSO Phase:</span>
                  <span className="font-bold text-white">{hoveredYear.ensoPhase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Indian Ocean Dipole:</span>
                  <span className="font-bold text-white">{hoveredYear.iodPhase}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Rain (% LPA):</span>
                  <span className={`font-mono font-bold ${
                    hoveredYear.rainfallPercentOfLPA >= 100 ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {hoveredYear.rainfallPercentOfLPA}% ({hoveredYear.totalRainfallMm} mm)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Monsoon Duration:</span>
                  <span className="font-mono text-slate-200">{hoveredYear.seasonDurationDays} days (Retreat: {hoveredYear.monsoonWithdrawalDate})</span>
                </div>
              </div>

              <p className="mt-2.5 pt-2 border-t border-slate-800 text-[11px] text-slate-300 leading-snug">
                {lang === 'hi' ? hoveredYear.notableFeaturesHi : hoveredYear.notableFeatures}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

