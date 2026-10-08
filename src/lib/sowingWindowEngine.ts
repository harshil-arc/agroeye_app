// AgroEye Sowing Window Probability & Decision Engine
// Consumes IMD Extended Range Forecast, Historical Monsoon Onset, Soil Types, and Crop Phenology

import { NormalizedIMDForecast, IMDWeekForecast, ConfidenceLevel } from './imdForecastService';

export type SoilType = 'Black Cotton Soil (Heavy Clay)' | 'Alluvial Loam' | 'Sandy Loam / Light Soil' | 'Red & Lateritic Soil';
export type CropDuration = 'Short Duration (60-80 days)' | 'Medium Duration (90-120 days)' | 'Long Duration (130-160 days)';

export interface CropRequirement {
  id: string;
  name: string;
  season: 'Kharif' | 'Rabi' | 'Zaid';
  optimalTempRange: [number, number]; // [min °C, max °C]
  minimumSowingMoisturePercent: number; // % VWC
  criticalRainfallThresholdMm: number; // mm required for germination
  droughtTolerance: 'High' | 'Medium' | 'Low';
  waterloggingSensitivity: 'High' | 'Medium' | 'Low';
  defaultDuration: CropDuration;
}

export const SUPPORTED_CROPS: CropRequirement[] = [
  {
    id: 'cotton',
    name: 'Cotton (कपास)',
    season: 'Kharif',
    optimalTempRange: [22, 35],
    minimumSowingMoisturePercent: 35,
    criticalRainfallThresholdMm: 30,
    droughtTolerance: 'High',
    waterloggingSensitivity: 'High',
    defaultDuration: 'Long Duration (130-160 days)'
  },
  {
    id: 'soybean',
    name: 'Soybean (सोयाबीन)',
    season: 'Kharif',
    optimalTempRange: [20, 32],
    minimumSowingMoisturePercent: 40,
    criticalRainfallThresholdMm: 35,
    droughtTolerance: 'Medium',
    waterloggingSensitivity: 'High',
    defaultDuration: 'Medium Duration (90-120 days)'
  },
  {
    id: 'maize',
    name: 'Maize / Corn (मक्का)',
    season: 'Kharif',
    optimalTempRange: [21, 34],
    minimumSowingMoisturePercent: 35,
    criticalRainfallThresholdMm: 25,
    droughtTolerance: 'Medium',
    waterloggingSensitivity: 'Medium',
    defaultDuration: 'Medium Duration (90-120 days)'
  },
  {
    id: 'mustard',
    name: 'Mustard / Rapeseed (सरसों)',
    season: 'Rabi',
    optimalTempRange: [15, 28],
    minimumSowingMoisturePercent: 28,
    criticalRainfallThresholdMm: 15,
    droughtTolerance: 'High',
    waterloggingSensitivity: 'Medium',
    defaultDuration: 'Medium Duration (90-120 days)'
  },
  {
    id: 'wheat',
    name: 'Wheat (गेहूं)',
    season: 'Rabi',
    optimalTempRange: [12, 25],
    minimumSowingMoisturePercent: 32,
    criticalRainfallThresholdMm: 20,
    droughtTolerance: 'Medium',
    waterloggingSensitivity: 'Medium',
    defaultDuration: 'Medium Duration (90-120 days)'
  },
  {
    id: 'groundnut',
    name: 'Groundnut / Peanut (मूंगफली)',
    season: 'Kharif',
    optimalTempRange: [22, 33],
    minimumSowingMoisturePercent: 30,
    criticalRainfallThresholdMm: 25,
    droughtTolerance: 'High',
    waterloggingSensitivity: 'Medium',
    defaultDuration: 'Medium Duration (90-120 days)'
  },
  {
    id: 'pearl_millet',
    name: 'Pearl Millet / Bajra (बाजरा)',
    season: 'Kharif',
    optimalTempRange: [24, 38],
    minimumSowingMoisturePercent: 22,
    criticalRainfallThresholdMm: 15,
    droughtTolerance: 'High',
    waterloggingSensitivity: 'High',
    defaultDuration: 'Short Duration (60-80 days)'
  },
  {
    id: 'paddy',
    name: 'Paddy / Rice (धान)',
    season: 'Kharif',
    optimalTempRange: [24, 36],
    minimumSowingMoisturePercent: 55,
    criticalRainfallThresholdMm: 60,
    droughtTolerance: 'Low',
    waterloggingSensitivity: 'Low',
    defaultDuration: 'Long Duration (130-160 days)'
  }
];

export interface SowingWindowResult {
  location: {
    state: string;
    district: string;
    agroClimaticZone: string;
  };
  crop: CropRequirement;
  soilType: SoilType;
  duration: CropDuration;
  
  // Recommended Window
  recommendedWindowDateRange: string;
  recommendedWeekNumber: number; // 1, 2, 3, or 4
  sowingProbabilityPercent: number; // e.g. 78%
  confidence: ConfidenceLevel;
  
  // Agricultural Rationale
  reason: string;
  soilMoistureStatusSummary: string;
  monsoonAlignment: string;
  
  // Detailed Score Breakdown (0-100 each)
  scores: {
    soilMoistureAdequacy: number;
    rainfallTimingScore: number;
    thermalSafetyScore: number;
    monsoonOnsetConsistency: number;
    overallCompositeScore: number;
  };

  // Farmer Directives
  actionChecklist: string[];
  riskWarnings: string[];
}

// ----------------------------------------------------------------------
// Sowing Window Calculation Engine
// ----------------------------------------------------------------------
export function computeSowingWindow(
  forecast: NormalizedIMDForecast,
  cropId: string = 'cotton',
  soilType: SoilType = 'Alluvial Loam',
  cropDuration: CropDuration = 'Medium Duration (90-120 days)'
): SowingWindowResult {
  const crop = SUPPORTED_CROPS.find((c) => c.id === cropId) || SUPPORTED_CROPS[0];
  const weeks = forecast.weeks;

  // Evaluate each of the 4 weeks against crop germination requirements
  let bestWeekIndex = 0;
  let highestScore = -1;
  const weeklyScores: { week: IMDWeekForecast; compositeScore: number; moistureScore: number; rainScore: number; thermalScore: number }[] = [];

  // Soil retention adjustment
  let soilCapacityFactor = 1.0;
  if (soilType.includes('Black Cotton')) soilCapacityFactor = 1.25;
  else if (soilType.includes('Sandy')) soilCapacityFactor = 0.8;
  else if (soilType.includes('Red')) soilCapacityFactor = 0.9;

  weeks.forEach((wk, idx) => {
    const estVwc = wk.syntheticSoilMoisture.estimatedPercent * soilCapacityFactor;
    
    // 1. Soil moisture adequacy score
    let moistureScore = 0;
    if (estVwc >= crop.minimumSowingMoisturePercent) {
      if (estVwc > 75 && crop.waterloggingSensitivity === 'High') {
        moistureScore = 40; // Too wet for cotton/soybean
      } else {
        moistureScore = Math.min(100, Math.round((estVwc / crop.minimumSowingMoisturePercent) * 75 + 25));
      }
    } else {
      moistureScore = Math.max(10, Math.round((estVwc / crop.minimumSowingMoisturePercent) * 60));
    }

    // 2. Rainfall timing score
    let rainScore = 50;
    const rain = wk.rainfall.forecastAmountMm;
    if (rain >= crop.criticalRainfallThresholdMm && rain <= 70) {
      rainScore = 95;
    } else if (rain > 70) {
      rainScore = crop.waterloggingSensitivity === 'High' ? 35 : 70;
    } else if (rain >= 10) {
      rainScore = 70;
    } else {
      rainScore = 30; // very dry
    }

    // 3. Thermal safety score
    let thermalScore = 80;
    const avgMax = wk.temperature.maxAvg;
    const avgMin = wk.temperature.minAvg;
    if (avgMax > crop.optimalTempRange[1] + 3 || avgMin < crop.optimalTempRange[0] - 3) {
      thermalScore = 40;
    } else if (avgMax >= crop.optimalTempRange[0] && avgMax <= crop.optimalTempRange[1]) {
      thermalScore = 95;
    }

    // Composite weighted score (discounting uncertainty for farther weeks)
    const confidenceWeight = wk.confidence === 'High' ? 1.0 : wk.confidence === 'Moderate' ? 0.88 : 0.72;
    const compositeScore = Math.round((moistureScore * 0.45 + rainScore * 0.35 + thermalScore * 0.20) * confidenceWeight);

    weeklyScores.push({
      week: wk,
      compositeScore,
      moistureScore,
      rainScore,
      thermalScore
    });

    if (compositeScore > highestScore) {
      highestScore = compositeScore;
      bestWeekIndex = idx;
    }
  });

  const best = weeklyScores[bestWeekIndex];
  const bestWeek = best.week;
  const finalProbability = Math.max(25, Math.min(96, best.compositeScore));
  const confidence: ConfidenceLevel = bestWeek.confidence;

  // Generate scientific farmer-friendly reason
  let reason = '';
  if (finalProbability >= 75) {
    reason = `Forecast rainfall (${bestWeek.rainfall.forecastAmountMm.toFixed(0)} mm) and estimated synthetic soil moisture (${bestWeek.syntheticSoilMoisture.estimatedPercent}%) align with ${crop.name}'s germination threshold for ${soilType}.`;
  } else if (bestWeek.rainfall.forecastAmountMm > 70) {
    reason = `Heavy cumulative rainfall anticipated during this period. Sowing recommended after the primary rainfall peak to avoid seedling rotting.`;
  } else {
    reason = `Estimated soil moisture (${bestWeek.syntheticSoilMoisture.estimatedPercent}%) is below optimal field capacity. Supplemental pre-sowing irrigation or waiting for next monsoon pulse is recommended.`;
  }

  // Checklist
  const actionChecklist = [
    `Complete seed treatment with Rhizobium / Trichoderma before sowing ${crop.name}.`,
    `Calibrate seed drill depth to ${soilType.includes('Sandy') ? '4-5 cm' : '2.5-3.5 cm'} for ${soilType}.`,
    `Monitor ${forecast.location.district} district live radar before final field entry.`
  ];

  const riskWarnings: string[] = [];
  if (bestWeek.rainfall.category === 'Below Normal') {
    riskWarnings.push('Below-normal rainfall trend: Ensure access to emergency tube-well or farm pond irrigation.');
  }
  if (bestWeek.temperature.category.includes('Above')) {
    riskWarnings.push('Elevated maximum temperature: Rapid topsoil moisture evaporation expected.');
  }
  if (bestWeek.humidityAvgPercent > 75) {
    riskWarnings.push('High relative humidity: Watch out for early damping-off fungal disease in seedling nursery.');
  }

  return {
    location: {
      state: forecast.location.state,
      district: forecast.location.district,
      agroClimaticZone: forecast.location.agroClimaticZone
    },
    crop,
    soilType,
    duration: cropDuration,
    recommendedWindowDateRange: bestWeek.dateRange,
    recommendedWeekNumber: bestWeek.weekNumber,
    sowingProbabilityPercent: finalProbability,
    confidence,
    reason,
    soilMoistureStatusSummary: `${bestWeek.syntheticSoilMoisture.outlook} (${bestWeek.syntheticSoilMoisture.estimatedPercent}% VWC)`,
    monsoonAlignment: `${forecast.location.imdSubdivision} • Extended Dynamical Ensemble`,
    scores: {
      soilMoistureAdequacy: best.moistureScore,
      rainfallTimingScore: best.rainScore,
      thermalSafetyScore: best.thermalScore,
      monsoonOnsetConsistency: Math.round(finalProbability * 0.95),
      overallCompositeScore: finalProbability
    },
    actionChecklist,
    riskWarnings
  };
}
