'use client';

import React from 'react';
import {
  CloudRain,
  Layers,
  TrendingDown,
  ArrowDownCircle,
  Sprout,
  Droplets,
  Gauge,
  ShieldCheck,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { WaterBalanceResult } from '../../types/soilModule';

interface WaterBalanceCardProps {
  result: WaterBalanceResult;
  lang?: 'en' | 'hi';
}

export const WaterBalanceCard: React.FC<WaterBalanceCardProps> = ({ result, lang = 'en' }) => {
  const isHi = lang === 'hi';

  const getStressBadge = (status: string) => {
    switch (status) {
      case 'no_stress':
        return {
          label: isHi ? 'तनाव मुक्त (पर्याप्त नमी)' : 'No Water Stress (Adequate)',
          classes: 'bg-emerald-100 text-emerald-900 border-emerald-300',
          icon: ShieldCheck,
          iconColor: 'text-emerald-600',
          desc: isHi ? 'पौधों की जड़ों में पर्याप्त उपलब्ध जल है।' : 'Root zone has sufficient readily available water.',
        };
      case 'moderate_stress':
        return {
          label: isHi ? 'मध्यम तनाव (हल्की सिंचाई आवश्यक)' : 'Moderate Stress (Irrigation Advised)',
          classes: 'bg-amber-100 text-amber-900 border-amber-300',
          icon: AlertTriangle,
          iconColor: 'text-amber-600',
          desc: isHi ? 'उपलब्ध नमी घटी है; 1 हल्की सिंचाई अनुशंसित है।' : 'Available moisture is declining; supplementary irrigation recommended.',
        };
      case 'severe_stress':
        return {
          label: isHi ? 'गंभीर जल तनाव (तत्काल सिंचाई)' : 'Severe Moisture Stress (Critical)',
          classes: 'bg-rose-100 text-rose-900 border-rose-300',
          icon: AlertTriangle,
          iconColor: 'text-rose-600',
          desc: isHi ? 'मिट्टी मुरझान बिंदु के करीब है; तुरंत पानी दें।' : 'Soil water near permanent wilting point; urgent irrigation required.',
        };
      case 'waterlogged':
      default:
        return {
          label: isHi ? 'जलभराव (जल निकास आवश्यक)' : 'Waterlogged (Drainage Needed)',
          classes: 'bg-sky-100 text-sky-900 border-sky-300',
          icon: AlertTriangle,
          iconColor: 'text-sky-600',
          desc: isHi ? 'जड़ों में हवा की कमी; जल निकासी नाली खोलें।' : 'Root zone saturated; open boundary drainage furrows.',
        };
    }
  };

  const stressInfo = getStressBadge(result.overallWaterStressStatus);
  const StressIcon = stressInfo.icon;

  return (
    <div className="space-y-4">
      {/* 1. Overall Water Stress Diagnosis Banner */}
      <div className={`p-4 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${stressInfo.classes}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/80 border border-black/10 flex items-center justify-center flex-shrink-0 shadow-2xs">
            <StressIcon className={`w-5 h-5 ${stressInfo.iconColor}`} />
          </div>
          <div>
            <span className="text-[10px] font-headline uppercase font-extrabold tracking-wider block opacity-75">
              {isHi ? 'फसल जल तनाव स्थिति' : 'Crop Root-Zone Water Stress Status'}
            </span>
            <h3 className="font-headline text-base sm:text-lg font-extrabold leading-tight">
              {stressInfo.label}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              {stressInfo.desc}
            </p>
          </div>
        </div>

        <div className="flex items-baseline gap-2 self-start sm:self-auto bg-white/90 px-3.5 py-1.5 rounded-xl border border-black/10 flex-shrink-0">
          <span className="text-[11px] font-headline font-bold text-slate-600">
            {isHi ? 'उपलब्ध जल:' : 'Available Water:'}
          </span>
          <span className="font-headline text-lg font-black text-slate-900">
            {result.finalAvailableWaterPercent}%
          </span>
        </div>
      </div>

      {/* 2. Grid of 9 Scientifically Defensible Water-Balance Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Card 1: Total Rainfall Received */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span className="truncate">{isHi ? 'कुल प्राप्त वर्षा' : 'Total Rainfall Received'}</span>
            <CloudRain className="w-4 h-4 text-sky-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {result.totalRainfallMm}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">mm</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {isHi ? `दीर्घकालिक सामान्य: ${result.longTermNormalMm || 100} mm` : `Normal: ${result.longTermNormalMm || 100} mm`}
          </span>
        </div>

        {/* Card 2: Estimated Infiltration */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span className="truncate">{isHi ? 'मृदा में समाहित जल' : 'Rainfall Infiltrated'}</span>
            <ArrowDownCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-emerald-700 tracking-tight">
              {result.totalInfiltratedMm}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">mm</span>
          </div>
          <span className="text-[10px] text-emerald-700 font-medium">
            {result.totalRainfallMm > 0
              ? `${Math.round((result.totalInfiltratedMm / result.totalRainfallMm) * 100)}% ${isHi ? 'वर्षा समाहित हुई' : 'effective intake'}`
              : (isHi ? 'शुष्क अवधि' : 'Dry period')}
          </span>
        </div>

        {/* Card 3: Runoff Losses */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span className="truncate">{isHi ? 'सतही बहाव हानि (Runoff)' : 'Runoff Losses (Q)'}</span>
            <TrendingDown className="w-4 h-4 text-amber-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-amber-800 tracking-tight">
              {result.totalRunoffLossMm}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">mm</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            SCS-CN Curve No: {result.soilProfile.curveNumberBase}
          </span>
        </div>

        {/* Card 4: Deep Drainage Losses */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span className="truncate">{isHi ? 'गहरा रिसाव (Deep Drainage)' : 'Deep Drainage Losses'}</span>
            <Layers className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-indigo-900 tracking-tight">
              {result.totalDeepDrainageMm}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">mm</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {isHi ? 'जड़ क्षेत्र के नीचे रिसाव' : 'Percolated below root zone'}
          </span>
        </div>

        {/* Card 5: Crop Evapotranspiration */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span className="truncate">{isHi ? 'फसल वाष्पोत्सर्जन (ETa)' : 'Crop Water Use (ETa)'}</span>
            <Sprout className="w-4 h-4 text-teal-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-teal-800 tracking-tight">
              {result.totalCropWaterUseMm}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">mm</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {isHi ? `मांग: ${result.totalPotentialWaterDemandMm} mm` : `Demand: ${result.totalPotentialWaterDemandMm} mm`}
          </span>
        </div>

        {/* Card 6: Net Retained in Root Zone */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span className="truncate">{isHi ? 'जड़ क्षेत्र में संचित जल' : 'Root-Zone Water Storage'}</span>
            <Droplets className="w-4 h-4 text-blue-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-blue-900 tracking-tight">
              {result.finalRootZoneStorageMm}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">mm</span>
          </div>
          <span className="text-[10px] text-blue-700 font-mono">
            S(t) / TAW: {result.finalAvailableWaterPercent}%
          </span>
        </div>

        {/* Card 7: Total Available Capacity (TAW) */}
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-[11px] font-medium">
            <span className="truncate">{isHi ? 'कुल उपलब्ध जल क्षमता (TAW)' : 'Soil Water Capacity (TAW)'}</span>
            <Gauge className="w-4 h-4 text-slate-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {result.TAW}
            </span>
            <span className="text-xs text-slate-500 font-bold ml-1">mm</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">
            {isHi ? `AWC: ${Math.round(result.AWC * 1000)} mm/m • जड़: ${result.effectiveRootDepthMm} mm` : `AWC: ${Math.round(result.AWC * 1000)} mm/m • Depth: ${result.effectiveRootDepthMm} mm`}
          </span>
        </div>

        {/* Card 8: Estimated Available Soil Water (%) */}
        <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-800 text-[11px] font-bold">
            <span className="truncate">{isHi ? 'अनुमानित उपलब्ध मृदा जल' : 'Est. Available Soil Water'}</span>
            <Droplets className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          </div>
          <div className="mt-2 mb-1">
            <span className="font-headline text-2xl sm:text-3xl font-extrabold text-emerald-950 tracking-tight">
              {result.finalAvailableWaterPercent}%
            </span>
          </div>
          <span className="text-[10px] text-emerald-800 font-mono">
            VWC: {result.finalVolumetricWaterContent} m³/m³
          </span>
        </div>
      </div>
    </div>
  );
};
