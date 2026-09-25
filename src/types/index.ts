export interface SensorReadings {
  soilMoisture: number; // percentage (e.g. 79%)
  soilRaw?: number; // raw ADC e.g. 449
  soilMoistureStatus: 'Optimal' | 'Low' | 'High' | 'Normal';
  temperature: number; // celsius (e.g. 32.8°C)
  tempMin: number;
  tempMax: number;
  tempStatus: 'Normal' | 'High' | 'Low';
  humidity: number; // percentage (e.g. 37.5%)
  vpd: number; // vapor pressure deficit kPa (e.g. 3.1)
  humidityStatus: 'Good' | 'Dry' | 'Humid';
  airQualityAqi: number; // AQI
  mq135Raw?: number; // e.g. 330
  mq135Voltage?: number; // e.g. 1.61V
  pm25: number; // µg/m³
  airQualityStatus: 'Good' | 'Moderate' | 'Poor';
  source?: string; // e.g. "esp32_serial"
  datetime?: string; // e.g. "2026-09-10 14:32:57"
  solarRadiation?: number; // W/m²
  uvIndex?: number;
  windSpeed?: number; // km/h
  windDirection?: string;
  barometricPressure?: number; // hPa
  et0?: number; // mm/day
  timestamp: string;
}

export interface CameraControlState {
  mode: 'auto' | 'manual';
  pan_angle: number; // 0 to 180 degrees (center: 90)
  tilt_angle: number; // 0 to 180 degrees (center: 90)
  x_coord: number; // -90 to +90
  y_coord: number; // -45 to +45
  command?: 'pan_left' | 'pan_right' | 'tilt_up' | 'tilt_down' | 'center' | 'mode_change' | 'set_coords';
  step_size?: number;
  last_updated?: string;
  timestamp: number;
  source?: string;
}

export interface AIDetection {
  id: string;
  code: string; // e.g. "#UD-9402"
  title: string;
  category: 'disease' | 'pest' | 'water_stress' | 'weed' | 'nutrient';
  categoryLabel: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  confidence: number; // 0-100%
  plot: string;
  location: string;
  crop: string;
  imageUrl: string;
  timestamp: string;
  timeAgo: string;
  pathogen?: string;
  affectedArea?: string;
  description: string;
  recommendation: string;
  treatmentProtocol?: {
    action: string;
    dosage: string;
    waterVolume: string;
    window: string;
    quarantine: string;
  };
  sensorContext?: {
    temperature: string;
    humidity: string;
    leafWetness: string;
    soilMoisture: string;
  };
  boundingBox?: {
    top: string;
    left: string;
    width: string;
    height: string;
    label: string;
  };
  isTreated?: boolean;
}

export interface WeatherDayForecast {
  day: string;
  date: string;
  condition: string;
  icon: string;
  tempMax: number;
  tempMin: number;
  rainChance: number;
  sprayCondition: 'Optimal Window' | 'Caution' | 'Do Not Spray';
}

export interface FarmNode {
  id: string;
  name: string;
  type: string;
  status: 'Online' | 'Offline' | 'Standby';
  battery: number;
  signal: string;
  lastSync: string;
  location: string;
  ipAddress?: string;
}

export interface FarmPlot {
  id: string;
  name: string;
  crop: string;
  variety: string;
  area: string;
  sowingDate: string;
  healthScore: number;
  stage: string;
  soilType: string;
  status: 'Healthy' | 'Attention' | 'Critical';
}

export interface FirebaseConfig {
  apiKey?: string;
  authDomain?: string;
  databaseURL?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}
