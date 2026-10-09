export type Language = 'en' | 'hi';

export type ENSOPhase = 'El Niño' | 'La Niña' | 'Neutral';
export type IODPhase = 'Positive' | 'Negative' | 'Neutral';
export type MJOPhase = 'Active Bay of Bengal' | 'Suppressed' | 'Neutral';
export type SnowCover = 'Below Normal' | 'Normal' | 'Above Normal';

export interface MonsoonYearRecord {
  year: number;
  keralaOnsetDate: string; // e.g. "1970-05-26"
  formattedDate: string;   // e.g. "26 May"
  dayOfYear: number;       // e.g. 146
  normalDate: string;      // "01 June"
  deviationDays: number;   // -6 (6 days early), +8 (8 days late), 0 (normal)
  category: 'Early' | 'Normal' | 'Delayed';
  ensoPhase: ENSOPhase;
  iodPhase: IODPhase;
  rainfallPercentOfLPA: number; // e.g. 106%
  totalRainfallMm: number;      // e.g. 920 mm
  monsoonWithdrawalDate: string; // e.g. "15 Oct"
  seasonDurationDays: number;
  notableFeatures: string;
  notableFeaturesHi: string;
}

export interface StateRegionData {
  id: string;
  name: string;
  nameHi: string;
  region: 'South' | 'West' | 'Central' | 'North' | 'East' | 'NorthEast';
  normalOnsetDate: string;
  normalDayOfYear: number;
  avgHistoricOnset: string;
  earliestRecorded: { year: number; date: string };
  latestRecorded: { year: number; date: string };
  coordinates: [number, number]; // [lat, lng]
  isochroneDate: string; // e.g. "10 June"
  kharifCrops: string[];
  kharifCropsHi: string[];
  sowingWindow: string;
  sowingWindowHi: string;
  contingencyAdviceEarly: string;
  contingencyAdviceEarlyHi: string;
  contingencyAdviceDelayed: string;
  contingencyAdviceDelayedHi: string;
  contingencyAdviceNormal: string;
  contingencyAdviceNormalHi: string;
  recentRecords: {
    year: number;
    date: string;
    deviation: number;
  }[];
}

export interface PredictionParameters {
  targetYear: number;
  ensoForecast: ENSOPhase;
  iodForecast: IODPhase;
  mjoStatus: MJOPhase;
  seaSurfaceTempAnomaly: number; // °C (-1.5 to +2.0)
  eurasianSnowCover: SnowCover;
  customConfidence: number; // 70 to 95%
}

export interface ImpactFactor {
  name: string;
  nameHi: string;
  impact: string;
  impactHi: string;
  direction: 'early' | 'delay' | 'neutral';
  weight: number;
}

export interface PredictionResult {
  targetYear: number;
  estimatedDate: string;       // e.g. "30 May"
  estimatedDayOfYear: number;
  confidenceIntervalMin: string; // e.g. "26 May"
  confidenceIntervalMax: string; // e.g. "04 June"
  deviationFromNormal: number;   // e.g. -2 days
  earlinessProbability: number;  // e.g. 58%
  normalProbability: number;     // e.g. 32%
  delayProbability: number;      // e.g. 10%
  estimatedRainfallLPA: number;  // e.g. 104%
  primaryFactors: ImpactFactor[];
  riskAssessment: string;
  riskAssessmentHi: string;
  recommendedSowingPrepDate: string;
  recommendedSowingPrepDateHi: string;
  analogYears: number[];
}

export interface FarmLocation {
  id: string;
  name: string;
  stateId: string;
  lat: number;
  lng: number;
  crop?: string;
  areaAcres?: number;
}

export interface CityMonsoonData {
  id: string;
  name: string;
  nameHi: string;
  stateId: string;
  stateName: string;
  stateNameHi: string;
  lat: number;
  lng: number;
  normalOnsetDate: string;
  normalDayOfYear: number;
  earliestRecorded: { year: number; date: string };
  latestRecorded: { year: number; date: string };
  primaryCrops: string[];
  primaryCropsHi: string[];
  sowingWindow: string;
  sowingWindowHi: string;
  agroZone: string;
}

export interface CityOnsetEstimation {
  city: CityMonsoonData;
  estimatedDate: string;
  estimatedDayOfYear: number;
  deviationDays: number;
  confidenceMin: string;
  confidenceMax: string;
  status: 'Early' | 'Normal' | 'Delayed';
  sowingPrepRecommendation: string;
  sowingPrepRecommendationHi: string;
}

