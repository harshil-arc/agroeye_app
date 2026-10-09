'use client';
import React from 'react';
import {
  Calendar,
  Clock,
  Zap,
  TrendingDown,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Language, PredictionResult } from '@/types/monsoon';
import { translations } from '@/i18n/monsoonTranslations';
import { calculateHistoricalStats } from '@/utils/monsoonPredictor';

interface MonsoonSummaryCardsProps {
  prediction: PredictionResult;
  lang: Language;
}

export const MonsoonSummaryCards: React.FC<MonsoonSummaryCardsProps> = ({
  prediction,
  lang
}) => {
  const t = translations[lang];
  const stats = calculateHistoricalStats();

  const isEarly = prediction.deviationFromNormal < -1;
  const isDelayed = prediction.deviationFromNormal > 1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
      {/* Card 1: IMD Normal Baseline */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-headline uppercase font-bold text-slate-500 tracking-wider">
            {t.normalKeralaOnset}
          </span>
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-headline font-extrabold text-slate-900 tracking-tight">
            01 June
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {t.normalKeralaSub}
          </p>
        </div>
      </div>

      {/* Card 2: 55-Year Historical Mean */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-headline uppercase font-bold text-slate-500 tracking-wider">
            {t.historicalMeanDate}
          </span>
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-headline font-extrabold text-blue-900 tracking-tight flex items-baseline gap-1.5">
            {stats.meanDateFormatted}
            <span className="text-xs font-mono font-bold text-slate-500">±{stats.stdDev}d</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            {stats.earlyPercent}% {lang === 'hi' ? 'पहले' : 'Early'} • {stats.normalPercent}% {lang === 'hi' ? 'सामान्य' : 'Normal'} • {stats.delayPercent}% {lang === 'hi' ? 'देरी' : 'Late'}
          </p>
        </div>
      </div>

      {/* Card 3: Earliest Onset Record */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-headline uppercase font-bold text-slate-500 tracking-wider">
            {t.earliestOnsetEver}
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
            <TrendingDown className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-headline font-extrabold text-teal-800 tracking-tight flex items-baseline gap-1.5">
            18 May <span className="text-xs font-mono font-bold text-teal-600">(2004)</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-teal-700">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>14 {lang === 'hi' ? 'दिन पूर्व आगमन' : 'days ahead of normal'}</span>
          </div>
        </div>
      </div>

      {/* Card 4: Most Delayed Onset Record */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-headline uppercase font-bold text-slate-500 tracking-wider">
            {t.latestOnsetEver}
          </span>
          <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Zap className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-headline font-extrabold text-amber-900 tracking-tight flex items-baseline gap-1.5">
            18 June <span className="text-xs font-mono font-bold text-amber-700">(1972)</span>
          </div>
          <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-amber-700">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>17 {lang === 'hi' ? 'दिन की ऐतिहासिक देरी' : 'days delayed record'}</span>
          </div>
        </div>
      </div>

      {/* Card 5: Current Year Prediction (Featured Card) */}
      <div className="bg-gradient-to-br from-emerald-700 to-teal-800 text-white rounded-2xl p-4 border border-emerald-600 shadow-md relative overflow-hidden group sm:col-span-2 lg:col-span-1">
        <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full blur-sm pointer-events-none" />
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-headline uppercase font-bold text-emerald-100 tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-300" />
            {prediction.targetYear} {lang === 'hi' ? 'अनुमान' : 'Estimate'}
          </span>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isEarly
              ? 'bg-emerald-400/30 text-emerald-100 border border-emerald-300/40'
              : isDelayed
              ? 'bg-amber-400/30 text-amber-100 border border-amber-300/40'
              : 'bg-white/20 text-white border border-white/30'
          }`}>
            {isEarly
              ? `${Math.abs(prediction.deviationFromNormal)}d ${lang === 'hi' ? 'पहले' : 'Early'}`
              : isDelayed
              ? `${prediction.deviationFromNormal}d ${lang === 'hi' ? 'देरी' : 'Late'}`
              : lang === 'hi' ? 'समय पर' : 'On Time'}
          </span>
        </div>
        <div className="mt-2.5">
          <div className="text-2xl font-headline font-black text-white tracking-tight">
            {prediction.estimatedDate}
          </div>
          <p className="text-[10px] text-emerald-100/90 font-medium mt-1">
            CI: {prediction.confidenceIntervalMin} – {prediction.confidenceIntervalMax}
          </p>
        </div>
      </div>
    </div>
  );
};

