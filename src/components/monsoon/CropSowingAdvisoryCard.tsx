'use client';
import React from 'react';
import {
  Sprout,
  Tractor,
  Package,
  Droplets,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';
import { Language, PredictionResult } from '@/types/monsoon';
import { translations } from '@/i18n/monsoonTranslations';

interface CropSowingAdvisoryCardProps {
  prediction: PredictionResult;
  lang: Language;
}

export const CropSowingAdvisoryCard: React.FC<CropSowingAdvisoryCardProps> = ({
  prediction,
  lang,
}) => {
  const t = translations[lang];

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Title */}
      <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
              <CalendarCheck className="w-4 h-4" />
            </span>
            <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
              {t.cropAdvisoryTitle}
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            {t.cropAdvisorySub}
          </p>
        </div>

        <div className="px-3 py-1 bg-emerald-50 rounded-full border border-emerald-200 text-emerald-800 text-xs font-headline font-bold self-start sm:self-auto">
          {lang === 'hi' ? 'लक्षित बुवाई खिड़की:' : 'Target Window:'} <span className="text-emerald-950 font-mono">{prediction.estimatedDate}</span>
        </div>
      </div>

      {/* 4 Phases Timeline Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Phase 1 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
              <Tractor className="w-4 h-4" />
            </div>
            <h4 className="font-headline font-bold text-xs text-slate-900 leading-snug">
              {t.phase1Title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.phase1Desc}
          </p>
          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 self-start">
            Deep Summer Tillage
          </span>
        </div>

        {/* Phase 2 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
              <Package className="w-4 h-4" />
            </div>
            <h4 className="font-headline font-bold text-xs text-slate-900 leading-snug">
              {t.phase2Title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.phase2Desc}
          </p>
          <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 self-start">
            Certified Seed Stocking
          </span>
        </div>

        {/* Phase 3 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
              <Sprout className="w-4 h-4" />
            </div>
            <h4 className="font-headline font-bold text-xs text-slate-900 leading-snug">
              {t.phase3Title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.phase3Desc}
          </p>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 self-start">
            75-100 mm Rain Ingest
          </span>
        </div>

        {/* Phase 4 */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2.5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-100 text-cyan-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
              <Droplets className="w-4 h-4" />
            </div>
            <h4 className="font-headline font-bold text-xs text-slate-900 leading-snug">
              {t.phase4Title}
            </h4>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            {t.phase4Desc}
          </p>
          <span className="text-[10px] font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200 self-start">
            Farm Ponds & Bunding
          </span>
        </div>
      </div>
    </section>
  );
};

