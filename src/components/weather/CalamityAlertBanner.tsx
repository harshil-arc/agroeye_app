import React from 'react';
import { TriangleAlert, ShieldAlert, X } from 'lucide-react';
import { DisasterAlert, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

interface CalamityAlertBannerProps {
  alerts: DisasterAlert[];
  onDismiss: (id: string) => void;
  lang: Language;
}

export const CalamityAlertBanner: React.FC<CalamityAlertBannerProps> = ({
  alerts,
  onDismiss,
  lang,
}) => {
  if (!alerts || alerts.length === 0) return null;

  const t = translations[lang];
  // Sort critical first
  const topAlert = alerts.find((a) => a.severity === 'Critical') || alerts[0];
  const isCritical = topAlert.severity === 'Critical';

  return (
    <div
      className={`rounded-2xl border p-4 shadow-md transition-all animate-in fade-in slide-in-from-top-2 ${
        isCritical
          ? 'bg-rose-50 border-rose-300 text-rose-950 shadow-rose-100'
          : 'bg-amber-50 border-amber-300 text-amber-950 shadow-amber-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              isCritical ? 'bg-rose-600 text-white animate-bounce' : 'bg-amber-500 text-slate-950'
            }`}
          >
            {isCritical ? <ShieldAlert className="w-5 h-5" /> : <TriangleAlert className="w-5 h-5" />}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-headline font-extrabold uppercase tracking-wider ${
                  isCritical ? 'bg-rose-600 text-white' : 'bg-amber-600 text-white'
                }`}
              >
                {topAlert.severity} • {topAlert.probability}% {lang === 'hi' ? 'संभावना' : 'Risk'}
              </span>
              <span className="text-[11px] font-mono font-bold text-slate-600">
                {topAlert.onset}
              </span>
            </div>

            <h3 className="font-headline text-base font-bold text-slate-950 leading-tight">
              {topAlert.title}
            </h3>

            <p className="text-xs text-slate-700 leading-relaxed max-w-3xl">
              {topAlert.description}
            </p>

            {/* Direct Farmer Precautions */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-200/80">
              <span className="text-[11px] font-headline uppercase font-bold text-slate-800 block mb-1">
                ⚠️ {t.recommendedAction}
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-800">
                {topAlert.precautions.map((precaution, idx) => (
                  <div key={idx} className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{precaution}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDismiss(topAlert.id)}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-800 transition-colors flex-shrink-0"
          title={t.dismiss}
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
