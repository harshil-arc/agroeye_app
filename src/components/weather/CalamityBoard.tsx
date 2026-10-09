import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { CalamityRiskRow, Language } from '../../types/weather';
import { translations } from '../../i18n/translations';

interface CalamityBoardProps {
  risks: CalamityRiskRow[];
  farmName: string;
  lang: Language;
}

export const CalamityBoard: React.FC<CalamityBoardProps> = ({ risks, farmName, lang }) => {
  const t = translations[lang];

  if (!risks || risks.length === 0) return null;

  const getRiskBadge = (severity: string) => {
    switch (severity) {
      case 'Critical':
        return 'bg-rose-100 text-rose-900 border-rose-200';
      case 'High':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'Medium':
        return 'bg-blue-100 text-blue-900 border-blue-200';
      case 'Low':
      default:
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse flex-shrink-0" />
          <div>
            <h2 className="font-headline text-base font-bold text-slate-900 leading-tight">
              ⚠️ {t.calamityBoardTitle}
            </h2>
            <span className="text-xs text-slate-500">
              {t.calamityBoardSub} <span className="font-semibold text-slate-700">{farmName}</span>
            </span>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-800 font-headline text-[10px] font-bold uppercase w-fit">
          {risks.length} {t.monitoredRisks}
        </span>
      </div>

      {/* Table of Calamities */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-headline uppercase text-[10px] tracking-wider">
              <th className="pb-2.5 font-bold">{t.naturalEvent}</th>
              <th className="pb-2.5 font-bold">{t.riskLevel}</th>
              <th className="pb-2.5 font-bold">{t.expectedOnset}</th>
              <th className="pb-2.5 font-bold hidden md:table-cell">{t.detailsAndPrecaution}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {risks.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                {/* Event Name */}
                <td className="py-3 pr-2">
                  <div className="flex items-center gap-2 font-headline font-bold text-slate-900">
                    <span className="text-base flex-shrink-0">{item.emoji}</span>
                    <span className="leading-snug">{item.event}</span>
                  </div>
                </td>

                {/* Risk Level Badge */}
                <td className="py-3 pr-2">
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-headline text-[10px] font-extrabold uppercase border shadow-2xs ${getRiskBadge(
                      item.risk
                    )}`}
                  >
                    {item.risk} ({item.riskPercent}%)
                  </span>
                </td>

                {/* Expected Time */}
                <td className="py-3 pr-2 font-headline font-semibold text-slate-700 whitespace-nowrap">
                  {item.expected}
                </td>

                {/* Details & Precautions */}
                <td className="py-3 text-slate-600 hidden md:table-cell max-w-sm">
                  <div className="space-y-0.5">
                    <p className="text-[11px] text-slate-500">{item.details}</p>
                    <p className="text-xs font-medium text-emerald-800">
                      💡 {item.precaution}
                    </p>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
