// Smart Agronomic Irrigation Recommendation Engine

export interface IrrigationRecommendation {
  status: 'IRRIGATE_NOW' | 'HOLD_RAIN_EXPECTED' | 'OPTIMAL' | 'HOLD_WET_SOIL';
  title: string;
  badge: string;
  badgeColor: string;
  reason: string;
  recommendedVolumeLitersPerAcre: number;
  bestWindow: string;
  currentMetrics: {
    soilMoisturePercent: number;
    vpdKpa: number;
    forecastRainProbability: number;
    et0MmDay: number;
  };
}

export function computeIrrigationRecommendation(
  soilMoisturePercent: number,
  vpdKpa: number,
  forecastRainProb: number,
  et0MmDay: number
): IrrigationRecommendation {
  // 1. If high rain probability is expected (> 50%) -> Hold irrigation to prevent waterlogging & fertilizer leaching
  if (forecastRainProb > 50 && soilMoisturePercent > 45) {
    return {
      status: 'HOLD_RAIN_EXPECTED',
      title: 'Hold Irrigation — Rain Imminent',
      badge: '🌧️ HOLD (RAIN EXPECTED)',
      badgeColor: 'bg-blue-100 text-blue-900 border-blue-300',
      reason: `Rain probability is ${forecastRainProb}%. Suspend irrigation to prevent standing furrow water and root asphyxiation.`,
      recommendedVolumeLitersPerAcre: 0,
      bestWindow: 'Re-evaluate post-rainfall',
      currentMetrics: { soilMoisturePercent, vpdKpa, forecastRainProbability: forecastRainProb, et0MmDay },
    };
  }

  // 2. Critical Dry Soil (< 55%) or high Atmospheric Vapor Deficit (VPD > 1.8 kPa) -> Irrigate immediately
  if (soilMoisturePercent < 55 || (soilMoisturePercent < 65 && vpdKpa > 2.0)) {
    const deficit = Math.max(15, 80 - soilMoisturePercent);
    const volume = Math.round(deficit * 280); // ~280 L per acre per % moisture deficit
    return {
      status: 'IRRIGATE_NOW',
      title: 'Irrigation Required — Root Zone Deficit',
      badge: '💧 IRRIGATE NOW',
      badgeColor: 'bg-rose-100 text-rose-900 border-rose-300 animate-pulse',
      reason: `Soil volumetric moisture (${soilMoisturePercent}%) is below optimal threshold (65-80%). High transpiration rate (${et0MmDay} mm/day) accelerating deficit.`,
      recommendedVolumeLitersPerAcre: volume,
      bestWindow: 'Cool Night Hours (09:00 PM - 04:00 AM)',
      currentMetrics: { soilMoisturePercent, vpdKpa, forecastRainProbability: forecastRainProb, et0MmDay },
    };
  }

  // 3. Excess Moisture (> 88%)
  if (soilMoisturePercent > 88) {
    return {
      status: 'HOLD_WET_SOIL',
      title: 'Hold Irrigation — Saturated Furrows',
      badge: '🌊 HOLD (SATURATED)',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      reason: `Soil moisture (${soilMoisturePercent}%) is near field capacity. Excess water may cause root fungal mold.`,
      recommendedVolumeLitersPerAcre: 0,
      bestWindow: 'Allow 24-48 hours natural drainage',
      currentMetrics: { soilMoisturePercent, vpdKpa, forecastRainProbability: forecastRainProb, et0MmDay },
    };
  }

  // 4. Optimal moisture range (55-85%)
  return {
    status: 'OPTIMAL',
    title: 'Moisture Levels Optimal',
    badge: '✅ OPTIMAL MOISTURE',
    badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    reason: `Soil moisture (${soilMoisturePercent}%) and VPD (${vpdKpa} kPa) are in the healthy agronomic growth band for foliar crops.`,
    recommendedVolumeLitersPerAcre: 0,
    bestWindow: 'Next check in 12 hours',
    currentMetrics: { soilMoisturePercent, vpdKpa, forecastRainProbability: forecastRainProb, et0MmDay },
  };
}
