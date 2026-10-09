export type Language = 'en' | 'hi';

export interface FarmLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  crop?: string;
  areaAcres?: number;
  soilType?: string;
  isDemo?: boolean;
}

export interface CurrentWeather {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  weatherCondition: string;
  weatherIcon: string;
  surfacePressure: number;
  windSpeed: number;
  windDirection: string;
  windGusts: number;
  soilTemperature: number;
  soilMoisture: number;
  soilMoisturePercent: number;
  uvIndex: number;
  et0: number; // reference evapotranspiration mm/day
  vpd: number; // vapor pressure deficit kPa
  cloudCover: number;
  visibilityKm: number;
  timestamp: string;
}

export interface HourlyForecastItem {
  time: string;
  hourLabel: string;
  temperature: number;
  humidity: number;
  precipitationProbability: number;
  precipitation: number;
  windSpeed: number;
  uvIndex: number;
  condition: string;
  icon: string;
}

export type SprayCondition = 'Optimal Window' | 'Caution' | 'Do Not Spray';

export interface DailyForecastItem {
  day: string;
  date: string;
  condition: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  rainChance: number;
  rainSum: number;
  windGustMax: number;
  uvMax: number;
  sprayCondition: SprayCondition;
}

export interface ThreatScores {
  floodRisk: number;
  droughtRisk: number;
  stormRisk: number;
  diseaseRisk: number;
  heatRisk: number;
}

export type AlertSeverity = 'Critical' | 'High' | 'Medium' | 'Low';

export interface CalamityRiskRow {
  event: string;
  eventKey: string;
  emoji: string;
  risk: AlertSeverity;
  riskPercent: number;
  expected: string;
  details: string;
  precaution: string;
}

export interface DisasterAlert {
  id: string;
  type: 'rain_flood' | 'fungal_spore' | 'storm_wind' | 'drought' | 'heatwave';
  title: string;
  severity: AlertSeverity;
  probability: number;
  onset: string;
  metricLabel: string;
  description: string;
  impactRisk: string;
  precautions: string[];
}

export interface SpatialHazard {
  id: string;
  type: string;
  title: string;
  icon: string;
  emoji: string;
  severity: AlertSeverity;
  lat: number;
  lng: number;
  distanceKm: number;
  direction: string;
  metric: string;
  onset: string;
  description: string;
  precaution: string;
}

export interface HistoryDay {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  tempAvg: number;
  rainSum: number;
  humidityAvg: number;
  windMax: number;
  et0: number;
  condition: string;
  icon: string;
}

export interface SoilProfile {
  soilType: string;
  soilTypeHi: string;
  texture: string;
  textureHi: string;
  colorHex: string;
  badgeBg: string;
  badgeText: string;
  ph: string;
  phValue: number;
  phCategory: 'Acidic' | 'Neutral' | 'Alkaline';
  drainage: string;
  drainageHi: string;
  waterRetention: string;
  waterRetentionHi: string;
  organicMatter: string;
  organicMatterHi: string;
  fertilityStatus: string;
  fertilityStatusHi: string;
  suitableCrops: string[];
  suitableCropsHi: string[];
  managementTip: string;
  managementTipHi: string;
  clayPercent?: number;
  sandPercent?: number;
  siltPercent?: number;
}

export interface WeatherData {
  locationName: string;
  latitude: number;
  longitude: number;
  elevation: number;
  current: CurrentWeather;
  threatScores: ThreatScores;
  calamityRiskTable: CalamityRiskRow[];
  disasterAlerts: DisasterAlert[];
  hourlyForecast: HourlyForecastItem[];
  forecast: DailyForecastItem[];
  spatialHazards: SpatialHazard[];
  history: HistoryDay[];
  soilProfile: SoilProfile;
}
