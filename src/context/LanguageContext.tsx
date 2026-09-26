'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'hi';

interface Translations {
  [key: string]: {
    en: string;
    hi: string;
  };
}

export const translations: Translations = {
  // Navigation & General
  home: { en: 'Home', hi: 'होम' },
  live: { en: 'Live Stream', hi: 'लाइव कैमरा' },
  weather: { en: 'Weather & Hazards', hi: 'मौसम और आपदा' },
  detections: { en: 'AI Detections', hi: 'रोग/कीट पहचान' },
  profile: { en: 'Farm Profile', hi: 'प्रोफ़ाइल' },
  markFarm: { en: 'Mark Your Farm', hi: 'अपना खेत चुनें' },
  farmSaved: { en: 'Farm Saved', hi: 'खेत सहेजा गया' },
  lastSynced: { en: 'Last Synced', hi: 'अंतिम अपडेट' },
  liveStream: { en: 'Live ESP32 Sync', hi: 'लाइव सेंसर डेटा' },
  staleData: { en: 'Stale Telemetry (>15m)', hi: 'पुराना डेटा (>15 मि)' },
  
  // Sensor Telemetry
  temperature: { en: 'Temperature', hi: 'तापमान' },
  soilMoisture: { en: 'Soil Moisture', hi: 'मिट्टी की नमी' },
  humidity: { en: 'Air Humidity', hi: 'हवा की आर्द्रता' },
  airQuality: { en: 'Air Quality (MQ-135)', hi: 'वायु गुणवत्ता' },
  solarRadiation: { en: 'Solar Radiation', hi: 'सौर विकिरण' },
  windVelocity: { en: 'Wind Velocity', hi: 'हवा की गति' },
  atmPressure: { en: 'Atm Pressure', hi: 'वायुमंडलीय दबाव' },
  evapoLoss: { en: 'ET₀ Evapo-Loss', hi: 'वाष्पोत्सर्जन' },
  
  // Irrigation Advisory
  irrigateNow: { en: '💧 IRRIGATE NOW', hi: '💧 अभी सिंचाई करें' },
  holdIrrigation: { en: '⏳ HOLD IRRIGATION', hi: '⏳ सिंचाई रोकें' },
  optimalMoisture: { en: '✅ SOIL MOISTURE OPTIMAL', hi: '✅ मिट्टी की नमी उत्तम' },
  
  // Hazards & Early Warning
  calamities: { en: 'Natural Calamities', hi: 'प्राकृतिक आपदाएं' },
  heavyRain: { en: 'Heavy Rainfall', hi: 'भारी बारिश' },
  floodRisk: { en: 'Flash Flood Risk', hi: 'बाढ़ का खतरा' },
  extremeHeat: { en: 'Extreme Heatwave', hi: 'अत्यधिक गर्मी/लू' },
  stormSquall: { en: 'Squall Winds & Storm', hi: 'आंधी और तेज हवा' },
  droughtDeficit: { en: 'Drought Deficit', hi: 'सूखे का खतरा' },
  fungalSpores: { en: 'Foliar Spores & Blight', hi: 'पत्ती फफूंद/झुलसा' },
  
  // Actions & States
  operatorLogin: { en: 'Operator Login', hi: 'ऑपरेटर लॉगिन' },
  logout: { en: 'Sign Out', hi: 'लॉगआउट' },
  authenticated: { en: 'Authorized', hi: 'प्रमाणित' },
  unauthenticated: { en: 'Guest Mode', hi: 'गेस्ट मोड' },
  cameraOffline: { en: 'Camera Standby / Offline', hi: 'कैमरा स्टैंडबाय' },
  retryConnection: { en: 'Retry Connection', hi: 'पुनः प्रयास करें' },
  optimalWindow: { en: 'Optimal Window', hi: 'छिड़काव का सही समय' },
  doNotSpray: { en: 'Do Not Spray', hi: 'छिड़काव न करें' },
  caution: { en: 'Caution', hi: 'सावधानी' },
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('agroeye_lang') as Language;
      if (saved === 'en' || saved === 'hi') {
        setLangState(saved);
      }
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroeye_lang', newLang);
    }
  };

  const t = (key: string): string => {
    if (translations[key] && translations[key][lang]) {
      return translations[key][lang];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
