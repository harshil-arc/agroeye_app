import React, { useState } from 'react';
import { Compass, X, ShieldAlert } from 'lucide-react';
import { SpatialHazard, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

interface SpatialHazardsSectionProps {
  hazards: SpatialHazard[];
  lang: Language;
}

export const SpatialHazardsSection: React.FC<SpatialHazardsSectionProps> = ({
  hazards,
  lang,
}) => {
  const [selectedHazard, setSelectedHazard] = useState<SpatialHazard | null>(null);
  const t = translations[lang];

  if (!hazards || hazards.length === 0) return null;

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Medium':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <>
      <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-emerald-600" />
            <h3 className="font-headline text-xs uppercase tracking-wider text-slate-900 font-bold">
              {t.surroundingCalamities}
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-mono font-medium">
            {hazards.length} {t.spatialZonesDetected}
          </span>
        </div>

        {/* Hazard Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
          {hazards.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedHazard(item)}
              className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex flex-col justify-between cursor-pointer transition-all hover:border-emerald-400 hover:shadow-xs group"
            >
              <div>
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xl">{item.emoji}</span>
                  <span
                    className={`text-[9px] font-headline font-extrabold px-1.5 py-0.5 rounded uppercase border ${getSeverityBadge(
                      item.severity
                    )}`}
                  >
                    {item.severity}
                  </span>
                </div>
                <h4 className="font-headline text-xs font-bold text-slate-900 mt-2 line-clamp-1 group-hover:text-emerald-700">
                  {item.title}
                </h4>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500 font-medium">
                <span className="font-semibold text-slate-700">
                  {item.distanceKm} km {item.direction}
                </span>
                <span className="text-emerald-700 group-hover:underline font-bold">
                  {t.viewDetails} →
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Modal for Selected Spatial Hazard */}
      {selectedHazard && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-5 space-y-4 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="text-3xl">{selectedHazard.emoji}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] font-headline font-extrabold px-2 py-0.5 rounded uppercase border ${getSeverityBadge(
                        selectedHazard.severity
                      )}`}
                    >
                      {selectedHazard.severity}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-500">
                      {selectedHazard.distanceKm} km {selectedHazard.direction} of farm
                    </span>
                  </div>
                  <h3 className="font-headline text-base font-bold text-slate-900 mt-1">
                    {selectedHazard.title}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHazard(null)}
                className="p-1 text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 space-y-1">
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Onset Timeline:</span>
                <span className="font-bold text-slate-800">{selectedHazard.onset}</span>
              </div>
              <div className="flex justify-between font-mono">
                <span className="text-slate-500">Peak Threat Intensity:</span>
                <span className="font-bold text-rose-700">{selectedHazard.metric}</span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedHazard.description}
            </p>

            <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-emerald-900 space-y-1">
              <div className="flex items-center gap-1.5 font-headline text-xs font-bold uppercase tracking-wider text-emerald-800">
                <ShieldAlert className="w-4 h-4 text-emerald-700" />
                <span>Recommended Agronomic Action</span>
              </div>
              <p className="text-xs text-slate-800 leading-normal">
                {selectedHazard.precaution}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedHazard(null)}
              className="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-headline text-xs font-bold uppercase tracking-wider transition-all"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
