'use client';

import React from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';
import { MultiYearRainfallRecord } from '../../types/soilModule';

interface MultiYearRainfallChartProps {
  records: MultiYearRainfallRecord[];
  normalMm: number | null;
  monthName: string;
  averageMm: number;
  medianMm: number;
  lang?: 'en' | 'hi';
}

export const MultiYearRainfallChart: React.FC<MultiYearRainfallChartProps> = ({
  records,
  normalMm,
  monthName,
  averageMm,
  medianMm,
  lang = 'en',
}) => {
  const isHi = lang === 'hi';

  if (!records || records.length === 0) return null;

  const maxRain = Math.max(...records.map((r) => r.rainfallMm), (normalMm || 100) * 1.5, 50);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Excess':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Normal':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Deficient':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Scanty':
      default:
        return 'bg-rose-100 text-rose-900 border-rose-200';
    }
  };

  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="font-headline text-base font-bold text-slate-900 leading-tight">
              {isHi ? 'बहु-वर्षीय वर्षा तुलना (Multi-Year Climate Context)' : 'Multi-Year Historical Rainfall Record'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {monthName.split(' ')[0]} {isHi ? 'माह का ऐतिहासिक वर्षा रुझान (10-15 वर्ष)' : 'Monthly Pattern over Recent Decades'}
            </span>
          </div>
        </div>

        {/* Statistical Summary Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 font-headline font-bold text-slate-700">
            {isHi ? 'औसत:' : 'Avg:'} <span className="text-slate-900">{averageMm} mm</span>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 font-headline font-bold text-slate-700">
            {isHi ? 'माध्यिका:' : 'Median:'} <span className="text-slate-900">{medianMm} mm</span>
          </div>
          {normalMm && (
            <div className="px-2.5 py-1 rounded-xl bg-emerald-50 border border-emerald-200 font-headline font-bold text-emerald-800">
              {isHi ? 'सामान्य (IMD):' : 'IMD Normal:'} <span>{normalMm} mm</span>
            </div>
          )}
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="space-y-3 pt-2">
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-40 px-1 overflow-x-auto">
          {records.map((rec, idx) => {
            const heightPercent = Math.max(8, (rec.rainfallMm / maxRain) * 100);
            const isExcess = rec.status === 'Excess';
            const isDeficient = rec.status === 'Deficient' || rec.status === 'Scanty';

            return (
              <div
                key={idx}
                className="flex-1 min-w-[28px] max-w-[48px] flex flex-col items-center justify-end h-full gap-1 group"
              >
                <span className="text-[10px] font-mono font-bold text-slate-700">
                  {rec.rainfallMm}
                </span>

                <div
                  className={`w-full rounded-t-lg transition-all shadow-2xs ${
                    isExcess
                      ? 'bg-blue-600'
                      : isDeficient
                      ? 'bg-amber-500'
                      : 'bg-emerald-600'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                <span className="text-[10px] font-headline font-bold text-slate-600 mt-1">
                  {String(rec.year).slice(-2)}'
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-600" />
              <span>{isHi ? 'अतिवृष्टि (Excess > +20%)' : 'Excess (> +20%)'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
              <span>{isHi ? 'सामान्य (Normal ±19%)' : 'Normal (±19%)'}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
              <span>{isHi ? 'अल्पवृष्टि (Deficient < -20%)' : 'Deficient (< -20%)'}</span>
            </span>
          </div>

          <span className="font-mono text-[10px] text-slate-400">
            Source: ECMWF ERA5-Land Reanalysis &amp; IMD Normals
          </span>
        </div>
      </div>
    </div>
  );
};
