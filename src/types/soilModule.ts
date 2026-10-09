// ============================================================================
// AGROEYE "KNOW YOUR SOIL" MODULE - TYPES DEFINITION
// ============================================================================

export type SoilTextureType =
  | 'sandy'
  | 'loamy_sand'
  | 'sandy_loam'
  | 'loam'
  | 'silt_loam'
  | 'clay_loam'
  | 'clay'
  | 'black_cotton'
  | 'red_soil'
  | 'alluvial'
  | 'other';

export type IrrigationMethod = 'rainfed' | 'drip' | 'sprinkler' | 'flood';

export type SeasonType = 'kharif' | 'rabi' | 'zaid' | 'annual' | 'custom';

export type WaterStressStatus = 'no_stress' | 'moderate_stress' | 'severe_stress' | 'waterlogged';

export type RiskLevel = 'Low' | 'Moderate' | 'High';

export type ProvenanceType = 'official_observation' | 'official_climatology' | 'soil_map_estimate' | 'model_estimate' | 'forecast' | 'insufficient_data';

export interface SoilHydraulicProperties {
  id: SoilTextureType;
  name: string;
  nameHi: string;
  description: string;
  sandPercent: number;
  siltPercent: number;
  clayPercent: number;
  bulkDensity: number; // g/cm3
  fieldCapacity: number; // m3/m3 (volumetric)
  permanentWiltingPoint: number; // m3/m3 (volumetric)
  saturationCapacity: number; // m3/m3 (volumetric)
  availableWaterCapacity: number; // m3/m3 (AWC = FC - PWP)
  saturatedConductivity: number; // mm/hour (Ksat)
  curveNumberBase: number; // SCS-CN Base for AMC II
  drainageRate: number; // fraction/day draining when water > FC
  phRange: [number, number];
  colorHex: string;
  regionalClassification: string;
  notes: string;
}

export interface CropGrowthStage {
  stage: 'initial' | 'development' | 'mid_season' | 'late_season';
  name: string;
  nameHi: string;
  durationDays: number;
  kc: number; // Crop coefficient
  criticalMoistureSensitivity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
}

export interface CropAgronomicProfile {
  id: string;
  name: string;
  nameHi: string;
  botanicalName: string;
  category: 'Cereals' | 'Pulses' | 'Oilseeds' | 'Cash Crops' | 'Vegetables' | 'Spices';
  primarySeason: SeasonType;
  defaultDurationDays: number;
  durationRange: [number, number];
  defaultRootDepthMm: number; // mm
  rootDepthRangeMm: [number, number]; // mm
  depletionFraction: number; // FAO-56 p (0.2 - 0.8)
  totalWaterRequirementMm: [number, number]; // [min, max] mm across full season
  tempOptimalRange: [number, number]; // °C
  maturityTerminology: string; // e.g., 'Grain maturity', 'Pod maturity', 'Harvest readiness'
  maturityTerminologyHi: string;
  suitableSoilTypes: SoilTextureType[];
  growthStages: CropGrowthStage[];
  regionalSowingWindows: {
    region: string;
    startMonth: number; // 1-12
    startDay: number;
    endMonth: number;
    endDay: number;
    peakMonth: number;
    notes: string;
  }[];
}

export interface DailyWeatherObservation {
  date: string; // YYYY-MM-DD
  rainfallMm: number;
  et0Mm: number;
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  humidityAvg: number;
  isValid: boolean;
}

export interface MonthlyRainfallSummary {
  month: number;
  year: number;
  monthName: string;
  totalRainfallMm: number;
  longTermNormalMm: number | null;
  departurePercent: number | null;
  wetDaysCount: number; // Days with rain >= 2.5 mm (IMD definition)
  rainyDaysCount: number; // Days with rain > 0.1 mm
  validDaysCount: number;
  totalDaysInMonth: number;
  dataCoveragePercent: number;
  source: string;
  dailyData: DailyWeatherObservation[];
}

export interface MultiYearRainfallRecord {
  year: number;
  rainfallMm: number;
  departurePercent: number | null;
  status: 'Excess' | 'Normal' | 'Deficient' | 'Scanty' | 'No Data';
}

export interface DailyWaterBalanceStep {
  date: string;
  dayIndex: number;
  rainfall: number; // mm
  irrigation: number; // mm
  effectiveRainfall: number; // Infiltrated rainfall (P - Runoff) in mm
  runoff: number; // mm (SCS-CN model)
  cropKc: number;
  potentialETc: number; // ET0 * Kc (mm)
  actualETa: number; // Actual ET after water-stress scaling (mm)
  deepDrainage: number; // mm (gravity drainage below root zone)
  storageBeforeDrainage: number; // mm
  storageEnd: number; // S(t) in mm
  availableWaterPercent: number; // 100 * S(t) / TAW
  volumetricWaterContent: number; // m3/m3
  waterStressFactor: number; // Ks (0 - 1)
  stressStatus: WaterStressStatus;
}

export interface WaterBalanceResult {
  location: {
    state: string;
    district: string;
    village: string;
    lat: number;
    lng: number;
  };
  analysisPeriod: {
    month: number;
    year: number;
    monthName: string;
    startDate: string;
    endDate: string;
  };
  soilProfile: SoilHydraulicProperties;
  cropProfile: CropAgronomicProfile;
  irrigationMethod: IrrigationMethod;
  effectiveRootDepthMm: number;
  
  // Established Water Capacities
  AWC: number; // mm/mm (volumetric fraction)
  TAW: number; // Total Available Water = AWC * RootDepth (mm)
  RAW: number; // Readily Available Water = p * TAW (mm)
  
  // Total Monthly / Period Cumulative Metrics
  totalRainfallMm: number;
  totalIrrigationMm: number;
  totalInfiltratedMm: number;
  totalRunoffLossMm: number;
  totalDeepDrainageMm: number;
  totalCropWaterUseMm: number; // Sum of actual ETa
  totalPotentialWaterDemandMm: number; // Sum of ETc
  
  // End of Period Status
  finalRootZoneStorageMm: number; // S(end) in mm
  finalAvailableWaterPercent: number; // % of TAW
  finalVolumetricWaterContent: number; // m3/m3
  overallWaterStressStatus: WaterStressStatus;
  
  // Step-by-Step Daily Sequence
  dailySteps: DailyWaterBalanceStep[];
  
  // Multi-Year Context
  multiYearRecords: MultiYearRainfallRecord[];
  longTermNormalMm: number | null;
  multiYearAverageMm: number;
  multiYearMedianMm: number;
}

export interface SowingRecommendation {
  cropName: string;
  cropNameHi: string;
  recommendedWindowStart: string; // e.g. "15 June"
  recommendedWindowEnd: string; // e.g. "15 July"
  bestSowingMonth: string;
  bestSowingMonthHi: string;
  sowingSuitabilityScore: number; // 0 - 100
  riskLevel: RiskLevel;
  primaryRationale: string;
  primaryRationaleHi: string;
  waterAvailabilityStatus: string;
  expectedEstablishmentRainfallMm: number;
  alternativeWindow: {
    start: string;
    end: string;
    rationale: string;
  } | null;
  isRainfedViable: boolean;
  irrigationRecommendation: string;
}

export interface HarvestEstimation {
  recommendedSowingDate: string;
  estimatedMaturityDate: string;
  harvestWindowStart: string;
  harvestWindowEnd: string;
  cropDurationDays: number;
  maturityTerm: string;
  maturityTermHi: string;
  growthStageTimeline: {
    stage: string;
    stageHi: string;
    startDate: string;
    endDate: string;
    durationDays: number;
    waterDemandMm: number;
    criticality: string;
  }[];
  potentialHarvestRisks: string[];
  potentialHarvestRisksHi: string[];
}

export interface CalculationTrace {
  step: string;
  formula: string;
  inputs: Record<string, any>;
  output: string | number;
  notes: string;
}

export interface DataProvenance {
  provider: string;
  datasetName: string;
  period: string;
  spatialResolution: string;
  retrievalTimestamp: string;
  provenanceType: ProvenanceType;
  citation: string;
  limitations: string;
}
