'use client';

import React, { useState, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
  Sprout,
  MapPin,
  Calendar,
  Layers,
  Droplets,
  ArrowLeft,
  Globe,
  Loader2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  CheckCircle2,
  Info,
  Sliders,
} from 'lucide-react';
import {
  SoilTextureType,
  IrrigationMethod,
  WaterBalanceResult,
  SowingRecommendation,
  HarvestEstimation,
  CalculationTrace,
  DataProvenance,
} from '@/types/soilModule';
import {
  SOIL_PROFILES_DATABASE,
  estimateRegionalSoil,
} from '@/services/soilProfileService';
import { CROPS_DATABASE, getCropProfileById } from '@/services/cropCalendarService';
import {
  fetchHistoricalMonthlyRainfall,
  fetchMultiYearRainfall,
} from '@/services/rainfallDataService';
import {
  getDistrictDetails,
  getDistrictsForState,
  DISTRICT_DATABASE,
} from '@/services/districtLocationService';
import { runSoilWaterBalanceSimulation } from '@/services/soilWaterBalanceEngine';
import { evaluateBestSowingWindow } from '@/services/sowingWindowEngine';
import { estimateHarvestPeriod } from '@/services/harvestDateEstimator';
import {
  getDataProvenanceList,
  generateCalculationTraces,
} from '@/services/dataProvenanceService';
import { WaterBalanceCard } from '@/components/soil/WaterBalanceCard';
import { SowingHarvestRecommendation } from '@/components/soil/SowingHarvestRecommendation';
import { CalculationTraceModal } from '@/components/soil/CalculationTraceModal';

const SoilMapPicker = dynamic(
  () => import('@/components/soil/SoilMapPicker').then((mod) => mod.SoilMapPicker),
  { ssr: false }
);

// Comprehensive list of Indian States & UTs
const INDIAN_STATES = [
  'Rajasthan', 'Maharashtra', 'Madhya Pradesh', 'Gujarat', 'Punjab',
  'Haryana', 'Uttar Pradesh', 'Karnataka', 'Tamil Nadu', 'Telangana',
  'Andhra Pradesh', 'Bihar', 'West Bengal', 'Odisha', 'Chhattisgarh',
  'Jharkhand', 'Assam', 'Kerala', 'Himachal Pradesh', 'Uttarakhand',
  'Goa', 'Arunachal Pradesh', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Sikkim', 'Tripura', 'Delhi', 'Jammu and Kashmir',
  'Ladakh', 'Puducherry'
];

export default function KnowYourSoilPage() {
  const [lang, setLang] = useState<'en' | 'hi'>('en');

  // 1. Form States initialized to Jaipur, Rajasthan (accurate defaults)
  const [state, setState] = useState<string>('Rajasthan');
  const [district, setDistrict] = useState<string>('Jaipur');
  const [village, setVillage] = useState<string>('Sanganer');
  const [lat, setLat] = useState<number>(26.9124);
  const [lng, setLng] = useState<number>(75.7873);
  const [isMapOpen, setIsMapOpen] = useState<boolean>(false);

  const [selectedSoilType, setSelectedSoilType] = useState<SoilTextureType>('sandy_loam');
  const [selectedCropId, setSelectedCropId] = useState<string>('pearl_millet');

  // Optional Advanced parameters
  const [isAdvancedOpen, setIsAdvancedOpen] = useState<boolean>(false);
  const [farmAreaAcres, setFarmAreaAcres] = useState<number>(3.5);
  const [rootDepthOverrideMm, setRootDepthOverrideMm] = useState<number>(700);
  const [manualSensorMoisturePercent, setManualSensorMoisturePercent] = useState<number>(45);

  // 2. Calculation / Engine Results
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [waterBalanceResult, setWaterBalanceResult] = useState<WaterBalanceResult | null>(null);
  const [sowingRec, setSowingRec] = useState<SowingRecommendation | null>(null);
  const [harvestEst, setHarvestEst] = useState<HarvestEstimation | null>(null);
  const [calculationTraces, setCalculationTraces] = useState<CalculationTrace[]>([]);
  const [provenanceList, setProvenanceList] = useState<DataProvenance[]>([]);

  const isHi = lang === 'hi';

  // Toggle Language
  const handleToggleLang = () => {
    const nLang = lang === 'en' ? 'hi' : 'en';
    setLang(nLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agroeye_lang', nLang);
    }
  };

  // Restore saved farm location from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedLang = (localStorage.getItem('agroeye_lang') as 'en' | 'hi') || 'en';
      setLang(savedLang);

      const savedLoc = localStorage.getItem('agroeye_saved_farm_location');
      if (savedLoc) {
        try {
          const parsed = JSON.parse(savedLoc);
          if (parsed && parsed.lat && parsed.lng) {
            setLat(parsed.lat);
            setLng(parsed.lng);
            if (parsed.name) setVillage(parsed.name.split(',')[0]);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  // When state changes, update available districts and auto-sync coordinates
  const currentDistricts = getDistrictsForState(state);

  const handleStateChange = (newState: string) => {
    setState(newState);
    const distList = getDistrictsForState(newState);
    const firstDist = distList[0] || 'Central District';
    setDistrict(firstDist);

    const details = getDistrictDetails(newState, firstDist);
    setVillage(details.defaultLandmark);
    setLat(details.lat);
    setLng(details.lng);
    setSelectedSoilType(details.primarySoil);
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const details = getDistrictDetails(state, newDist);
    setVillage(details.defaultLandmark);
    setLat(details.lat);
    setLng(details.lng);
    setSelectedSoilType(details.primarySoil);
  };

  // Handle Location Selected on Map Picker
  const handleMapLocationSelect = (newLat: number, newLng: number, placeName: string) => {
    setLat(newLat);
    setLng(newLng);
    setVillage(placeName.split(',')[0] || placeName);
    const estimated = estimateRegionalSoil(state, district, newLat, newLng);
    setSelectedSoilType(estimated.id);
  };

  // Run the full physical water balance and agronomic engine
  const handleRunAnalysis = useCallback(async () => {
    setIsLoading(true);

    try {
      const soilProfile = SOIL_PROFILES_DATABASE[selectedSoilType] || SOIL_PROFILES_DATABASE.sandy_loam;
      const cropProfile = getCropProfileById(selectedCropId);

      // Real-time running month and year
      const now = new Date();
      const targetYear = now.getFullYear();
      const targetMonth = now.getMonth() + 1;
      const currentDay = now.getDate();
      const effectiveIrrigationMethod: IrrigationMethod = 'rainfed';

      // 1. Fetch real historical daily rainfall & normals for the crop's season
      const rainfallSummary = await fetchHistoricalMonthlyRainfall(
        lat,
        lng,
        targetYear,
        targetMonth,
        state,
        district
      );

      // 2. Fetch multi-year climate context (past 10 years)
      const multiYearRecords = await fetchMultiYearRainfall(
        lat,
        lng,
        targetMonth,
        targetYear,
        10,
        state,
        district
      );

      // 3. Execute daily time-step water-balance simulation
      const result = runSoilWaterBalanceSimulation({
        state,
        district,
        village,
        lat,
        lng,
        month: targetMonth,
        year: targetYear,
        monthName: rainfallSummary.monthName,
        soil: soilProfile,
        crop: cropProfile,
        irrigationMethod: effectiveIrrigationMethod,
        effectiveRootDepthMm: rootDepthOverrideMm || cropProfile.defaultRootDepthMm,
        dailyWeather: rainfallSummary.dailyData,
        multiYearRecords,
        longTermNormalMm: rainfallSummary.longTermNormalMm,
        initialSoilMoisturePercent: manualSensorMoisturePercent,
      });

      // 4. Evaluate optimal sowing window
      const sowing = evaluateBestSowingWindow(
        cropProfile,
        soilProfile,
        state,
        district,
        effectiveIrrigationMethod,
        result.finalAvailableWaterPercent,
        result.totalRainfallMm
      );

      // 5. Estimate harvest and growth stages timeline
      const harvest = estimateHarvestPeriod(
        cropProfile,
        targetMonth,
        currentDay,
        targetYear
      );

      // 6. Generate full data provenance & mathematical calculation trace
      const traces = generateCalculationTraces(result);
      const provenance = getDataProvenanceList();

      setWaterBalanceResult(result);
      setSowingRec(sowing);
      setHarvestEst(harvest);
      setCalculationTraces(traces);
      setProvenanceList(provenance);
    } catch (err) {
      console.error('Soil water balance calculation error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [
    state,
    district,
    village,
    lat,
    lng,
    selectedSoilType,
    selectedCropId,
    rootDepthOverrideMm,
    manualSensorMoisturePercent,
  ]);

  // Run calculation on initial load and when state, district, crop, or soil changes
  useEffect(() => {
    handleRunAnalysis();
  }, [handleRunAnalysis]);

  const activeSoil = SOIL_PROFILES_DATABASE[selectedSoilType] || SOIL_PROFILES_DATABASE.sandy_loam;
  const activeCrop = getCropProfileById(selectedCropId);

  return (
    <div className="min-h-screen flex flex-col bg-[#f8faf8] text-slate-900 selection:bg-emerald-100 selection:text-emerald-900 pb-20">
      {/* 1. Header with Breadcrumb & Language Switcher */}
      <header className="sticky top-0 w-full z-40 bg-white/95 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="h-16 px-4 max-w-6xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Return to Home"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-headline font-bold text-lg shadow-sm">
              🌾
            </div>
            <div>
              <h1 className="font-headline text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-none block">
                {isHi ? 'अपनी मिट्टी को जानें (Know Your Soil)' : 'AgroEye • Know Your Soil'}
              </h1>
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                {isHi ? 'मृदा जल-धारण एवं फसल बुवाई खिड़की मॉडल' : 'Soil Water Balance & Sowing Window Engine'}
              </span>
            </div>
          </div>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={handleToggleLang}
            className="h-9 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-headline text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-200 cursor-pointer"
            title="Toggle Language"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isHi ? 'EN' : 'HI (हिंदी)'}</span>
          </button>
        </div>
      </header>

      {/* 2. Main Content Container */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-5 space-y-6">
        {/* SECTION A: FARMER INPUT CONFIGURATION FORM */}
        <section className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Sprout className="w-5 h-5 text-emerald-600" />
              <div>
                <h2 className="font-headline text-base sm:text-lg font-extrabold text-slate-900">
                  {isHi ? '1. अपने खेत, मिट्टी एवं फसल का चयन करें' : '1. Select Farm Location, Soil & Crop'}
                </h2>
                <span className="text-xs text-slate-500">
                  {isHi ? 'सटीक जल संतुलन और बुवाई खिड़की विश्लेषण हेतु विवरण भरें' : 'Accurate parameters for scientific water-budget modeling'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMapOpen(!isMapOpen)}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-headline font-bold flex items-center gap-1.5 border border-emerald-200 transition-all cursor-pointer self-start sm:self-auto"
            >
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isMapOpen ? (isHi ? 'नक्शा छिपाएं' : 'Hide Map') : (isHi ? '🗺️ नक्शे पर खेत चुनें' : '🗺️ Pick on Map')}</span>
            </button>
          </div>

          {/* Interactive Map Drawer if toggled */}
          {isMapOpen && (
            <div className="animate-in fade-in slide-in-from-top-2">
              <SoilMapPicker
                lat={lat}
                lng={lng}
                locationName={`${village}, ${district}`}
                onLocationSelect={handleMapLocationSelect}
                lang={lang}
              />
            </div>
          )}

          {/* Location Inputs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* 1. State */}
            <div className="space-y-1">
              <label className="text-xs font-headline font-bold text-slate-700 block">
                {isHi ? 'राज्य (State)' : 'State'}
              </label>
              <select
                value={state}
                onChange={(e) => handleStateChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-headline text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {INDIAN_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. District */}
            <div className="space-y-1">
              <label className="text-xs font-headline font-bold text-slate-700 block">
                {isHi ? 'ज़िला (District)' : 'District'}
              </label>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-headline text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {currentDistricts.map((dst) => (
                  <option key={dst} value={dst}>
                    {dst}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Village / Location Landmark */}
            <div className="space-y-1">
              <label className="text-xs font-headline font-bold text-slate-700 block">
                {isHi ? 'गाँव / क्षेत्र (Village / Landmark)' : 'Village / Landmark'}
              </label>
              <input
                type="text"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                placeholder="Village or plot landmark"
                className="w-full h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-headline text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Soil Type & Crop Selection Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            {/* Soil Type Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-headline font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-700" />
                  <span>{isHi ? 'मृदा प्रकार / बनावट (Soil Type)' : 'Soil Type / Texture'}</span>
                </label>
                <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-headline font-semibold">
                  AWC: {Math.round(activeSoil.availableWaterCapacity * 1000)} mm/m
                </span>
              </div>

              <select
                value={selectedSoilType}
                onChange={(e) => setSelectedSoilType(e.target.value as SoilTextureType)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-headline font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {Object.values(SOIL_PROFILES_DATABASE).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 leading-tight">
                {activeSoil.description} • <em>{activeSoil.regionalClassification}</em>
              </p>
            </div>

            {/* Crop Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-headline font-bold text-slate-800 flex items-center gap-1.5">
                  <Sprout className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isHi ? 'फसल चयन (Crop Selection)' : 'Crop Selection'}</span>
                </label>
                <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-headline font-semibold">
                  {activeCrop.category} • {activeCrop.defaultDurationDays}d
                </span>
              </div>

              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-headline font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {CROPS_DATABASE.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.primarySeason.toUpperCase()})
                  </option>
                ))}
              </select>
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{isHi ? `जल मांग: ${activeCrop.totalWaterRequirementMm[0]}-${activeCrop.totalWaterRequirementMm[1]} mm` : `Water Demand: ${activeCrop.totalWaterRequirementMm[0]}-${activeCrop.totalWaterRequirementMm[1]} mm`}</span>
                <span className="font-semibold text-emerald-700">{isHi ? activeCrop.maturityTerminologyHi : activeCrop.maturityTerminology}</span>
              </div>
            </div>
          </div>

          {/* Optional Advanced Field Overrides (Accordion) */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="text-xs font-headline font-bold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{isHi ? 'अतिरिक्त खेत विवरण (ऐच्छिक)' : 'Optional Field Details (Root depth, Sensor override)'}</span>
              {isAdvancedOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {isAdvancedOpen && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 animate-in fade-in">
                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-medium block">
                    {isHi ? 'खेत का क्षेत्रफल (एकड़)' : 'Farm Area (Acres)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={farmAreaAcres}
                    onChange={(e) => setFarmAreaAcres(parseFloat(e.target.value) || 1)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-headline"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-medium block">
                    {isHi ? 'जड़ क्षेत्र की गहराई (Root Depth mm)' : 'Root Zone Depth (mm)'}
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={rootDepthOverrideMm}
                    onChange={(e) => setRootDepthOverrideMm(parseInt(e.target.value) || 600)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-headline"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] text-slate-500 font-medium block">
                    {isHi ? 'वर्तमान सेंसर नमी (ESP32 / Manual %)' : 'Current Sensor Reading (% VWC)'}
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="100"
                    value={manualSensorMoisturePercent}
                    onChange={(e) => setManualSensorMoisturePercent(parseInt(e.target.value) || 45)}
                    className="w-full h-9 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-headline"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleRunAnalysis}
              disabled={isLoading}
              className="w-full sm:w-auto h-12 px-8 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-headline text-xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md transition-all active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isHi ? 'डेटा विश्लेषण जारी...' : 'Analyzing Soil & Rainfall Feed...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isHi ? 'मृदा जल-संतुलन एवं बुवाई खिड़की गणना करें' : 'Analyze Soil & Sowing Window'}</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* SECTION B: WATER-BALANCE ENGINE RESULTS */}
        {waterBalanceResult && sowingRec && harvestEst && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Results Context Sub-Header */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                  <span className="font-headline text-[10px] uppercase tracking-wider text-emerald-800 font-bold">
                    {isHi ? 'सत्यापित कृषि डेटा एवं मॉडल आउटपुट' : 'Verified Agricultural Model Results'}
                  </span>
                </div>
                <h2 className="font-headline text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  📍 {village}, {district} ({waterBalanceResult.analysisPeriod.monthName})
                </h2>
                <p className="text-xs text-slate-500 font-medium">
                  {activeCrop.name} • {activeSoil.name}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-headline font-bold text-slate-700">
                  AWC: {Math.round(waterBalanceResult.AWC * 1000)} mm/m
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-headline font-bold text-emerald-800">
                  TAW: {waterBalanceResult.TAW} mm
                </span>
              </div>
            </div>

            {/* 2. The 9 Core Scientifically Defensible Water-Balance Cards */}
            <WaterBalanceCard result={waterBalanceResult} lang={lang} />

            {/* 3. Best Sowing Window & Estimated Harvest Period Section */}
            <SowingHarvestRecommendation
              sowing={sowingRec}
              harvest={harvestEst}
              cropName={activeCrop.name}
              soilName={activeSoil.name}
              lang={lang}
            />

            {/* 6. Transparent Mathematical Calculation Trace & Provenance Drawer */}
            <CalculationTraceModal
              traces={calculationTraces}
              provenance={provenanceList}
              lang={lang}
            />
          </div>
        )}
      </main>
    </div>
  );
}
