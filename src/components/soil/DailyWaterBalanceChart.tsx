'use client';

import React, { useState } from 'react';
import { BarChart3, Droplets, ArrowDownCircle, AlertCircle } from 'lucide-react';
import { DailyWaterBalanceStep } from '../../types/soilModule';

interface DailyWaterBalanceChartProps {
  steps: DailyWaterBalanceStep[];
  tawMm: number;
  rawMm: number;
  monthName: string;
  lang?: 'en' | 'hi';
}

export const DailyWaterBalanceChart: React.FC<DailyWaterBalanceChartProps> = ({
  steps,
  tawMm,
  rawMm,
  monthName,
  lang = 'en',
}) => {
  const [activeView, setActiveView] = useState<'storage' | 'rainfall'>('storage');
  const [selectedDay, setSelectedDay] = useState<DailyWaterBalanceStep | null>(null);

  const isHi = lang === 'hi';

  if (!steps || steps.length === 0) return null;

  const maxRain = Math.max(...steps.map((s) => s.rainfall), 15);
  const maxStorage = Math.max(tawMm * 1.15, ...steps.map((s) => s.storageEnd), 40);

  // SVG dimensions for storage curve
  const width = 600;
  const height = 180;
  const padX = 40;
  const padY = 25;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  // Points for storage curve S(t)
  const storagePoints = steps.map((s, idx) => {
    const x = padX + (idx / Math.max(1, steps.length - 1)) * chartW;
    const y = padY + (1 - s.storageEnd / maxStorage) * chartH;
    return { x, y, step: s };
  });

  const storagePath = storagePoints.reduce(
    (acc, p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`),
    ''
  );

  const storageArea = `${storagePath} L ${storagePoints[storagePoints.length - 1].x} ${height - padY} L ${padX} ${height - padY} Z`;

  // Y coordinate for TAW line (Field Capacity)
  const tawY = padY + (1 - tawMm / maxStorage) * chartH;
  // Y coordinate for RAW line (Stress Threshold)
  const rawY = padY + (1 - rawMm / maxStorage) * chartH;

  return (
    <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
      {/* Chart Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <h3 className="font-headline text-base font-bold text-slate-900 leading-tight">
              {isHi ? 'दैनिक जल-संतुलन एवं मृदा-नमी प्रक्षेपवक्र' : 'Daily Water-Balance & Storage Trajectory'}
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              {monthName} • {isHi ? 'दैनिक समय-चरण विश्लेषण (Daily Time-Step Model)' : 'Physical Root-Zone Simulation'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveView('storage')}
            className={`px-3 py-1.5 rounded-lg font-headline text-xs font-bold transition-all cursor-pointer ${
              activeView === 'storage'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💧 {isHi ? 'मृदा जल संचय S(t)' : 'Root Storage S(t)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('rainfall')}
            className={`px-3 py-1.5 rounded-lg font-headline text-xs font-bold transition-all cursor-pointer ${
              activeView === 'rainfall'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌧️ {isHi ? 'वर्षा एवं रिसाव' : 'Rain & Intake'}
          </button>
        </div>
      </div>

      {/* VIEW 1: Root-Zone Storage vs TAW & RAW Thresholds */}
      {activeView === 'storage' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 bg-blue-600 inline-block" />
                <strong className="text-slate-800">{isHi ? 'संचित जल S(t)' : 'Storage S(t)'}</strong>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-b border-dashed border-emerald-600 inline-block" />
                <span>{isHi ? `क्षमता (TAW: ${tawMm} mm)` : `Field Capacity (TAW: ${tawMm} mm)`}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-0.5 border-b border-dashed border-rose-500 inline-block" />
                <span className="text-rose-700">{isHi ? `तनाव सीमा (RAW: ${rawMm} mm)` : `Stress Threshold (RAW: ${rawMm} mm)`}</span>
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[500px] h-44">
              <defs>
                <linearGradient id="storageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0284c7" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity="0.03" />
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1={padX} y1={padY} x2={width - padX} y2={padY} stroke="#f1f5f9" />
              <line x1={padX} y1={height - padY} x2={width - padX} y2={height - padY} stroke="#cbd5e1" strokeWidth="1.5" />

              {/* TAW Line (Capacity) */}
              <line
                x1={padX}
                y1={tawY}
                x2={width - padX}
                y2={tawY}
                stroke="#059669"
                strokeDasharray="4 4"
                strokeWidth="1.5"
              />
              <text x={width - padX + 5} y={tawY + 3} className="text-[9px] font-mono fill-emerald-800 font-bold">
                TAW
              </text>

              {/* RAW Line (Stress Threshold) */}
              <line
                x1={padX}
                y1={rawY}
                x2={width - padX}
                y2={rawY}
                stroke="#e11d48"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
              <text x={width - padX + 5} y={rawY + 3} className="text-[9px] font-mono fill-rose-700 font-bold">
                RAW
              </text>

              {/* Area & Storage Curve */}
              <path d={storageArea} fill="url(#storageGrad)" />
              <path d={storagePath} fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />

              {/* Interactive Circles on Days with Rain or Low Moisture */}
              {storagePoints.map((pt, idx) => (
                <g
                  key={idx}
                  onClick={() => setSelectedDay(pt.step)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={pt.step.rainfall > 0 ? 4 : 2.5}
                    fill={pt.step.rainfall > 0 ? '#0284c7' : '#ffffff'}
                    stroke="#0284c7"
                    strokeWidth="1.5"
                  />
                  {idx % 5 === 0 && (
                    <text
                      x={pt.x}
                      y={height - 8}
                      textAnchor="middle"
                      className="text-[9px] font-headline font-semibold fill-slate-400"
                    >
                      D{pt.step.dayIndex}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

      {/* VIEW 2: Daily Rainfall vs Infiltration Bar Chart */}
      {activeView === 'rainfall' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-sky-500" />
                <span>{isHi ? 'कुल वर्षा (P)' : 'Total Rain (P)'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-emerald-600" />
                <span>{isHi ? 'समाहित वर्षा (P_eff)' : 'Infiltrated (P_eff)'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                <span>{isHi ? 'बहाव (Runoff)' : 'Runoff (Q)'}</span>
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-1 h-36 pt-4 px-1 overflow-x-auto">
            {steps.map((step, idx) => {
              const rainHeight = Math.max(0, (step.rainfall / maxRain) * 100);
              const infHeight = Math.max(0, (step.effectiveRainfall / maxRain) * 100);

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedDay(step)}
                  className="flex-1 min-w-[12px] flex flex-col items-center justify-end h-full gap-0.5 cursor-pointer group"
                >
                  {step.rainfall > 0 && (
                    <span className="text-[8px] font-mono text-sky-700 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      {step.rainfall}
                    </span>
                  )}
                  <div
                    className="w-full max-w-[14px] bg-sky-200 rounded-t-sm relative overflow-hidden"
                    style={{ height: `${rainHeight}%` }}
                  >
                    <div
                      className="w-full bg-emerald-600 absolute bottom-0 left-0"
                      style={{ height: `${step.rainfall > 0 ? (step.effectiveRainfall / step.rainfall) * 100 : 0}%` }}
                    />
                  </div>
                  {idx % 4 === 0 && (
                    <span className="text-[8px] font-headline text-slate-400 mt-1">
                      {step.dayIndex}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Day Telemetry Inspector */}
      {selectedDay && (
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="font-headline font-bold text-slate-900">
              📅 {selectedDay.date} (Day {selectedDay.dayIndex}):
            </span>
            <span>Rain: <strong>{selectedDay.rainfall} mm</strong></span>
            <span>Infiltrated: <strong className="text-emerald-700">{selectedDay.effectiveRainfall} mm</strong></span>
            <span>Crop ETa: <strong>{selectedDay.actualETa} mm</strong></span>
            <span>Storage S(t): <strong className="text-blue-700">{selectedDay.storageEnd} mm ({selectedDay.availableWaterPercent}%)</strong></span>
          </div>
          <button
            onClick={() => setSelectedDay(null)}
            className="text-[10px] text-slate-400 hover:text-slate-800 font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};
