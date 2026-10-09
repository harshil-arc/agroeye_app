'use client';
import React from 'react';
import {
  Activity,
  Layers,
  Sparkles,
  TrendingUp,
  CloudRain,
  Sun,
  Wind
} from 'lucide-react';
import { Language } from '@/types/monsoon';
import { translations } from '@/i18n/monsoonTranslations';

interface CorrelationAnalysisSectionProps {
  lang: Language;
}

export const CorrelationAnalysisSection: React.FC<CorrelationAnalysisSectionProps> = ({ lang }) => {
  const t = translations[lang];

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
      {/* Title */}
      <div className="pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-1 rounded-lg bg-emerald-100 text-emerald-700">
            <Activity className="w-4 h-4" />
          </span>
          <h2 className="text-lg sm:text-xl font-headline font-extrabold text-slate-900 tracking-tight">
            {t.correlationTitle}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          {t.correlationSub}
        </p>
      </div>

      {/* 3 Teleconnection Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* La Niña Card */}
        <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-emerald-900 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-emerald-600" />
                {t.laNinaTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 text-[10px] font-mono font-bold">
                18 Historical Years
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-700 space-y-1.5">
              <p className="font-headline font-extrabold text-emerald-950 text-sm">
                {t.avgDevLaNina}
              </p>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                {lang === 'hi'
                  ? 'मजबूत व्यापारिक हवाएं और ठंडा प्रशांत महासागर भारतीय तटों की ओर बादलों का भारी प्रवाह लाते हैं। 83% ला नीना वर्षों में समय से पूर्व या सामान्य आगमन हुआ।'
                  : 'Robust equatorial easterlies and cold Pacific SST accelerate early onset. 83% of La Niña years exhibited early or textbook on-time arrivals with healthy rainfall.'}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-emerald-200/80 text-[11px] font-mono font-bold text-emerald-700 flex justify-between">
            <span>Drought Frequency: 11%</span>
            <span>Excess Rain Freq: 56%</span>
          </div>
        </div>

        {/* El Niño Card */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-amber-900 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-600" />
                {t.elNinoTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-[10px] font-mono font-bold">
                17 Historical Years
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-700 space-y-1.5">
              <p className="font-headline font-extrabold text-amber-950 text-sm">
                {t.avgDevElNino}
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                {lang === 'hi'
                  ? 'प्रशांत महासागर की गर्माहट मानसूनी हवाओं को कमजोर करती है। 64% अल नीनो वर्षों में 4 से 17 दिन की देरी और सामान्य से कम कुल वर्षा दर्ज की गई।'
                  : 'Warm Pacific waters weaken the monsoon circulation cells. 64% of El Niño years exhibited 4 to 17 day delays and sub-100% LPA cumulative rainfall.'}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-amber-200/80 text-[11px] font-mono font-bold text-amber-700 flex justify-between">
            <span>Drought Frequency: 47%</span>
            <span>Excess Rain Freq: 12%</span>
          </div>
        </div>

        {/* Neutral Card */}
        <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-headline font-bold text-blue-900 flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-blue-600" />
                {t.neutralTitle}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-blue-200 text-blue-800 text-[10px] font-mono font-bold">
                20 Historical Years
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-700 space-y-1.5">
              <p className="font-headline font-extrabold text-blue-950 text-sm">
                {t.avgDevNeutral}
              </p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                {lang === 'hi'
                  ? 'तटस्थ वर्षों में मानसून आगमन स्थानीय मौसमी भंवरों, चक्रवातों और हिंद महासागर द्विध्रुव (IOD) पर अधिक निर्भर करता है।'
                  : 'During neutral years, onset timing is modulated by Indian Ocean SST anomalies, pre-monsoon cyclogenesis, and the Madden-Julian Oscillation.'}
              </p>
            </div>
          </div>
          <div className="pt-2 border-t border-blue-200/80 text-[11px] font-mono font-bold text-blue-700 flex justify-between">
            <span>Drought Frequency: 15%</span>
            <span>Excess Rain Freq: 35%</span>
          </div>
        </div>
      </div>

      {/* Synthesized Agro-Meteorological Insight Box */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-start gap-3">
        <Sparkles className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs">
          <h4 className="font-headline font-bold text-emerald-300">
            {t.correlationInsightTitle}
          </h4>
          <p className="text-slate-200 mt-1 leading-relaxed">
            {t.correlationInsightText}
          </p>
        </div>
      </div>
    </section>
  );
};

