'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  Sprout,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Droplets,
  CheckCircle2,
} from 'lucide-react';
import { SowingRecommendation, HarvestEstimation } from '../../types/soilModule';

interface SowingHarvestRecommendationProps {
  sowing: SowingRecommendation;
  harvest: HarvestEstimation;
  cropName: string;
  soilName: string;
  lang?: 'en' | 'hi';
}

export const SowingHarvestRecommendation: React.FC<SowingHarvestRecommendationProps> = ({
  sowing,
  harvest,
  cropName,
  soilName,
  lang = 'en',
}) => {
  const isHi = lang === 'hi';

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Low':
        return 'bg-emerald-100 text-emerald-900 border-emerald-200';
      case 'Moderate':
        return 'bg-amber-100 text-amber-900 border-amber-200';
      case 'High':
      default:
        return 'bg-rose-100 text-rose-900 border-rose-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. Sowing Window Decision Card */}
      <div className="p-4 sm:p-5 bg-gradient-to-br from-emerald-50/70 via-white to-sky-50/50 rounded-2xl border border-emerald-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-headline uppercase font-bold text-emerald-800 tracking-wider block">
                {isHi ? 'स्थान-विशिष्ट बुवाई अनुशंसा' : 'Location-Specific Sowing Recommendation'}
              </span>
              <h3 className="font-headline text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {isHi ? `${sowing.cropNameHi} हेतु सर्वश्रेष्ठ बुवाई खिड़की` : `Optimal Sowing Window for ${sowing.cropName}`}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <span
              className={`px-3 py-1 rounded-full text-xs font-headline font-extrabold uppercase border ${getRiskBadge(
                sowing.riskLevel
              )}`}
            >
              {isHi ? `जोखिम: ${sowing.riskLevel}` : `${sowing.riskLevel} Risk`}
            </span>

            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-headline font-black">
              {isHi ? `उपयुक्तता स्कोर: ${sowing.sowingSuitabilityScore}/100` : `Suitability: ${sowing.sowingSuitabilityScore}/100`}
            </span>
          </div>
        </div>

        {/* Sowing Period Date Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Primary Window */}
          <div className="p-3.5 bg-white rounded-xl border border-emerald-200/80 shadow-2xs">
            <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
              📅 {isHi ? 'अनुशंसित बुवाई अवधि' : 'Recommended Window'}
            </span>
            <span className="font-headline text-base sm:text-lg font-black text-emerald-800 mt-1 block">
              {sowing.recommendedWindowStart} – {sowing.recommendedWindowEnd}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {isHi ? `सर्वश्रेष्ठ माह: ${sowing.bestSowingMonthHi}` : `Peak Month: ${sowing.bestSowingMonth}`}
            </span>
          </div>

          {/* Seedbed Moisture Expectation */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
              💧 {isHi ? 'अंकुरण कालीन जल उपलब्धता' : 'Establishment Moisture'}
            </span>
            <span className="font-headline text-base sm:text-lg font-bold text-slate-800 mt-1 block">
              {sowing.waterAvailabilityStatus}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {isHi ? `अनुमानित वर्षा: ~${sowing.expectedEstablishmentRainfallMm} mm` : `Est. Rain: ~${sowing.expectedEstablishmentRainfallMm} mm`}
            </span>
          </div>

          {/* Rainfed / Irrigated Suitability */}
          <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
            <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block tracking-wider">
              🌾 {isHi ? 'वर्षा-आधारित उपयुक्तता' : 'Rainfed Cultivation'}
            </span>
            <span className="font-headline text-base sm:text-lg font-bold text-slate-800 mt-1 block">
              {sowing.isRainfedViable ? (isHi ? 'व्यवहार्य (Viable)' : 'Viable') : (isHi ? 'सिंचाई आवश्यक' : 'Irrigation Required')}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block truncate">
              {soilName}
            </span>
          </div>
        </div>

        {/* Agronomic Rationale Box */}
        <div className="p-3.5 bg-white/90 rounded-xl border border-emerald-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center gap-1.5 font-headline font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{isHi ? 'वैज्ञानिक बुवाई आधार (Agronomic Rationale):' : 'Agronomic Sowing Rationale:'}</span>
          </div>
          <p className="leading-relaxed">
            {isHi ? sowing.primaryRationaleHi : sowing.primaryRationale}
          </p>
          <p className="text-[11px] font-medium text-slate-600 pt-1 border-t border-slate-100">
            💡 <strong>{isHi ? 'सिंचाई परामर्श:' : 'Irrigation Advisory:'}</strong> {sowing.irrigationRecommendation}
          </p>
        </div>

        {/* Alternative Window (if applicable) */}
        {sowing.alternativeWindow && (
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-950 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-700 mt-0.5 flex-shrink-0" />
            <div>
              <strong className="font-headline font-bold block">
                {isHi ? 'वैकल्पिक बुवाई खिड़की (यदि वर्षा में देरी हो):' : 'Alternative Delayed Sowing Window:'}
              </strong>
              <span>
                {sowing.alternativeWindow.start} – {sowing.alternativeWindow.end}: {sowing.alternativeWindow.rationale}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Estimated Harvesting & Growth Stages Timeline Card */}
      <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-headline uppercase font-bold text-slate-400 tracking-wider block">
                {isHi ? 'फसल अवधि एवं परिपक्वता' : 'Crop Duration & Ripening Estimation'}
              </span>
              <h3 className="font-headline text-lg sm:text-xl font-extrabold text-slate-900 leading-tight">
                {isHi ? 'अनुमानित कटाई एवं परिपक्वता अवधि' : 'Estimated Harvesting & Ripening Window'}
              </h3>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 border border-slate-200 text-xs font-headline font-bold self-start sm:self-auto">
            {isHi ? `कुल अवधि: ~${harvest.cropDurationDays} दिन` : `Total Duration: ~${harvest.cropDurationDays} Days`}
          </span>
        </div>

        {/* Harvest Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200">
            <span className="text-[10px] font-headline uppercase font-bold text-amber-800 tracking-wider block">
              🌾 {isHi ? 'अनुमानित कटाई खिड़की' : 'Expected Harvest Window'}
            </span>
            <span className="font-headline text-base sm:text-lg font-extrabold text-amber-950 mt-1 block">
              {harvest.harvestWindowStart} – {harvest.harvestWindowEnd}
            </span>
            <span className="text-[11px] text-amber-800 mt-0.5 block font-medium">
              {isHi ? harvest.maturityTermHi : harvest.maturityTerm}
            </span>
          </div>

          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-headline uppercase font-bold text-slate-400 tracking-wider block">
              📅 {isHi ? 'पूर्ण परिपक्वता तिथि' : 'Estimated Physiological Maturity'}
            </span>
            <span className="font-headline text-base sm:text-lg font-extrabold text-slate-800 mt-1 block">
              {harvest.estimatedMaturityDate}
            </span>
            <span className="text-[11px] text-slate-500 mt-0.5 block">
              {isHi ? `बुवाई तिथि: ${harvest.recommendedSowingDate}` : `Based on sowing: ${harvest.recommendedSowingDate}`}
            </span>
          </div>
        </div>

        {/* Growth Stage Milestones Timeline */}
        <div className="space-y-2 pt-1">
          <span className="text-[11px] font-headline uppercase font-bold text-slate-700 block">
            🌱 {isHi ? 'फसल वृद्धि चरण एवं जल मांग (Growth Stage Milestones):' : 'Crop Growth Stages & Water Demands:'}
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {harvest.growthStageTimeline.map((stage, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 flex flex-col justify-between space-y-1.5 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] font-headline font-bold text-slate-400">
                      Phase {idx + 1}
                    </span>
                    <span
                      className={`text-[9px] font-headline font-extrabold px-1.5 py-0.2 rounded uppercase ${
                        stage.criticality === 'Critical'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : stage.criticality === 'High'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {stage.criticality}
                    </span>
                  </div>

                  <h4 className="font-headline text-xs font-bold text-slate-900 mt-1">
                    {isHi ? stage.stageHi : stage.stage}
                  </h4>
                </div>

                <div className="pt-1.5 border-t border-slate-200/60 text-[10px] text-slate-500 space-y-0.5">
                  <div className="flex justify-between font-mono">
                    <span>{stage.startDate} – {stage.endDate}</span>
                    <span className="font-bold text-slate-700">({stage.durationDays}d)</span>
                  </div>
                  <div className="flex justify-between text-blue-700 font-semibold">
                    <span>{isHi ? 'अनुमानित जल मांग:' : 'Water Demand:'}</span>
                    <span>~{stage.waterDemandMm} mm</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Harvest Weather Risks */}
        {harvest.potentialHarvestRisks && harvest.potentialHarvestRisks.length > 0 && (
          <div className="p-3.5 bg-rose-50/70 rounded-xl border border-rose-200/80 text-rose-950 space-y-1.5">
            <span className="font-headline text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span>{isHi ? 'कटाई के समय संभावित मौसम जोखिम:' : 'Potential Weather Risks Near Harvest:'}</span>
            </span>
            <ul className="text-xs space-y-1 list-disc list-inside text-slate-800">
              {(isHi ? harvest.potentialHarvestRisksHi : harvest.potentialHarvestRisks).map((risk, idx) => (
                <li key={idx}>{risk}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
