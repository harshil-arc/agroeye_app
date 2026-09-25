'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SensorReadings, AIDetection, WeatherDayForecast, FarmNode, FarmPlot, FirebaseConfig, CameraControlState } from '@/types';
import { initialSensorReadings, mockForecast, mockHardwareNodes, mockPlots } from '@/data/mockFarmData';
import { getFirebaseInstance } from '@/lib/firebase';
import { ref, onValue, off, set } from 'firebase/database';

interface FarmDataContextType {
  sensors: SensorReadings;
  detections: AIDetection[];
  forecast: WeatherDayForecast[];
  nodes: FarmNode[];
  plots: FarmPlot[];
  isOfflineMode: boolean;
  setIsOfflineMode: (offline: boolean) => void;
  lastUpdated: string;
  firebaseConnected: boolean;
  firebaseConfig: FirebaseConfig;
  saveFirebaseConfig: (config: FirebaseConfig) => void;
  autoOpenedDetection: AIDetection | null;
  setAutoOpenedDetection: (detection: AIDetection | null) => void;
  triggerManualAlert: (customImageUrl?: string, title?: string) => void;
  markDetectionTreated: (id: string) => void;
  latestImageUrl: string;
  isStreamActive: boolean;
  setIsStreamActive: (active: boolean) => void;
  isNightVision: boolean;
  setIsNightVision: (nv: boolean) => void;
  selectedPlot: string;
  setSelectedPlot: (plot: string) => void;
  isLoadingDetections: boolean;
  refreshFirebaseData: () => Promise<void>;
  cameraControl: CameraControlState;
  setCameraMode: (mode: 'auto' | 'manual') => Promise<void>;
  updateCameraCoords: (pan: number, tilt: number, command?: CameraControlState['command']) => Promise<void>;
  sendCameraStep: (deltaPan: number, deltaTilt: number, commandName: CameraControlState['command']) => Promise<void>;
}

const DEFAULT_FIREBASE_URL = 'https://sample-629de-default-rtdb.firebaseio.com';

const initialCameraControl: CameraControlState = {
  mode: 'auto',
  pan_angle: 90,
  tilt_angle: 90,
  x_coord: 0,
  y_coord: 0,
  command: 'mode_change',
  step_size: 5,
  last_updated: new Date().toISOString(),
  timestamp: Date.now(),
  source: 'web_app',
};

const FarmDataContext = createContext<FarmDataContextType | undefined>(undefined);

// Helper to format ISO or SQL timestamps into friendly time ago string
function formatTimeAgo(dateInput: string | number | undefined): string {
  if (!dateInput) return 'Recently';
  try {
    const timestamp = typeof dateInput === 'number' ? (dateInput > 1e11 ? dateInput : dateInput * 1000) : new Date(dateInput).getTime();
    if (isNaN(timestamp)) return String(dateInput);
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 60) return 'Just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)} min ago`;
    if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hr ago`;
    return `${Math.floor(diffSec / 86400)} days ago`;
  } catch {
    return 'Recently';
  }
}

// Vapor Pressure Deficit calculation from Temp and RH
function calculateVPD(temp: number, rh: number): number {
  if (!temp || !rh) return 1.2;
  const es = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
  const ea = es * (rh / 100);
  return +(es - ea).toFixed(1);
}

// Convert Firebase raw alert object into standard AIDetection
function transformFirebaseAlert(key: string, raw: any, index: number): AIDetection {
  const isAnimal = !!raw.animal_name || !!raw.species_breakdown;
  const name = raw.disease_name || raw.animal_name || 'Detected Anomaly';
  const rawConf = typeof raw.confidence === 'number' ? raw.confidence : parseFloat(raw.confidence) || 0.85;
  const confidence = rawConf <= 1 ? +(rawConf * 100).toFixed(1) : +rawConf.toFixed(1);
  let photoUrl = raw.photo_url || raw.imageUrl || raw.image_url || 'https://iili.io/nuiqbzg.jpg';
  if (photoUrl.includes('nAc')) {
    photoUrl = 'https://iili.io/nuiqbzg.jpg';
  }
  const timeRaw = raw.timestamp || raw.datetime || new Date().toISOString();

  let category: AIDetection['category'] = 'disease';
  let categoryLabel = 'Disease';
  if (isAnimal) {
    category = 'pest';
    categoryLabel = 'Animal / Pest';
  } else if (name.toLowerCase().includes('water') || name.toLowerCase().includes('wilt') || name.toLowerCase().includes('moisture')) {
    category = 'water_stress';
    categoryLabel = 'Water Stress';
  } else if (name.toLowerCase().includes('weed')) {
    category = 'weed';
    categoryLabel = 'Weed';
  } else if (name.toLowerCase().includes('nutrient') || name.toLowerCase().includes('deficiency')) {
    category = 'nutrient';
    categoryLabel = 'Nutrient Deficit';
  }

  let severity: AIDetection['severity'] = 'Medium';
  if (raw.severity) {
    const s = String(raw.severity).toLowerCase();
    if (s.includes('critical') || s.includes('high') || raw.threat_level?.includes('HIGH')) {
      severity = 'Critical';
    } else if (s.includes('low') || s.includes('early')) {
      severity = 'Low';
    } else {
      severity = 'High';
    }
  } else if (confidence > 90) {
    severity = 'High';
  }

  const shortCode = `#UD-${key.substring(1, 5).toUpperCase()}`;

  return {
    id: key,
    code: shortCode,
    title: `${name} Detected`,
    category,
    categoryLabel,
    severity,
    confidence,
    plot: 'my Farm • Dabok (Rice)',
    location: `Canopy Camera Node • Sector ${index % 3 + 1}`,
    crop: 'Rice / Foliar Canopy',
    imageUrl: photoUrl,
    timestamp: typeof timeRaw === 'number' ? new Date(timeRaw > 1e11 ? timeRaw : timeRaw * 1000).toISOString() : String(timeRaw),
    timeAgo: formatTimeAgo(timeRaw),
    pathogen: raw.model_name ? `Model: ${raw.model_name}` : undefined,
    affectedArea: raw.affected_area || (severity === 'Critical' ? '25% Canopy' : '8% Canopy'),
    description: raw.description || `${name} identified via edge neural vision with ${confidence}% confidence. Real-time inference ingested directly from Firebase.`,
    recommendation: raw.organic_remedy
      ? `Organic: ${raw.organic_remedy}${raw.chemical_remedy ? ` | Chemical: ${raw.chemical_remedy}` : ''}`
      : raw.chemical_remedy
      ? `Chemical remedy: ${raw.chemical_remedy}`
      : isAnimal
      ? 'Non-threat animal present. Keep observation active.'
      : 'Targeted biological or copper-based foliar application recommended within 24 hours.',
    treatmentProtocol: {
      action: raw.organic_remedy || 'Targeted Foliar Spray Protocol',
      dosage: raw.chemical_remedy || '2.0g / Litre of Water (Mancozeb or Copper Hydroxide)',
      waterVolume: '150 Litres / Acre via Knapsack / Drone Sprayer',
      window: 'Morning 06:30 - 09:00 AM (Low Wind)',
      quarantine: 'Inspect adjacent crop furrows within 24 hours.',
    },
    sensorContext: {
      temperature: '32.8°C',
      humidity: '37.5% RH',
      leafWetness: '3.2 hrs',
      soilMoisture: '79%',
    },
    boundingBox: {
      top: '25%',
      left: '20%',
      width: '55%',
      height: '50%',
      label: `${name} ${confidence}%`,
    },
    isTreated: false,
  };
}

export function FarmDataProvider({ children }: { children: React.ReactNode }) {
  const [sensors, setSensors] = useState<SensorReadings>(initialSensorReadings);
  const [detections, setDetections] = useState<AIDetection[]>([]);
  const [forecast] = useState<WeatherDayForecast[]>(mockForecast);
  const [nodes, setNodes] = useState<FarmNode[]>(mockHardwareNodes);
  const [plots, setPlots] = useState<FarmPlot[]>(mockPlots);
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Live ESP32 Sync');
  const [firebaseConnected, setFirebaseConnected] = useState<boolean>(true);
  const [autoOpenedDetection, setAutoOpenedDetection] = useState<AIDetection | null>(null);
  const [latestImageUrl, setLatestImageUrl] = useState<string>('https://iili.io/nuiqbzg.jpg');
  const [isStreamActive, setIsStreamActive] = useState<boolean>(true);
  const [isNightVision, setIsNightVision] = useState<boolean>(false);
  const [selectedPlot, setSelectedPlot] = useState<string>('All');
  const [isLoadingDetections, setIsLoadingDetections] = useState<boolean>(true);
  const [cameraControl, setCameraControl] = useState<CameraControlState>(initialCameraControl);
  const previousLatestKeyRef = useRef<string>('');

  const [firebaseConfig, setFirebaseConfig] = useState<FirebaseConfig>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agroeye_firebase_config');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(e);
        }
      }
    }
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
      databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || DEFAULT_FIREBASE_URL,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'sample-629de',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '',
    };
  });

  const saveFirebaseConfig = (config: FirebaseConfig) => {
    setFirebaseConfig(config);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroeye_firebase_config', JSON.stringify(config));
    }
  };

  // Helper to send camera control state to Firebase Realtime Database
  const sendCameraControlToFirebase = useCallback(async (newState: CameraControlState) => {
    const dbUrl = (firebaseConfig.databaseURL || DEFAULT_FIREBASE_URL).replace(/\/$/, '');
    
    // 1. Direct REST PUT to Firebase
    try {
      fetch(`${dbUrl}/camera_control.json`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newState),
      }).catch((e) => console.warn('Camera control REST send error:', e));
    } catch (err) {
      console.warn('Camera control send error:', err);
    }

    // 2. Also try Firebase SDK if initialized
    const { db } = getFirebaseInstance(firebaseConfig);
    if (db) {
      try {
        set(ref(db, 'camera_control'), newState).catch(() => {});
      } catch {
        // Ignored, REST will have succeeded
      }
    }
  }, [firebaseConfig]);

  // Public method to switch between Auto & Manual modes
  const setCameraMode = useCallback(async (mode: 'auto' | 'manual') => {
    const updatedState: CameraControlState = {
      ...cameraControl,
      mode,
      command: 'mode_change',
      last_updated: new Date().toISOString(),
      timestamp: Date.now(),
    };
    setCameraControl(updatedState);
    await sendCameraControlToFirebase(updatedState);
  }, [cameraControl, sendCameraControlToFirebase]);

  // Public method to set specific Pan & Tilt angles/coordinates
  const updateCameraCoords = useCallback(async (pan: number, tilt: number, command?: CameraControlState['command']) => {
    const clampedPan = Math.max(0, Math.min(180, Math.round(pan)));
    const clampedTilt = Math.max(0, Math.min(180, Math.round(tilt)));
    const x = clampedPan - 90; // -90 to +90
    const y = clampedTilt - 90; // -90 to +90

    const updatedState: CameraControlState = {
      ...cameraControl,
      mode: 'manual', // Any coordinate change implies manual control
      pan_angle: clampedPan,
      tilt_angle: clampedTilt,
      x_coord: x,
      y_coord: y,
      command: command || 'set_coords',
      last_updated: new Date().toISOString(),
      timestamp: Date.now(),
    };
    setCameraControl(updatedState);
    await sendCameraControlToFirebase(updatedState);
  }, [cameraControl, sendCameraControlToFirebase]);

  // Public method to increment/decrement Pan or Tilt by step (for joystick / D-pad)
  const sendCameraStep = useCallback(async (deltaPan: number, deltaTilt: number, commandName: CameraControlState['command']) => {
    const newPan = Math.max(0, Math.min(180, cameraControl.pan_angle + deltaPan));
    const newTilt = Math.max(0, Math.min(180, cameraControl.tilt_angle + deltaTilt));
    const x = newPan - 90;
    const y = newTilt - 90;

    const updatedState: CameraControlState = {
      ...cameraControl,
      mode: 'manual',
      pan_angle: newPan,
      tilt_angle: newTilt,
      x_coord: x,
      y_coord: y,
      command: commandName,
      last_updated: new Date().toISOString(),
      timestamp: Date.now(),
    };
    setCameraControl(updatedState);
    await sendCameraControlToFirebase(updatedState);
  }, [cameraControl, sendCameraControlToFirebase]);

  // Direct REST fetcher that reads all real data directly from Firebase
  const refreshFirebaseData = useCallback(async () => {
    const dbUrl = (firebaseConfig.databaseURL || DEFAULT_FIREBASE_URL).replace(/\/$/, '');
    try {
      setIsLoadingDetections(true);
      const res = await fetch(`${dbUrl}/.json`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data) return;

      setFirebaseConnected(true);

      // 1. Process real disease_alerts from Firebase
      if (data.disease_alerts && typeof data.disease_alerts === 'object') {
        const entries = Object.entries(data.disease_alerts);
        const parsedList: AIDetection[] = entries
          .map(([key, raw]: [string, any], index) => transformFirebaseAlert(key, raw, index))
          .reverse();

        setDetections(parsedList);

        if (parsedList.length > 0) {
          const newest = parsedList[0];
          setLatestImageUrl(newest.imageUrl);

          if (previousLatestKeyRef.current && previousLatestKeyRef.current !== newest.id) {
            setAutoOpenedDetection(newest);
          }
          previousLatestKeyRef.current = newest.id;
        }
      }

      // 2. Process real sensor_readings from Firebase
      if (data.sensor_readings && typeof data.sensor_readings === 'object') {
        const sensorEntries: any[] = Object.values(data.sensor_readings);
        if (sensorEntries.length > 0) {
          const latestReading = sensorEntries[sensorEntries.length - 1];

          const validTemps = sensorEntries
            .map((r: any) => typeof r.temperature === 'number' ? r.temperature : parseFloat(r.temperature))
            .filter((t: number) => !isNaN(t) && t > 0 && t < 70);

          const tempMin = validTemps.length > 0 ? +Math.min(...validTemps).toFixed(1) : 21.0;
          const tempMax = validTemps.length > 0 ? +Math.max(...validTemps).toFixed(1) : 34.0;

          const temp = latestReading.temperature ?? 32.8;
          const moist = latestReading.soil_moisture ?? latestReading.soilMoisture ?? 79;
          const humid = latestReading.humidity ?? 37.5;
          const rawMq = latestReading.mq135_raw ?? 330;
          const voltMq = latestReading.mq135_voltage ?? 1.61;
          const soilRaw = latestReading.soil_raw ?? 449;
          const vpdVal = calculateVPD(temp, humid);

          const aqiEst = Math.round(Math.min(300, Math.max(15, (rawMq / 1024) * 120)));

          setSensors({
            temperature: +temp.toFixed(1),
            tempMin,
            tempMax,
            tempStatus: temp > 35 ? 'High' : temp < 18 ? 'Low' : 'Normal',
            soilMoisture: Math.round(moist),
            soilRaw,
            soilMoistureStatus: moist >= 60 && moist <= 85 ? 'Normal' : moist > 85 ? 'High' : 'Low',
            humidity: +humid.toFixed(1),
            vpd: vpdVal,
            humidityStatus: humid < 35 ? 'Dry' : humid > 70 ? 'Humid' : 'Good',
            airQualityAqi: aqiEst,
            mq135Raw: rawMq,
            mq135Voltage: voltMq,
            pm25: Math.round(aqiEst * 0.35),
            airQualityStatus: aqiEst > 100 ? 'Moderate' : 'Good',
            source: latestReading.source || 'esp32_serial',
            datetime: latestReading.datetime || 'Live',
            solarRadiation: 780,
            uvIndex: 7,
            windSpeed: 14,
            windDirection: 'WNW',
            barometricPressure: 1012,
            et0: 4.2,
            timestamp: latestReading.datetime || latestReading.timestamp || new Date().toISOString(),
          });

          setLastUpdated(`ESP32 Live • ${latestReading.datetime ? latestReading.datetime.split(' ')[1] || 'Just now' : 'Just now'}`);
        }
      }

      // 3. Process fields from Firebase
      if (data.fields && typeof data.fields === 'object') {
        const fieldList: FarmPlot[] = Object.entries(data.fields).map(([k, f]: [string, any]) => ({
          id: f.id || k,
          name: `${f.name || 'my Farm'} • ${f.location ? f.location.toUpperCase() : 'DABOK'}`,
          crop: f.crop || 'Rice',
          variety: 'Active Crop Season',
          area: `${f.area || '2'} Acres`,
          sowingDate: f.createdAt ? new Date(f.createdAt).toLocaleDateString() : '09 Sep 2026',
          healthScore: 92,
          stage: 'Foliar Growth',
          soilType: 'Loamy Alluvial (pH 7.0)',
          status: 'Healthy',
        }));
        if (fieldList.length > 0) {
          setPlots(fieldList);
        }
      }

      // 4. Process camera_control if present
      if (data.camera_control && typeof data.camera_control === 'object') {
        setCameraControl((prev) => ({
          ...prev,
          ...data.camera_control,
        }));
      }
    } catch (err) {
      console.warn('Direct Firebase REST sync warning:', err);
    } finally {
      setIsLoadingDetections(false);
    }
  }, [firebaseConfig.databaseURL]);

  // Initial fetch and auto-polling every 6 seconds for live telemetry
  useEffect(() => {
    refreshFirebaseData();
    const interval = setInterval(refreshFirebaseData, 6000);
    return () => clearInterval(interval);
  }, [refreshFirebaseData]);

  // Real-time Firebase Database WebSocket listener
  useEffect(() => {
    const { db, isConfigured } = getFirebaseInstance(firebaseConfig);

    if (!isConfigured || isOfflineMode || !db) {
      return;
    }

    try {
      const alertsRef = ref(db, 'disease_alerts');
      const sensorRef = ref(db, 'sensor_readings');
      const liveStatusRef = ref(db, 'live_status');
      const cameraControlRef = ref(db, 'camera_control');

      const unsubAlerts = onValue(alertsRef, (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          const entries = Object.entries(data);
          const parsedList: AIDetection[] = entries
            .map(([key, raw]: [string, any], index) => transformFirebaseAlert(key, raw, index))
            .reverse();

          setDetections(parsedList);

          if (parsedList.length > 0) {
            const newest = parsedList[0];
            setLatestImageUrl(newest.imageUrl);

            if (previousLatestKeyRef.current && previousLatestKeyRef.current !== newest.id) {
              setAutoOpenedDetection(newest);
            }
            previousLatestKeyRef.current = newest.id;
          }
        }
      });

      const unsubSensors = onValue(sensorRef, (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          const sensorEntries: any[] = Object.values(data);
          if (sensorEntries.length > 0) {
            const latestReading = sensorEntries[sensorEntries.length - 1];
            const temp = latestReading.temperature ?? 32.8;
            const moist = latestReading.soil_moisture ?? 79;
            const humid = latestReading.humidity ?? 37.5;
            const rawMq = latestReading.mq135_raw ?? 330;
            const aqiEst = Math.round(Math.min(300, Math.max(15, (rawMq / 1024) * 120)));

            setSensors((prev) => ({
              ...prev,
              temperature: +temp.toFixed(1),
              soilMoisture: Math.round(moist),
              soilRaw: latestReading.soil_raw,
              humidity: +humid.toFixed(1),
              vpd: calculateVPD(temp, humid),
              mq135Raw: rawMq,
              mq135Voltage: latestReading.mq135_voltage,
              airQualityAqi: aqiEst,
              pm25: Math.round(aqiEst * 0.35),
              source: latestReading.source || 'esp32_serial',
              datetime: latestReading.datetime,
              timestamp: latestReading.datetime || new Date().toISOString(),
            }));

            setLastUpdated(`ESP32 Live • ${latestReading.datetime ? latestReading.datetime.split(' ')[1] || 'Just now' : 'Just now'}`);
          }
        }
      });

      const unsubLive = onValue(liveStatusRef, (snapshot) => {
        const data = snapshot.val();
        if (data && data.latest_photo_url) {
          setLatestImageUrl(data.latest_photo_url);
        }
      });

      const unsubCamera = onValue(cameraControlRef, (snapshot) => {
        const data = snapshot.val();
        if (data && typeof data === 'object') {
          setCameraControl((prev) => ({
            ...prev,
            ...data,
          }));
        }
      });

      return () => {
        off(alertsRef);
        off(sensorRef);
        off(liveStatusRef);
        off(cameraControlRef);
      };
    } catch (err) {
      console.warn('RTDB listener attachment error:', err);
    }
  }, [firebaseConfig, isOfflineMode]);

  const triggerManualAlert = useCallback((customImageUrl?: string, title?: string) => {
    const newId = `-P2Manual_${Date.now()}`;
    const img = customImageUrl || latestImageUrl || 'https://iili.io/nuiqbzg.jpg';
    
    const newDetection: AIDetection = {
      id: newId,
      code: `#UD-${Math.floor(1000 + Math.random() * 9000)}`,
      title: title || 'New Leaf Mold Anomaly Detected',
      category: 'disease',
      categoryLabel: 'Live Vision Ingest',
      severity: 'High',
      confidence: 94.8,
      plot: 'my Farm • Dabok (Rice)',
      location: 'Live Camera Capture • Row 12',
      crop: 'Rice / Foliar Canopy',
      imageUrl: img,
      timestamp: new Date().toISOString(),
      timeAgo: 'Just now',
      pathogen: 'Passalora fulva (Leaf Mold)',
      affectedArea: '10% Canopy Area',
      description: 'Incoming live field inspection capture from iilo gateway. Edge neural model completed instant classification.',
      recommendation: 'Organic: Neem oil 2% or copper hydroxide spray | Chemical: Chlorothalonil 75% WP (2g/L).',
      treatmentProtocol: {
        action: 'Immediate Field Verification & Spot Treatment',
        dosage: 'Copper Oxychloride 50% WP (2.5g / Litre)',
        waterVolume: '150 Litres / Acre',
        window: 'Morning 06:30 - 08:30 AM',
        quarantine: 'Reduce sprinkler irrigation in plot for 48 hours.',
      },
      sensorContext: {
        temperature: `${sensors.temperature}°C`,
        humidity: `${sensors.humidity}% RH`,
        leafWetness: '3.8 hrs',
        soilMoisture: `${sensors.soilMoisture}%`,
      },
      boundingBox: {
        top: '25%',
        left: '20%',
        width: '55%',
        height: '45%',
        label: 'Leaf Mold 94.8%',
      },
      isTreated: false,
    };

    setLatestImageUrl(img);
    setDetections((prev) => [newDetection, ...prev]);
    setAutoOpenedDetection(newDetection);
  }, [sensors, latestImageUrl]);

  const markDetectionTreated = (id: string) => {
    setDetections((prev) =>
      prev.map((d) => (d.id === id ? { ...d, isTreated: true } : d))
    );
  };

  return (
    <FarmDataContext.Provider
      value={{
        sensors,
        detections,
        forecast,
        nodes,
        plots,
        isOfflineMode,
        setIsOfflineMode,
        lastUpdated,
        firebaseConnected,
        firebaseConfig,
        saveFirebaseConfig,
        autoOpenedDetection,
        setAutoOpenedDetection,
        triggerManualAlert,
        markDetectionTreated,
        latestImageUrl,
        isStreamActive,
        setIsStreamActive,
        isNightVision,
        setIsNightVision,
        selectedPlot,
        setSelectedPlot,
        isLoadingDetections,
        refreshFirebaseData,
        cameraControl,
        setCameraMode,
        updateCameraCoords,
        sendCameraStep,
      }}
    >
      {children}
    </FarmDataContext.Provider>
  );
}

export function useFarmData() {
  const context = useContext(FarmDataContext);
  if (!context) {
    throw new Error('useFarmData must be used within a FarmDataProvider');
  }
  return context;
}
