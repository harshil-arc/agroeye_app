'use client';
import React from 'react';
import {
  Sliders,
  Sparkles,
  Calendar,
  Layers,
  Thermometer,
  CloudSnow,
  Wind,
  Info,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Compass,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Clock
} from 'lucide-react';
import {
  Language,
  PredictionParameters,
  PredictionResult,
  ENSOPhase,
  IODPhase,
  MJOPhase,
  SnowCover
} from '@/types/monsoon';
import { translations } from '@/i18n/monsoonTranslations';

interface PredictionEngineCardProps {
  params: PredictionParameters;
  onUpdateParams: (newParams: PredictionParameters) => void;
  prediction: PredictionResult;
  lang: Language;
}

export const PredictionEngineCard: React.FC<PredictionEngineCardProps> = ({
  params,
  onUpdateParams,
  prediction,
  lang
}) => {
  const t = translations[lang];

  const handleEnsoChange = (val: ENSOPhase) => {
    onUpdateParams({ ...params, ensoForecast: val });
  };

  const handleIodChange = (val: IODPhase) => {
    onUpdateParams({ ...params, iodForecast: val });
  };

  const handleSnowChange = (val: SnowCover) => {
    onUpdateParams({ ...params, eurasianSnowCover: val });
  };

  const handleSstChange = (val: number) => {
    onUpdateParams({ ...params, seaSurfaceTempAnomaly: val });
  };

  const applyPreset = (type: 'lanina' | 'elnino' | 'neutral') => {
    if (type === 'lanina') {
      onUpdateParams({
        ...params,
        ensoForecast: 'La Niña',
        iodForecast: 'Positive',
        seaSurfaceTempAnomaly: 0.8,
        eurasianSnowCover: 'Below Normal',
        mjoStatus: 'Active Bay of Bengal'
      });
    } else if (type === 'elnino') {
      onUpdateParams({
        ...params,
        ensoForecast: 'El Niño',
        iodForecast: 'Neutral',
        seaSurfaceTempAnomaly: -0.2,
        eurasianSnowCover: 'Above Normal',
        mjoStatus: 'Suppressed'
      });
    } else {
      onUpdateParams({
        ...params,
        ensoForecast: 'Neutral',
        iodForecast: 'Neutral',
        seaSurfaceTempAnomaly: 0.2,
        eurasianSnowCover: 'Normal',
        mjoStatus: 'Neutral'
      });
    }
  };

  const isEarly = prediction.deviationFromNormal < -1;
  const isDelayed = prediction.deviationFromNormal > 1;

  return (
    <section className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden space-y-0">
      {/* 1. Header Banner */}
      <div className="bg-slate-900 text-white p-5 sm:p-6 border-b border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-headline font-bold uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                {t.predictionLabBadge}
              </span>
              <span className="text-xs text-slate-400 font-mono font-bold">
                Target: {params.targetYear} Season
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-headline font-extrabold text-white mt-1.5">
              {t.predictionLabTitle}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {t.predictionLabDesc} <strong className="text-emerald-300">{params.targetYear}</strong>.
            </p>
          </div>

          {/* Quick Preset Buttons in Row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-headline uppercase font-bold text-slate-400 block w-full md:w-auto">
              {t.presetScenarios}
            </span>
            <button
              type="button"
              onClick={() => applyPreset('lanina')}
              className="px-3 py-1.5 rounded-xl bg-emerald-900/50 hover:bg-emerald-800/70 border border-emerald-500/40 text-emerald-200 text-xs font-headline font-bold transition-all cursor-pointer"
            >
              🌱 {t.laNinaScenario}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('elnino')}
              className="px-3 py-1.5 rounded-xl bg-amber-950/50 hover:bg-amber-900/70 border border-amber-500/40 text-amber-200 text-xs font-headline font-bold transition-all cursor-pointer"
            >
              ☀️ {t.elNinoScenario}
            </button>
            <button
              type="button"
              onClick={() => applyPreset('neutral')}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-headline font-bold transition-all cursor-pointer"
            >
              ⚖️ {t.neutralScenario}
            </button>
          </div>
        </div>
      </div>

      {/* 2. Primary Prediction Result Row Banner */}
      <div className={`p-5 sm:p-6 border-b transition-all ${
        isEarly
          ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
          : isDelayed
          ? 'bg-amber-50/70 border-amber-200 text-amber-950'
          : 'bg-blue-50/70 border-blue-200 text-blue-950'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Target Year -> Estimated Date */}
          <div className="flex items-center gap-3 sm:gap-5 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-headline font-black text-base sm:text-lg">
                {params.targetYear}
              </span>
            </div>

            <ArrowRight className="w-5 h-5 text-slate-400 hidden sm:block flex-shrink-0" />

            <div className="flex flex-col">
              <span className="text-[10px] font-headline uppercase font-bold tracking-wider opacity-75">
                {t.estimatedArrivalTitle}
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-headline font-black tracking-tight text-slate-900">
                  {prediction.estimatedDate}
                </span>
                <span className={`text-xs font-headline font-bold px-2.5 py-0.5 rounded-full border ${
                  isEarly
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : isDelayed
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-blue-100 text-blue-800 border-blue-300'
                }`}>
                  {prediction.deviationFromNormal < 0
                    ? `${Math.abs(prediction.deviationFromNormal)} ${t.daysEarly}`
                    : prediction.deviationFromNormal > 0
                    ? `${prediction.deviationFromNormal} ${t.daysLate}`
                    : t.onTime}
                </span>
              </div>
            </div>
          </div>

          {/* Confidence Window & Rainfall LPA */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block">
                {t.confidenceRange}
              </span>
              <span className="text-sm font-headline font-extrabold text-slate-900">
                {prediction.confidenceIntervalMin} – {prediction.confidenceIntervalMax}
              </span>
            </div>

            <div className="bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-headline uppercase font-bold text-slate-400 block">
                {t.estRainfallLPA}
              </span>
              <span className="text-sm font-headline font-extrabold text-emerald-700 font-mono">
                {prediction.estimatedRainfallLPA}% LPA
              </span>
            </div>
          </div>
        </div>

        {/* Probability Gauge Bar */}
        <div className="mt-4 pt-3 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-xs font-headline font-bold mb-1.5">
            <span>{t.probabilityDistribution}</span>
            <span className="font-mono text-[11px] text-slate-500">
              Early: {prediction.earlinessProbability}% • Normal: {prediction.normalProbability}% • Delayed: {prediction.delayProbability}%
            </span>
          </div>
          <div className="h-3.5 w-full bg-slate-200 rounded-full overflow-hidden flex shadow-inner">
            <div
              style={{ width: `${prediction.earlinessProbability}%` }}
              className="bg-emerald-600 transition-all duration-500"
              title={`${t.earlyProb}: ${prediction.earlinessProbability}%`}
            />
            <div
              style={{ width: `${prediction.normalProbability}%` }}
              className="bg-blue-500 transition-all duration-500"
              title={`${t.normalProb}: ${prediction.normalProbability}%`}
            />
            <div
              style={{ width: `${prediction.delayProbability}%` }}
              className="bg-amber-500 transition-all duration-500"
              title={`${t.delayedProb}: ${prediction.delayProbability}%`}
            />
          </div>
        </div>
      </div>

      {/* 3. Clean Row-Wise Parameter Tuning Strip */}
      <div className="p-5 sm:p-6 bg-slate-50/70 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between pb-1">
          <span className="text-xs font-headline font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-600" />
            {lang === 'hi' ? 'जलवायु चर समायोजन (Row-Wise Adjusters)' : 'Atmospheric Parameter Controls'}
          </span>
          <button
            type="button"
            onClick={() => applyPreset('neutral')}
            className="text-xs text-slate-500 hover:text-emerald-700 font-bold flex items-center gap-1 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            {t.resetDefault}
          </button>
        </div>

        {/* Row 1: Target Year & ENSO */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Target Year Row */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-headline font-bold text-slate-700 flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              {t.targetYearLabel}
            </span>
            <div className="flex gap-1.5">
              {[2026, 2025, 2027].map((yr) => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => onUpdateParams({ ...params, targetYear: yr })}
                  className={`px-3 py-1 rounded-xl text-xs font-headline font-bold transition-all border cursor-pointer ${
                    params.targetYear === yr
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* ENSO Row */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-headline font-bold text-slate-700 flex items-center gap-1.5 flex-shrink-0">
              <Wind className="w-3.5 h-3.5 text-emerald-600" />
              {t.ensoLabel}
            </span>
            <div className="flex gap-1.5">
              {(['La Niña', 'Neutral', 'El Niño'] as ENSOPhase[]).map((phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => handleEnsoChange(phase)}
                  className={`px-2.5 py-1 rounded-xl text-xs font-headline font-bold transition-all border cursor-pointer ${
                    params.ensoForecast === phase
                      ? phase === 'La Niña'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : phase === 'El Niño'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-blue-600 text-white border-blue-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {phase}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2: IOD & Eurasian Snow Cover & SST */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* IOD */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-headline font-bold text-slate-700 flex items-center gap-1.5 flex-shrink-0">
              <Compass className="w-3.5 h-3.5 text-blue-600" />
              IOD:
            </span>
            <div className="flex gap-1">
              {(['Positive', 'Neutral', 'Negative'] as IODPhase[]).map((phase) => (
                <button
                  key={phase}
                  type="button"
                  onClick={() => handleIodChange(phase)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-headline font-bold border cursor-pointer ${
                    params.iodForecast === phase
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {phase === 'Positive' ? '+Pos' : phase === 'Negative' ? '-Neg' : 'Neut'}
                </button>
              ))}
            </div>
          </div>

          {/* Snow Cover */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-headline font-bold text-slate-700 flex items-center gap-1.5 flex-shrink-0">
              <CloudSnow className="w-3.5 h-3.5 text-cyan-600" />
              Snow:
            </span>
            <div className="flex gap-1">
              {(['Below Normal', 'Normal', 'Above Normal'] as SnowCover[]).map((snow) => (
                <button
                  key={snow}
                  type="button"
                  onClick={() => handleSnowChange(snow)}
                  className={`px-2 py-1 rounded-lg text-[11px] font-headline font-bold border cursor-pointer ${
                    params.eurasianSnowCover === snow
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200'
                  }`}
                >
                  {snow === 'Below Normal' ? 'Low' : snow === 'Above Normal' ? 'High' : 'Normal'}
                </button>
              ))}
            </div>
          </div>

          {/* SST Anomaly Slider */}
          <div className="p-3 bg-white rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
            <span className="text-xs font-headline font-bold text-slate-700 flex items-center gap-1 flex-shrink-0">
              <Thermometer className="w-3.5 h-3.5 text-rose-500" />
              SST:
            </span>
            <input
              type="range"
              min="-1.5"
              max="2.0"
              step="0.1"
              value={params.seaSurfaceTempAnomaly}
              onChange={(e) => handleSstChange(parseFloat(e.target.value))}
              className="w-24 accent-emerald-600 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
            />
            <span className="font-mono text-xs font-bold text-slate-800 flex-shrink-0">
              {params.seaSurfaceTempAnomaly > 0 ? `+${params.seaSurfaceTempAnomaly.toFixed(1)}` : params.seaSurfaceTempAnomaly.toFixed(1)}°C
            </span>
          </div>
        </div>
      </div>

      {/* 4. Action Recommendation Row */}
      <div className="p-4 sm:p-5 bg-white flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-start gap-2.5">
          <span className="text-lg">🌾</span>
          <div>
            <span className="font-headline font-bold text-slate-900 block">
              {t.agronomicAdvisory}:
            </span>
            <p className="text-slate-600 mt-0.5 leading-snug">
              {lang === 'hi' ? prediction.riskAssessmentHi : prediction.riskAssessment}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-auto bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
          <span className="text-[11px] font-headline font-bold text-emerald-900">
            {lang === 'hi' ? 'तैयारी तिथि:' : 'Target Prep Date:'}
          </span>
          <span className="font-mono font-bold text-emerald-950">
            {prediction.confidenceIntervalMin}
          </span>
        </div>
      </div>
    </section>
  );
};

