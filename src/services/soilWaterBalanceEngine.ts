import {
  SoilHydraulicProperties,
  CropAgronomicProfile,
  IrrigationMethod,
  DailyWeatherObservation,
  DailyWaterBalanceStep,
  WaterBalanceResult,
  MultiYearRainfallRecord,
  WaterStressStatus,
} from '../types/soilModule';
import { calculateTAW, calculateRAW } from './soilProfileService';
import { getDailyCropKc, calculateWaterStressFactor, calculatePotentialETc, calculateActualETa } from './cropWaterRequirementService';

// ============================================================================
// SOIL-WATER BALANCE ENGINE (SCS-CN Runoff & Daily Root-Zone Water Budget Model)
// ============================================================================

export interface WaterBalanceInput {
  state: string;
  district: string;
  village: string;
  lat: number;
  lng: number;
  month: number;
  year: number;
  monthName: string;
  soil: SoilHydraulicProperties;
  crop: CropAgronomicProfile;
  irrigationMethod: IrrigationMethod;
  effectiveRootDepthMm?: number;
  dailyWeather: DailyWeatherObservation[];
  multiYearRecords: MultiYearRainfallRecord[];
  longTermNormalMm: number | null;
  initialSoilMoisturePercent?: number; // Optional user sensor reading (e.g., from ESP32)
  dailyIrrigationMm?: number;
}

/**
 * SCS-CN Rainfall-Runoff Model
 * Calculates daily surface runoff based on rainfall and soil hydrologic curve number.
 */
export function calculateSCSRunoff(
  rainfallMm: number,
  baseCN: number,
  antecedentMoistureFraction: number // 0 (dry) to 1 (saturated)
): { runoffMm: number; infiltratedMm: number } {
  if (rainfallMm <= 0) {
    return { runoffMm: 0, infiltratedMm: 0 };
  }

  // Adjust Curve Number (CN) based on Antecedent Moisture Condition (AMC)
  let adjustedCN = baseCN;
  if (antecedentMoistureFraction < 0.3) {
    // AMC I (Dry conditions)
    adjustedCN = (4.2 * baseCN) / (10 - 0.058 * baseCN);
  } else if (antecedentMoistureFraction > 0.75) {
    // AMC III (Wet conditions)
    adjustedCN = (23 * baseCN) / (10 + 0.13 * baseCN);
  }

  adjustedCN = Math.max(30, Math.min(98, adjustedCN));

  // Potential maximum retention S (mm)
  const S_max = (25400 / adjustedCN) - 254;
  // Initial abstraction Ia = 0.2 * S_max
  const Ia = 0.2 * S_max;

  if (rainfallMm <= Ia) {
    // All rainfall is intercepted or infiltrated
    return { runoffMm: 0, infiltratedMm: rainfallMm };
  }

  // Direct Runoff Q (mm)
  const numerator = Math.pow(rainfallMm - Ia, 2);
  const denominator = rainfallMm - Ia + S_max;
  const runoff = Math.max(0, numerator / denominator);
  const infiltrated = Math.max(0, rainfallMm - runoff);

  return {
    runoffMm: +runoff.toFixed(2),
    infiltratedMm: +infiltrated.toFixed(2),
  };
}

/**
 * Execute Full Daily Root-Zone Water Balance Simulation
 */
export function runSoilWaterBalanceSimulation(input: WaterBalanceInput): WaterBalanceResult {
  const {
    state,
    district,
    village,
    lat,
    lng,
    month,
    year,
    monthName,
    soil,
    crop,
    irrigationMethod,
    dailyWeather,
    multiYearRecords,
    longTermNormalMm,
    initialSoilMoisturePercent,
    dailyIrrigationMm = 0,
  } = input;

  const rootDepth = input.effectiveRootDepthMm || crop.defaultRootDepthMm || 600;
  const AWC = soil.availableWaterCapacity; // m3/m3
  const TAW = calculateTAW(AWC, rootDepth); // mm
  const RAW = calculateRAW(TAW, crop.depletionFraction); // mm

  // Initial Root-Zone Storage S(0)
  let currentStorage = initialSoilMoisturePercent !== undefined
    ? Math.min(TAW, (initialSoilMoisturePercent / 100) * TAW)
    : 0.45 * TAW; // Standard default assumption: 45% of AWC

  const dailySteps: DailyWaterBalanceStep[] = [];

  let cumRainfall = 0;
  let cumIrrigation = 0;
  let cumInfiltrated = 0;
  let cumRunoff = 0;
  let cumDrainage = 0;
  let cumActualETa = 0;
  let cumPotentialETc = 0;

  for (let d = 0; d < dailyWeather.length; d++) {
    const obs = dailyWeather[d];
    const dayIndex = d + 1;
    const rain = obs.rainfallMm;
    const irrigation = dailyIrrigationMm;

    // 1. Runoff & Infiltration via SCS-CN
    const antecedentFraction = currentStorage / Math.max(1, TAW);
    const { runoffMm, infiltratedMm } = calculateSCSRunoff(rain, soil.curveNumberBase, antecedentFraction);

    // 2. Add effective water entering root zone
    const waterAvailable = currentStorage + infiltratedMm + irrigation;

    // 3. Deep Drainage (water exceeding TAW drains downward)
    let drainage = 0;
    if (waterAvailable > TAW) {
      const excess = waterAvailable - TAW;
      drainage = +(excess * Math.min(1.0, soil.drainageRate * 1.5)).toFixed(2);
    }
    const storageAfterDrainage = Math.min(TAW, waterAvailable - drainage);

    // 4. Crop Evapotranspiration
    // Approximate day after sowing within month or seasonal cycle
    const das = ((month - 6 + 12) % 12) * 30 + dayIndex;
    const cropKc = getDailyCropKc(crop, das);
    const potentialETc = calculatePotentialETc(obs.et0Mm, cropKc);
    const ks = calculateWaterStressFactor(storageAfterDrainage, TAW, RAW);
    const actualETa = calculateActualETa(potentialETc, ks);

    // 5. Final Storage S(t)
    const storageEnd = +Math.max(0, Math.min(TAW, storageAfterDrainage - actualETa)).toFixed(2);
    currentStorage = storageEnd;

    // 6. Metrics & Stress Assessment
    const availPercent = +((storageEnd / Math.max(1, TAW)) * 100).toFixed(1);
    const vwc = +(soil.permanentWiltingPoint + (storageEnd / rootDepth)).toFixed(3);

    let stressStatus: WaterStressStatus = 'no_stress';
    if (storageEnd < 0.25 * RAW) {
      stressStatus = 'severe_stress';
    } else if (storageEnd < RAW) {
      stressStatus = 'moderate_stress';
    } else if (storageEnd >= 0.95 * TAW && rain > 25) {
      stressStatus = 'waterlogged';
    }

    // Accumulate
    cumRainfall += rain;
    cumIrrigation += irrigation;
    cumInfiltrated += infiltratedMm;
    cumRunoff += runoffMm;
    cumDrainage += drainage;
    cumActualETa += actualETa;
    cumPotentialETc += potentialETc;

    dailySteps.push({
      date: obs.date,
      dayIndex,
      rainfall: rain,
      irrigation,
      effectiveRainfall: infiltratedMm,
      runoff: runoffMm,
      cropKc,
      potentialETc,
      actualETa,
      deepDrainage: drainage,
      storageBeforeDrainage: +waterAvailable.toFixed(2),
      storageEnd,
      availableWaterPercent: availPercent,
      volumetricWaterContent: vwc,
      waterStressFactor: ks,
      stressStatus,
    });
  }

  // Calculate Multi-Year Summary
  const validYears = multiYearRecords.filter((r) => r.rainfallMm > 0);
  const multiYearAverage = validYears.length > 0
    ? +(validYears.reduce((sum, r) => sum + r.rainfallMm, 0) / validYears.length).toFixed(1)
    : longTermNormalMm || 100;
  
  const sortedRains = [...validYears.map((r) => r.rainfallMm)].sort((a, b) => a - b);
  const multiYearMedian = sortedRains.length > 0
    ? sortedRains[Math.floor(sortedRains.length / 2)]
    : multiYearAverage;

  // Final Overall Stress Status
  const finalAvailPercent = dailySteps.length > 0 ? dailySteps[dailySteps.length - 1].availableWaterPercent : 50;
  let overallStress: WaterStressStatus = 'no_stress';
  if (finalAvailPercent < 25) overallStress = 'severe_stress';
  else if (finalAvailPercent < 50) overallStress = 'moderate_stress';

  return {
    location: { state, district, village, lat, lng },
    analysisPeriod: {
      month,
      year,
      monthName,
      startDate: dailyWeather[0]?.date || `${year}-${String(month).padStart(2, '0')}-01`,
      endDate: dailyWeather[dailyWeather.length - 1]?.date || `${year}-${String(month).padStart(2, '0')}-30`,
    },
    soilProfile: soil,
    cropProfile: crop,
    irrigationMethod,
    effectiveRootDepthMm: rootDepth,
    AWC,
    TAW,
    RAW,
    totalRainfallMm: +cumRainfall.toFixed(1),
    totalIrrigationMm: +cumIrrigation.toFixed(1),
    totalInfiltratedMm: +cumInfiltrated.toFixed(1),
    totalRunoffLossMm: +cumRunoff.toFixed(1),
    totalDeepDrainageMm: +cumDrainage.toFixed(1),
    totalCropWaterUseMm: +cumActualETa.toFixed(1),
    totalPotentialWaterDemandMm: +cumPotentialETc.toFixed(1),
    finalRootZoneStorageMm: currentStorage,
    finalAvailableWaterPercent: finalAvailPercent,
    finalVolumetricWaterContent: +(soil.permanentWiltingPoint + (currentStorage / rootDepth)).toFixed(3),
    overallWaterStressStatus: overallStress,
    dailySteps,
    multiYearRecords,
    longTermNormalMm,
    multiYearAverageMm: multiYearAverage,
    multiYearMedianMm: multiYearMedian,
  };
}
